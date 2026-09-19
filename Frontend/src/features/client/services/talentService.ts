import axiosInstance from "../../../core/API/axiosConfig";
import type { GetCandidatesDTO } from "../../settings/types/candidates";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type { CreateTalentScoreParams, CreateTalentScoreResponse } from "../types/talent/types";

export const talentService = {
    getCandidates: async () => {
        const res = await axiosInstance.get("/contestants/readContestants.php")
        return GetTypedResponse<GetCandidatesDTO>(res)
    },

    createTalentScore: async (data: CreateTalentScoreParams) => {
        const res = await axiosInstance.post("/category/talent/createTalentScore.php", data)
        return GetTypedResponse<CreateTalentScoreResponse>(res)
    },

}
