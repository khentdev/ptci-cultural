export type TeamData = {
    team_id: string,
    team: string,
    created_at: string
}

export type GetTeamsDTO = {
    status: number,
    message: string,
    data: TeamData[]
}

export type CreateTeamParams = {
    team: string,
}

export type UpdateTeamParams = { team_id: string } & CreateTeamParams

export type CreateTeamDTO = { status: string, message: string }
export type UpdateTeamDTO = CreateTeamDTO
export type DeleteTeamDTO = { status: string, message: string }
export type DeleteTeamParams = { id: string }

export type TeamErrorResponse = {
    status: number,
    message: string
}

export type TeamFormErrors = {
    general: string
}
