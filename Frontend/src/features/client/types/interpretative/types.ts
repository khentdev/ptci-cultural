import type { CandidateTeamOptions } from "../talent/types"

export type CreateInterpretativeScoreParams = {
    team_id: number,
    originality: number,
    mastery_of_steps: number,
    choreography_and_style: number,
    costume_and_props: number,
    stage_presence: number
}

export type GetInterpretativeTeamDTO = {
    status: number,
    mesage: string,
    data: InterpretativeTeam[]
}

export type InterpretativeTeam = {
    team_id: string,
    team: CandidateTeamOptions,
    created_at: string
}

export type CreateInterpretativeScoreDTO = {
    status: number;
    message: string;
}

export type InterpretativeScoreErrorResponse = {
    status: number;
    message: string
}