import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type { UniformScoresResponseDTO } from "../types/uniformScore";
export const uniformScoresService = {
    getUniformScores: async () => {
        const res = await axiosInstance.get("/category/uniform/readUniformScore.php")
        return GetTypedResponse<UniformScoresResponseDTO>(res)
    }
}