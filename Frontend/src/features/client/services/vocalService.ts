import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type { CreateVocalScoreDTO, CreateVocalScoreParams, GetVocalCandidatesDTO } from "../types/vocal/types";

export const vocalService = {
    getCandidates: async () => {
        const res = await axiosInstance.get("/vocal_contestants/readContestants.php")
        return GetTypedResponse<GetVocalCandidatesDTO>(res)
    },
    createVocalScore: async (data: CreateVocalScoreParams) => {
        const res = await axiosInstance.post("/category/vocal_solo/createVocalScore.php", data)
        return GetTypedResponse<CreateVocalScoreDTO>(res)
    }
}
