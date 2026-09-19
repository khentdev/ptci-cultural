import type { TeamData, GetTeamsDTO } from "./teams"

export type { TeamData, GetTeamsDTO }

export type GenderOptions = "male" | "female" | "other"

export const GENDER_OPTIONS: GenderOptions[] = ["male", "female", "other"]

export type ContestantData = {
    cand_id: string,
    cand_number: string,
    cand_name: string,
    team_id: string,
    /** Display name of the team, joined server-side. */
    cand_team: string,
    cand_gender: GenderOptions,
    created_at: string
}

export type GetContestantsDTO = {
    status: number,
    message: string,
    data: ContestantData[]
}

export type CreateContestantParams = {
    cand_number: string,
    cand_name: string,
    team_id: string,
    cand_gender: GenderOptions,
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
