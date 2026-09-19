import type { CandidateTeamOptions } from "../shared/types"

export type CreateInterpretativeScoreParams = {
    team_id: number,
    originality: number,
    mastery_of_steps: number,
    choreography_and_style: number,
    costume_and_props: number,
    stage_presence: number,
}

export type GetInterpretativeTeamDTO = {
    status: number,
    message: string,
    data: InterpretativeTeam[]
}

export type InterpretativeTeam = {
    team_id: string,
    team: CandidateTeamOptions,
    created_at: string
}

export type CreateInterpretativeScoreDTO = {
    status: number,
    message: string,
    has_submitted?: boolean,
    results?: { team_id: number, score_id: number, total_score: string }[]
}

export type MyInterpretativeScoreDTO = {
    score_id: string,
    team_id: string,
    originality: string,
    mastery_of_steps: string,
    choreography_and_style: string,
    costume_and_props: string,
    stage_presence: string,
    total_score: string,
    created_at: string
}

/** Scores THIS judge has already committed - the server-side "already submitted" source of truth. */
export type GetMyInterpretativeScoresResponse = {
    status: number,
    message: string,
    data: MyInterpretativeScoreDTO[]
}

export type InterpretativeScoreErrorResponse = {
    status: number,
    message: string
}
