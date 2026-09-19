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
        const res = await axiosInstance.get("/vocal_contestants/readContestants.php")
        return GetTypedResponse<GetVocalCandidatesDTO>(res)
    },

    /** One all-or-nothing POST; replaces the old per-row fan-out. */
    createVocalScoreBatch: async (data: CreateVocalScoreParams[]) => {
        const res = await axiosInstance.post("/category/vocal_solo/batchScore.php", data)
        return GetTypedResponse<CreateVocalScoreDTO>(res)
    },

    /** Scores the signed-in judge has already committed for this category. */
    getMyVocalScores: async () => {
        const res = await axiosInstance.get("/category/vocal_solo/myScores.php")
        return GetTypedResponse<GetMyVocalScoresResponse>(res)
    },
}
