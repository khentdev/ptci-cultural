import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type {
    CreateInterpretativeScoreDTO,
    CreateInterpretativeScoreParams,
    GetInterpretativeTeamDTO,
    GetMyInterpretativeScoresResponse,
} from "../types/interpretative/types";

export const interpretativeService = {
    getTeams: async () => {
        const res = await axiosInstance.get("/teams/readTeams.php")
        return GetTypedResponse<GetInterpretativeTeamDTO>(res)
    },

    /** One all-or-nothing POST; replaces the old per-row fan-out. */
    createInterpretativeScoreBatch: async (data: CreateInterpretativeScoreParams[]) => {
        const res = await axiosInstance.post("/category/interpretative_dance/batchScore.php", data)
        return GetTypedResponse<CreateInterpretativeScoreDTO>(res)
    },

    /** Scores the signed-in judge has already committed for this category. */
    getMyInterpretativeScores: async () => {
        const res = await axiosInstance.get("/category/interpretative_dance/myScores.php")
        return GetTypedResponse<GetMyInterpretativeScoresResponse>(res)
    },
}
