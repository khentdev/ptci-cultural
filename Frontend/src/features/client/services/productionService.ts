import axiosInstance from "../../../core/API/axiosConfig";
import type { GetCandidatesDTO } from "../../settings/types/candidates";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type { CreateProductionScoreDTO, CreateProductionScoreParams } from "../types/production/types";

export const productionService = {
    getCandidates: async () => {
        const res = await axiosInstance.get("/contestants/readContestants.php")
        return GetTypedResponse<GetCandidatesDTO>(res)
    },
    createProductionScore: async (data: CreateProductionScoreParams) => {
        const res = await axiosInstance.post("/category/production/createProductionScore.php", data)
        return GetTypedResponse<CreateProductionScoreDTO>(res)
    }
}
