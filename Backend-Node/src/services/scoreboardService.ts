import {
  aggregateBySubject,
  listJudgeOwnScores,
  listJudgeScores,
  type JudgeScoreRow,
  type SubjectAggregateRow,
} from '../repositories/scoreRepository.js'
import { CATEGORIES, type CategoryConfig, type CategoryKey } from '../scoring/categories.js'
import type { Gender } from '../types/index.js'

/*
 * All numbers leave here as strings with two decimals and all ids as strings —
 * that is what the Vue DTOs declare (e.g. total_score: string, cand_id: string),
 * and what the old PHP/mysqli backend produced.
 */
const dec = (v: unknown): string => Number(v ?? 0).toFixed(2)
const iso = (v: unknown): string => (v instanceof Date ? v : new Date(String(v))).toISOString()

/**
 * A row identifies either a contestant or a team, depending on the category.
 * The frontend's JudgeScoreRow/FinalScoreRow already declare both sets optional.
 */
type SubjectFields = {
  team_id: string
  team: string
  cand_id?: string
  cand_number?: string
  cand_name?: string
  cand_gender?: Gender
}

function subjectFields(
  cat: CategoryConfig,
  r: { team_id: number; team: string; cand_id?: number; cand_number?: string; cand_name?: string; cand_gender?: Gender },
): SubjectFields {
  const base: SubjectFields = { team_id: String(r.team_id), team: r.team }
  if (cat.subject.kind !== 'contestant') return base
  return {
    ...base,
    cand_id: String(r.cand_id),
    cand_number: r.cand_number,
    cand_name: r.cand_name,
    cand_gender: r.cand_gender,
  }
}

export type JudgeScoreDTO = SubjectFields & {
  score_id: string
  judge_id: string
  judge_name: string
  total_score: string
  created_at: string
  [criterion: string]: string | undefined
}

/** Scores grouped by judge: `{ "<judge_id>": [row, row, ...] }` — the shape JudgeScoresDataTable renders. */
export async function judgeScoresGrouped(category: CategoryKey): Promise<Record<string, JudgeScoreDTO[]>> {
  const cat = CATEGORIES[category]
  const rows = await listJudgeScores(category)
  const grouped: Record<string, JudgeScoreDTO[]> = {}
  for (const r of rows) {
    const dto = toJudgeScoreDTO(cat, r)
    ;(grouped[dto.judge_id] ??= []).push(dto)
  }
  return grouped
}

/** One judge's own scores for a category — the frontend uses this to lock inputs after a refresh. */
export async function myJudgeScores(category: CategoryKey, judgeId: number): Promise<JudgeScoreDTO[]> {
  const cat = CATEGORIES[category]
  const rows = await listJudgeOwnScores(category, judgeId)
  return rows.map((r) => toJudgeScoreDTO(cat, r))
}

function toJudgeScoreDTO(cat: CategoryConfig, r: JudgeScoreRow): JudgeScoreDTO {
  const dto: JudgeScoreDTO = {
    ...subjectFields(cat, r),
    score_id: String(r.score_id),
    judge_id: String(r.judge_id),
    judge_name: r.judge_name,
    total_score: dec(r.total_score),
    created_at: iso(r.created_at),
  }
  for (const c of cat.criteria) dto[c.column] = dec(r[c.column])
  return dto
}

export type SubjectFinalDTO = SubjectFields & {
  score_id: string
  total_score: string
  final_score: string
  judges_count: number
  created_at: string
  updated_at: string
  [criterion: string]: string | number | undefined
}

/**
 * Per-subject averages across judges for one category, best first. Computed on read,
 * so it can never drift from the underlying scores the way a stored final-score table can.
 * Includes `<category>_final_score` alongside the generic `final_score`/`total_score`.
 */
export async function subjectFinals(category: CategoryKey): Promise<SubjectFinalDTO[]> {
  const cat = CATEGORIES[category]
  const rows = await aggregateBySubject(category)
  return rows.map((r) => toFinalDTO(cat, r, `${category}_final_score`))
}

function toFinalDTO(cat: CategoryConfig, r: SubjectAggregateRow, aliasKey: string): SubjectFinalDTO {
  const total = dec(r.total_score)
  const dto: SubjectFinalDTO = {
    ...subjectFields(cat, r),
    score_id: String(r.score_id),
    total_score: total,
    final_score: total,
    judges_count: Number(r.judges_count ?? 0),
    created_at: iso(r.created_at),
    updated_at: iso(r.updated_at),
  }
  dto[aliasKey] = total
  for (const c of cat.criteria) dto[c.column] = dec(r[c.column])
  return dto
}
