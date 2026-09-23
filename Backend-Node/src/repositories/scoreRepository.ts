import { teamOrderSql } from '../scoring/teamOrder.js'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import type { Pool, PoolConnection } from 'mysql2/promise'
import { getPool } from '../db/pool.js'
import { CATEGORIES, type CategoryConfig, type CategoryKey } from '../scoring/categories.js'
import type { Gender } from '../types/index.js'

/*
 * Table and column names below are interpolated into SQL. They ALWAYS come from
 * scoring/categories.ts (a static config), never from request input.
 *
 * A category scores either a contestant or a team; `cat.subject` supplies the
 * join table, the id column and the display column for both shapes.
 */

const isDuplicateKey = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ER_DUP_ENTRY'

/** Columns describing the subject, selected alongside every score row. */
function subjectColumns(cat: CategoryConfig): string {
  return cat.subject.kind === 'contestant'
    ? 'c.cand_id, c.cand_number, c.cand_name, c.cand_gender, t.team_id, t.team'
    : 'c.team_id, c.team'
}

/** Contestant rows need a second hop to reach the team name. */
function subjectJoin(cat: CategoryConfig): string {
  const base = `JOIN ${cat.subject.table} c ON c.${cat.subject.idColumn} = s.${cat.subject.idColumn}`
  return cat.subject.kind === 'contestant' ? `${base}\n     JOIN teams t ON t.team_id = c.team_id` : base
}

/** Contestants order by their printed number; teams have none, so order by name. */
function subjectOrder(cat: CategoryConfig): string {
  return cat.subject.kind === 'contestant' ? 'CAST(c.cand_number AS UNSIGNED) ASC' : teamOrderSql('c.team')
}

function subjectGroupBy(cat: CategoryConfig): string {
  return cat.subject.kind === 'contestant'
    ? 'c.cand_id, c.cand_number, c.cand_name, c.cand_gender, t.team_id, t.team'
    : 'c.team_id, c.team'
}

export type ScoreInsert = {
  category: CategoryKey
  judgeId: number
  /** Id of whatever this category scores — a contestant or a team. */
  subjectId: number
  /** column → value (already validated against the category's criteria) */
  values: Record<string, number>
  total: number
}

/**
 * Returns the new score_id, or `'duplicate'` when this judge already scored the subject.
 * Pass a `PoolConnection` (from `withTransaction`) to make this insert part of a larger transaction.
 */
export async function insertScore(input: ScoreInsert, runner: Pool | PoolConnection = getPool()): Promise<number | 'duplicate'> {
  const cat = CATEGORIES[input.category]
  const columns = cat.criteria.map((c) => c.column)
  const sql = `INSERT INTO ${cat.table} (judge_id, ${cat.subject.idColumn}, ${columns.join(', ')}, total_score)
    VALUES (?, ?, ${columns.map(() => '?').join(', ')}, ?)`
  const params = [input.judgeId, input.subjectId, ...columns.map((col) => input.values[col] ?? 0), input.total]
  try {
    const [result] = await runner.execute<ResultSetHeader>(sql, params)
    return result.insertId
  } catch (err) {
    if (isDuplicateKey(err)) return 'duplicate'
    throw err
  }
}

export interface JudgeScoreRow extends RowDataPacket {
  score_id: number
  judge_id: number
  judge_name: string
  total_score: string
  created_at: Date
  team_id: number
  team: string
  // contestant categories only
  cand_id?: number
  cand_number?: string
  cand_name?: string
  cand_gender?: Gender
  // plus one string column per criterion
  [criterion: string]: unknown
}

/** Every individual score in a category (one row per judge × subject). */
export async function listJudgeScores(category: CategoryKey): Promise<JudgeScoreRow[]> {
  const cat = CATEGORIES[category]
  const criteria = cat.criteria.map((c) => `s.${c.column}`).join(', ')
  const [rows] = await getPool().query<JudgeScoreRow[]>(
    `SELECT s.score_id, s.judge_id, u.username AS judge_name,
            ${subjectColumns(cat)},
            ${criteria}, s.total_score, s.created_at
     FROM ${cat.table} s
     ${subjectJoin(cat)}
     JOIN users u ON u.id = s.judge_id
     ORDER BY s.judge_id ASC, ${subjectOrder(cat)}`,
  )
  return rows
}

/** One judge's own scores in a category (their rows only, one per judge × subject). */
export async function listJudgeOwnScores(category: CategoryKey, judgeId: number): Promise<JudgeScoreRow[]> {
  const cat = CATEGORIES[category]
  const criteria = cat.criteria.map((c) => `s.${c.column}`).join(', ')
  const [rows] = await getPool().query<JudgeScoreRow[]>(
    `SELECT s.score_id, s.judge_id, u.username AS judge_name,
            ${subjectColumns(cat)},
            ${criteria}, s.total_score, s.created_at
     FROM ${cat.table} s
     ${subjectJoin(cat)}
     JOIN users u ON u.id = s.judge_id
     WHERE s.judge_id = ?
     ORDER BY ${subjectOrder(cat)}`,
    [judgeId],
  )
  return rows
}

export interface SubjectAggregateRow extends RowDataPacket {
  score_id: number
  total_score: string
  judges_count: number
  created_at: Date
  updated_at: Date
  team_id: number
  team: string
  cand_id?: number
  cand_number?: string
  cand_name?: string
  cand_gender?: Gender
  [criterion: string]: unknown
}

/** Per-subject averages across all judges for one category (the "scoreboard" view). */
export async function aggregateBySubject(category: CategoryKey): Promise<SubjectAggregateRow[]> {
  const cat = CATEGORIES[category]
  const criteria = cat.criteria.map((c) => `ROUND(AVG(s.${c.column}), 2) AS ${c.column}`).join(', ')
  const [rows] = await getPool().query<SubjectAggregateRow[]>(
    `SELECT MIN(s.score_id) AS score_id,
            ${subjectColumns(cat)},
            ${criteria},
            ROUND(AVG(s.total_score), 2) AS total_score,
            COUNT(*) AS judges_count,
            MIN(s.created_at) AS created_at,
            MAX(s.created_at) AS updated_at
     FROM ${cat.table} s
     ${subjectJoin(cat)}
     GROUP BY ${subjectGroupBy(cat)}
     ORDER BY total_score DESC, ${subjectOrder(cat)}`,
  )
  return rows
}

/** Has this judge submitted anything in the category yet? */
export async function judgeHasScored(category: CategoryKey, judgeId: number): Promise<boolean> {
  const cat = CATEGORIES[category]
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SELECT 1 FROM ${cat.table} WHERE judge_id = ? LIMIT 1`,
    [judgeId],
  )
  return rows.length > 0
}

/**
 * How many subjects this judge has scored, and how many exist. A judge is finished
 * with a category once those match — this replaces the talent app's both-genders rule.
 * Pass a `PoolConnection` to see uncommitted rows inside a transaction.
 */
export async function judgeCategoryProgress(
  category: CategoryKey,
  judgeId: number,
  runner: Pool | PoolConnection = getPool(),
): Promise<{ scored: number; total: number }> {
  const cat = CATEGORIES[category]
  const [scoredRows] = await runner.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT ${cat.subject.idColumn}) AS n FROM ${cat.table} WHERE judge_id = ?`,
    [judgeId],
  )
  const [totalRows] = await runner.query<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM ${cat.subject.table}`)
  return { scored: Number(scoredRows[0]?.n ?? 0), total: Number(totalRows[0]?.n ?? 0) }
}
