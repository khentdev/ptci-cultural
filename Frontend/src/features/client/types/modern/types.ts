import type { CandidateTeamOptions } from "../shared/types"

export type CreateModernScoreParams = {
    team_id: number,
    audience_impact: number,
    mastery_of_steps: number,
    choreography_and_style: number,
    costume_and_props: number,
    stage_presence: number,
}

export type GetModernTeamDTO = {
    status: number,
    message: string,
    data: ModernTeam[]
}

export type ModernTeam = {
    team_id: string,
    team: CandidateTeamOptions,
    created_at: string
}

export type CreateModernScoreDTO = {
    status: number,
    message: string,
    has_submitted?: boolean,
    results?: { team_id: number, score_id: number, total_score: string }[]
}

export type MyModernScoreDTO = {
    score_id: string,
    team_id: string,
    audience_impact: string,
    mastery_of_steps: string,
    choreography_and_style: string,
    costume_and_props: string,
    stage_presence: string,
    total_score: string,
    created_at: string
}

/** Scores THIS judge has already committed - the server-side "already submitted" source of truth. */
export type GetMyModernScoresResponse = {
    status: number,
    message: string,
    data: MyModernScoreDTO[]
}

export type ModernScoreErrorResponse = {
    status: number,
    message: string
}
