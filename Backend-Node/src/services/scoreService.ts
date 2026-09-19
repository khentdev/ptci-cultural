import { z } from 'zod'
import { withTransaction } from '../db/pool.js'
import { forbidden, notFound, unprocessable } from '../lib/httpError.js'
import { validate } from '../lib/validate.js'
import { findContestantById } from '../repositories/contestantRepository.js'
import { findTeamById } from '../repositories/teamRepository.js'
import { insertScore, judgeCategoryProgress } from '../repositories/scoreRepository.js'
import { setHasSubmitted } from '../repositories/userRepository.js'
import { CATEGORIES, CATEGORY_KEYS, type CategoryConfig, type CategoryKey } from '../scoring/categories.js'
import type { UserRecord } from '../types/index.js'

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Resolve whatever the category scores — a contestant for Vocal Solo, a team for
 * the dances — into a label used in success and error messages.
 */
async function findSubject(cat: CategoryConfig, id: number): Promise<{ id: number; label: string } | null> {
  if (cat.subject.kind === 'contestant') {
    const contestant = await findContestantById(id)
    return contestant ? { id: contestant.candId, label: `#${contestant.candNumber} ${contestant.candName}` } : null
  }
  const team = await findTeamById(id)
  return team ? { id: team.teamId, label: team.team } : null
}

/** Accepts 8, "8", 8.5, "8.50" — at most two decimals, within [0, max]. */
const scoreValue = (max: number) =>
  z.coerce
    .number({ message: 'Score must be a number' })
    .min(0, 'Score cannot be negative')
    .max(max, `Score cannot exceed ${max}`)
    .refine((n) => Number.isFinite(n) && Math.abs(n * 100 - Math.round(n * 100)) < 1e-9, {
      message: 'Score may have at most two decimal places',
    })

const schemaCache = new Map<CategoryKey, z.ZodType<Record<string, unknown>>>()

/** Build (once) the zod schema for a category from its criteria config. */
export function scoreBodySchema(cat: CategoryConfig): z.ZodType<Record<string, unknown>> {
  const cached = schemaCache.get(cat.key)
  if (cached) return cached
  const noun = cat.subject.noun.toLowerCase()
  const shape: Record<string, z.ZodType> = {
    [cat.subject.idColumn]: z.coerce
      .number()
      .int(`Invalid ${noun}`)
      .positive(`Invalid ${noun}`),
  }
  for (const c of cat.criteria) shape[c.bodyKey] = scoreValue(c.max)
  const schema = z.object(shape)
  schemaCache.set(cat.key, schema)
  return schema
}

export type SubmitScoreResult = {
  status: number
  message: string
  score_id: number
  total_score: string
  has_submitted: boolean
}

/**
 * Validate and persist one judge's score for one candidate in a category.
 * 403 wrong role · 404 unknown candidate · 422 invalid values or duplicate.
 */
export async function submitScore(category: CategoryKey, judge: UserRecord, body: unknown): Promise<SubmitScoreResult> {
  const cat = CATEGORIES[category]
  if (!cat.submitRoles.includes(judge.role)) throw forbidden('Only judges can submit scores.')

  const input = validate(scoreBodySchema(cat), body) as Record<string, number>
  const subjectId = input[cat.subject.idColumn] as number

  const subject = await findSubject(cat, subjectId)
  if (!subject) throw notFound(`${cat.subject.noun} not found.`)

  const values: Record<string, number> = {}
  let total = 0
  for (const c of cat.criteria) {
    const v = round2(input[c.bodyKey] ?? 0)
    values[c.column] = v
    total += v
  }
  total = round2(total)

  const inserted = await insertScore({ category, judgeId: judge.id, subjectId, values, total })
  if (inserted === 'duplicate') {
    throw unprocessable(`You have already submitted a ${cat.label} score for ${subject.label}.`)
  }

  // `has_submitted` is reported, never flipped here: the frontend fires one request per
  // subject, and locking the account on the first success would strand the rest of the
  // batch after a partial failure/reload. Only PUT /auth/has-submitted sets the flag.
  return {
    status: 200,
    message: `${cat.label} score for ${subject.label} submitted successfully.`,
    score_id: inserted,
    total_score: total.toFixed(2),
    has_submitted: judge.hasSubmitted,
  }
}

const scoreBatchBodySchema = (cat: CategoryConfig) => z.array(scoreBodySchema(cat)).min(1, 'At least one score is required')

export type BatchSubmitScoreResult = {
  status: number
  message: string
  /** `subject_id` is the contestant or team id, whichever the category scores. */
  results: { subject_id: number; score_id: number; total_score: string }[]
  has_submitted: boolean
}

/**
 * Validate and persist a judge's scores for every candidate in one shot. Atomic: all rows are
 * inserted in a single DB transaction, or nothing is written. `has_submitted` is set in that same
 * transaction, but only once the judge has scored every subject in EVERY category.
 * 403 wrong role · 404 unknown subject · 422 invalid values or duplicate (rolls back everything).
 */
export async function submitScoresBatch(category: CategoryKey, judge: UserRecord, body: unknown): Promise<BatchSubmitScoreResult> {
  const cat = CATEGORIES[category]
  if (!cat.submitRoles.includes(judge.role)) throw forbidden('Only judges can submit scores.')

  const items = validate(scoreBatchBodySchema(cat), body) as Record<string, number>[]

  const results = await withTransaction(async (conn) => {
    const out: { subject_id: number; score_id: number; total_score: string }[] = []
    for (const input of items) {
      const subjectId = input[cat.subject.idColumn] as number
      const subject = await findSubject(cat, subjectId)
      if (!subject) throw notFound(`${cat.subject.noun} not found.`)

      const values: Record<string, number> = {}
      let total = 0
      for (const c of cat.criteria) {
        const v = round2(input[c.bodyKey] ?? 0)
        values[c.column] = v
        total += v
      }
      total = round2(total)

      const inserted = await insertScore({ category, judgeId: judge.id, subjectId, values, total }, conn)
      if (inserted === 'duplicate') {
        throw unprocessable(`You have already submitted a ${cat.label} score for ${subject.label}.`)
      }
      out.push({ subject_id: subjectId, score_id: inserted, total_score: total.toFixed(2) })
    }
    // `has_submitted` is the admin-facing "this judge is done" flag, and Cultural has
    // three categories — so it may only flip once EVERY category is fully scored,
    // not merely the one just submitted.
    let completed = true
    for (const key of CATEGORY_KEYS) {
      const progress = await judgeCategoryProgress(key, judge.id, conn)
      if (progress.total === 0 || progress.scored < progress.total) {
        completed = false
        break
      }
    }
    if (completed) await setHasSubmitted(judge.id, true, conn)
    return { out, completed }
  })

  return {
    status: 200,
    message: `${cat.label} scores submitted successfully.`,
    results: results.out,
    has_submitted: results.completed || judge.hasSubmitted,
  }
}
