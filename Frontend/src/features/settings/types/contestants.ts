import type { CandidateTeamOptions } from "../../client/types/shared/types"

export type { CandidateTeamOptions }

export type ContestantData = {
    cand_id: string,
    cand_name: string,
    cand_team: CandidateTeamOptions,
    created_at: string
}

export type GetContestantsDTO = {
    status: number,
    message: string,
    data: ContestantData[]
}

export type CreateContestantParams = {
    cand_name: string,
    cand_team: CandidateTeamOptions,
}

export type UpdateContestantParams = { cand_id: string } & CreateContestantParams

export type CreateContestantDTO = { status: string, message: string }
export type UpdateContestantDTO = CreateContestantDTO
export type DeleteContestantDTO = { status: string, message: string }
export type DeleteContestantParams = { id: string }

export type ContestantErrorResponse = {
    status: number,
    message: string
}

export type ContestantFormErrors = {
    general: string
}
