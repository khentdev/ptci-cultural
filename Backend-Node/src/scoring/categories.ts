/**
 * Single source of truth for every judged category: what it scores, its DB table,
 * the criteria a judge submits (request-body key → column), and the maximum points
 * per criterion. Maxima mirror the frontend's SCORE_CRITERIA so the API rejects
 * anything the UI could not have produced. Every category sums to 100.
 *
 * SQL identifiers elsewhere are interpolated ONLY from this file.
 */
export const CATEGORY_KEYS = ['vocal', 'cultural', 'modern'] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export type Criterion = {
  /** Key in the JSON body sent by the frontend. */
  bodyKey: string
  /** Column name in the category's scores table. */
  column: string
  max: number
}

/**
 * What a category scores. Vocal Solo judges an individual contestant; both dance
 * categories judge a whole team. Every subject-dependent query derives from this.
 */
export type SubjectConfig = {
  kind: 'contestant' | 'team'
  /** Table holding the subjects. */
  table: string
  /** Primary key of that table, and the FK column in the scores table. */
  idColumn: string
  /** Column holding the subject's display name. */
  labelColumn: string
  /** Human word for error messages, e.g. "Contestant not found." */
  noun: string
}

const CONTESTANT_SUBJECT: SubjectConfig = {
  kind: 'contestant',
  table: 'contestants',
  idColumn: 'cand_id',
  labelColumn: 'cand_name',
  noun: 'Contestant',
}

const TEAM_SUBJECT: SubjectConfig = {
  kind: 'team',
  table: 'teams',
  idColumn: 'team_id',
  labelColumn: 'team',
  noun: 'Team',
}

export type CategoryConfig = {
  key: CategoryKey
  table: string
  label: string
  subject: SubjectConfig
  criteria: readonly Criterion[]
  /** Which user roles may submit this category. */
  submitRoles: readonly ('admin' | 'judge')[]
}

const c = (bodyKey: string, max: number, column = bodyKey): Criterion => ({ bodyKey, column, max })

export const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  vocal: {
    key: 'vocal',
    table: 'scores_vocal',
    label: 'Vocal Solo',
    subject: CONTESTANT_SUBJECT,
    criteria: [
      c('voice_tone_quality', 30),
      c('mastery_and_timing', 25),
      c('vocal_expression', 15),
      c('diction', 10),
      c('stage_presence', 10),
      c('entertainment_value', 10),
    ],
    submitRoles: ['judge'],
  },
  cultural: {
    key: 'cultural',
    table: 'scores_cultural',
    label: 'Cultural Dance',
    subject: TEAM_SUBJECT,
    criteria: [
      c('originality', 25),
      c('mastery_of_steps', 15),
      c('choreography_and_style', 20),
      c('costume_and_props', 25),
      c('stage_presence', 15),
    ],
    submitRoles: ['judge'],
  },
  modern: {
    key: 'modern',
    table: 'scores_modern',
    label: 'Modern Dance',
    subject: TEAM_SUBJECT,
    criteria: [
      c('mastery_of_steps', 25),
      c('choreography_and_style', 30),
      c('costume_and_props', 20),
      c('stage_presence', 15),
      c('audience_impact', 10),
    ],
    submitRoles: ['judge'],
  },
}

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value)
}
