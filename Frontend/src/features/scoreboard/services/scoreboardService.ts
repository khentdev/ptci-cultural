import axiosInstance from "../../../core/API/axiosConfig";
import { GetTypedResponse } from "../../shared/types/typedResponse";
import { SCOREBOARD_CATEGORIES } from "../types/categories";
import type { GetFinalScoresDTO, GetJudgeScoresDTO, ScoreboardCategoryKey } from "../types/types";

export const scoreboardService = {
    getJudgeScores: async (category: ScoreboardCategoryKey) => {
        const res = await axiosInstance.get(SCOREBOARD_CATEGORIES[category].judgesPath)
        return GetTypedResponse<GetJudgeScoresDTO>(res)
    },
    getFinalScores: async (category: ScoreboardCategoryKey) => {
        const res = await axiosInstance.get(SCOREBOARD_CATEGORIES[category].finalPath)
        return GetTypedResponse<GetFinalScoresDTO>(res)
    },
}
