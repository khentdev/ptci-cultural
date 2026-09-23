import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type {
    CreateCulturalScoreDTO,
    CreateCulturalScoreParams,
    GetCulturalTeamDTO,
    GetMyCulturalScoresResponse,
} from "../types/cultural/types";

export const culturalService = {
    getTeams: async () => {
        const res = await axiosInstance.get("/teams")
        return GetTypedResponse<GetCulturalTeamDTO>(res)
    },

    createCulturalScoreBatch: async (data: CreateCulturalScoreParams[]) => {
        const res = await axiosInstance.post("/scores/cultural/batch", data)
        return GetTypedResponse<CreateCulturalScoreDTO>(res)
    },

    getMyCulturalScores: async () => {
        const res = await axiosInstance.get("/scores/cultural/mine")
        return GetTypedResponse<GetMyCulturalScoresResponse>(res)
    },
}
