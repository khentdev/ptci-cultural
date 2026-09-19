import type { CandidateTeamOptions } from "../talent/types"

export type CreateVocalScoreParams = {
    cand_id: number,
    voice_tone_quality: number,
    mastery_and_timing: number,
    vocal_expression: number,
    diction: number,
    stage_presence: number,
    entertainment_value: number
}

export type GetVocalCandidatesDTO = {
    status: number,
    mesage: string,
    data: VocalCandidates[]
}

export type VocalCandidates = {
    cand_id: string,
    cand_name: string,
    cand_team: CandidateTeamOptions,
    created_at: string
}

export type CreateVocalScoreDTO = {
    status: number; message: string;
}

export type VocalScoreErrorResponse = {
    status: number;
    message: string
}