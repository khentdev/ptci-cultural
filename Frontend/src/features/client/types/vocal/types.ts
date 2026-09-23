
export type CreateVocalScoreParams = {
    cand_id: number,
    voice_tone_quality: number,
    mastery_and_timing: number,
    vocal_expression: number,
    diction: number,
    stage_presence: number,
    entertainment_value: number,
}

export type GetVocalCandidatesDTO = {
    status: number,
    message: string,
    data: VocalCandidates[]
}

export type VocalCandidates = {
    cand_id: string,
    /** Running-order number shown to judges; the API sorts the list by it. */
    cand_number: string,
    cand_name: string,
    /** Team display name, joined server-side. */
    cand_team: string,
    created_at: string
}

export type CreateVocalScoreDTO = {
    status: number,
    message: string,
    has_submitted?: boolean,
    results?: { subject_id: number, score_id: number, total_score: string }[]
}

export type MyVocalScoreDTO = {
    score_id: string,
    cand_id: string,
    voice_tone_quality: string,
    mastery_and_timing: string,
    vocal_expression: string,
    diction: string,
    stage_presence: string,
    entertainment_value: string,
    total_score: string,
    created_at: string
}

/** Scores THIS judge has already committed - the server-side "already submitted" source of truth. */
export type GetMyVocalScoresResponse = {
    status: number,
    message: string,
    data: MyVocalScoreDTO[]
}

export type VocalScoreErrorResponse = {
    status: number,
    message: string
}
