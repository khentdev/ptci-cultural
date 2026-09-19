import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import type { CreateInterpretativeScoreDTO, CreateInterpretativeScoreParams, GetInterpretativeTeamDTO } from "../types/interpretative/types";

export const interpretativeService = {
    getTeams: async () => {
        const res = await axiosInstance.get("/teams/readTeams.php")
        return GetTypedResponse<GetInterpretativeTeamDTO>(res)
    },
    createInterpretativeScore: async (data: CreateInterpretativeScoreParams) => {
        const res = await axiosInstance.post("/category/interpretative_dance/createInterpretativeScore.php", data)
        return GetTypedResponse<CreateInterpretativeScoreDTO>(res)
    }
}
