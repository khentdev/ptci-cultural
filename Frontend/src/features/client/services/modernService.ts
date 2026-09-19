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
        const res = await axiosInstance.get("/teams/readTeams.php")
        return GetTypedResponse<GetModernTeamDTO>(res)
    },

    /** One all-or-nothing POST; replaces the old per-row fan-out. */
    createModernScoreBatch: async (data: CreateModernScoreParams[]) => {
        const res = await axiosInstance.post("/category/modern_dance/batchScore.php", data)
        return GetTypedResponse<CreateModernScoreDTO>(res)
    },

    /** Scores the signed-in judge has already committed for this category. */
    getMyModernScores: async () => {
        const res = await axiosInstance.get("/category/modern_dance/myScores.php")
        return GetTypedResponse<GetMyModernScoresResponse>(res)
    },
}
