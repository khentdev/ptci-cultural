import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type {
    CreateVocalScoreDTO,
    CreateVocalScoreParams,
    GetVocalCandidatesDTO,
    GetMyVocalScoresResponse,
} from "../types/vocal/types";

export const vocalService = {
    getCandidates: async () => {
        const res = await axiosInstance.get("/contestants")
        return GetTypedResponse<GetVocalCandidatesDTO>(res)
    },

    createVocalScoreBatch: async (data: CreateVocalScoreParams[]) => {
        const res = await axiosInstance.post("/scores/vocal/batch", data)
        return GetTypedResponse<CreateVocalScoreDTO>(res)
    },

    getMyVocalScores: async () => {
        const res = await axiosInstance.get("/scores/vocal/mine")
        return GetTypedResponse<GetMyVocalScoresResponse>(res)
    },
}
