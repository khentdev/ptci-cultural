import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type {
    CreateModernScoreDTO,
    CreateModernScoreParams,
    GetModernTeamDTO,
    GetMyModernScoresResponse,
} from "../types/modern/types";

export const modernService = {
    getTeams: async () => {
        const res = await axiosInstance.get("/teams")
        return GetTypedResponse<GetModernTeamDTO>(res)
    },

    createModernScoreBatch: async (data: CreateModernScoreParams[]) => {
        const res = await axiosInstance.post("/scores/modern/batch", data)
        return GetTypedResponse<CreateModernScoreDTO>(res)
    },

    getMyModernScores: async () => {
        const res = await axiosInstance.get("/scores/modern/mine")
        return GetTypedResponse<GetMyModernScoresResponse>(res)
    },
}
