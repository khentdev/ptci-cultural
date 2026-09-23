
export type ScoreboardCategoryKey = "vocal" | "cultural" | "modern"

export type Criterion = { key: string; label: string; max: number }

export type ScoreboardCategory = {
    key: ScoreboardCategoryKey
    label: string
    /** What is being judged - a named contestant, or a whole team. */
    subject: "contestant" | "team"
    judgesPath: string
    finalPath: string
    criteria: Criterion[]
}

/** One judge's score row from GET /api/scores/:category/judges (already grouped by judge). */
export type JudgeScoreRow = {
    score_id: string
    judge_id: string
    /** The judge's username, joined in by the API. */
    judge_name: string
    total_score: string
    cand_id?: string
    cand_name?: string
    cand_team?: string
    team_id?: string
    team?: string
} & Record<string, string | undefined>

/** Keyed "judge_<id>" by the backend. */
export type JudgeScoresMap = Record<string, JudgeScoreRow[]>

export type GetJudgeScoresDTO = {
    status: number
    message: string
    data: JudgeScoresMap
}

export type FinalScoreRow = {
    final_score: string
    updated_at?: string
    cand_id?: string
    cand_name?: string
    cand_team?: string
    team_id?: string
    team?: string
}

export type GetFinalScoresDTO = {
    status: number
    message: string
    data: FinalScoreRow[]
}

/** Shape both endpoints are normalised into for rendering. */
export type ScoreboardEntry = {
    id: string
    name: string
    team: string
}

export type ScoreboardErrorResponse = {
    status: number
    message: string
}
