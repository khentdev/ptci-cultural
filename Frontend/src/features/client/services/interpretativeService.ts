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
        const res = await axiosInstance.get("/teams")
        return GetTypedResponse<GetInterpretativeTeamDTO>(res)
    },

    createInterpretativeScoreBatch: async (data: CreateInterpretativeScoreParams[]) => {
        const res = await axiosInstance.post("/scores/interpretative/batch", data)
        return GetTypedResponse<CreateInterpretativeScoreDTO>(res)
    },

    getMyInterpretativeScores: async () => {
        const res = await axiosInstance.get("/scores/interpretative/mine")
        return GetTypedResponse<GetMyInterpretativeScoresResponse>(res)
    },
}
