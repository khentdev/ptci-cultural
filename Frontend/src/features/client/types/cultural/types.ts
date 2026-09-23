
export type CreateCulturalScoreParams = {
    team_id: number,
    originality: number,
    mastery_of_steps: number,
    choreography_and_style: number,
    costume_and_props: number,
    stage_presence: number,
}

export type GetCulturalTeamDTO = {
    status: number,
    message: string,
    data: CulturalTeam[]
}

export type CulturalTeam = {
    team_id: string,
    team: string,
    created_at: string
}

export type CreateCulturalScoreDTO = {
    status: number,
    message: string,
    has_submitted?: boolean,
    results?: { subject_id: number, score_id: number, total_score: string }[]
}

export type MyCulturalScoreDTO = {
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

export type GetMyCulturalScoresResponse = {
    status: number,
    message: string,
    data: MyCulturalScoreDTO[]
}

export type CulturalScoreErrorResponse = {
    status: number,
    message: string
}
