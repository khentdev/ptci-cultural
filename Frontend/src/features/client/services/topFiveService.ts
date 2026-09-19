import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type { CreateTopFiveScoreDTO, CreateTopFiveScoreParams, GetTopFiveScoreDTO } from "../types/top-five/types";

export const topFiveService = {
    getTopFiveCandidates: async () => {
        const res = await axiosInstance.get("/category/top_5/readTop5Score.php")
        return GetTypedResponse<GetTopFiveScoreDTO>(res)
    },
    createTopFiveScore: async (data: CreateTopFiveScoreParams) => {
        const res = await axiosInstance.post("/category/top_5/createTop5Score.php", data)
        return GetTypedResponse<CreateTopFiveScoreDTO>(res)
    }
}
