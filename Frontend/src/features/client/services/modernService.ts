import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type { CreateModernScoreDTO, CreateModernScoreParams, GetModernTeamDTO } from "../types/modern/types";

export const modernService = {
    getTeams: async () => {
        const res = await axiosInstance.get("/teams/readTeams.php")
        return GetTypedResponse<GetModernTeamDTO>(res)
    },
    createModernScore: async (data: CreateModernScoreParams) => {
        const res = await axiosInstance.post("/category/modern_dance/createModernScore.php", data)
        return GetTypedResponse<CreateModernScoreDTO>(res)
    }
}
