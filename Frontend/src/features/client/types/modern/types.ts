import type { CandidateTeamOptions } from "../talent/types"

export type CreateModernScoreParams = {
    cand_id: number
    team_id: number
    audience_impact: number
    mastery_of_steps: number
    choreography_and_style: number
    costume_and_props: number
    stage_presence: number
}

export type GetModernTeamDTO = {
    status: number,
    mesage: string,
    data: ModernTeam[]
}

export type ModernTeam = {
    team_id: string,
    team: CandidateTeamOptions,
    created_at: string
}

export type CreateModernScoreDTO = {
    status: number;
    message: string;
}

export type ModernScoreErrorResponse = {
    status: number;
    message: string
}