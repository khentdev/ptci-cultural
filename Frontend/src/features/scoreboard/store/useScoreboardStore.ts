import { defineStore } from "pinia";
import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, readonly, ref, watchEffect } from "vue";
import type { AxiosError } from "axios";

import { scoreboardService } from "../services/scoreboardService";
import { appErrorHandler } from "../../errors/appErrorHandler";
import type {
    FinalScoreRow,
    ScoreboardCategoryKey,
    ScoreboardErrorResponse,
} from "../types/types";

const QUERY_OPTIONS = {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
};

/** Final-score rows arrive keyed by cand_* or team_* depending on the category. */
export const normalizeFinalRow = (row: FinalScoreRow) => ({
    id: String(row.cand_id ?? row.team_id ?? ""),
    name: row.cand_name ?? row.team ?? "-",
    team: String(row.cand_team ?? row.team ?? ""),
    finalScore: Number(row.final_score ?? 0),
});

export type NormalizedFinalRow = ReturnType<typeof normalizeFinalRow>;

/**
 * One store instance per category, so /dashboard/scores/vocal and .../modern
 * keep separate caches and separate error state.
 */
export const useScoreboardStore = (category: ScoreboardCategoryKey) =>
    defineStore(`scoreboard-${category}`, () => {
        const enabled = ref(false);

        const judgeScores = useQuery({
            queryKey: ["scoreboard", category, "judges"],
            queryFn: () => scoreboardService.getJudgeScores(category),
            ...QUERY_OPTIONS,
            select: (data) => data.data,
            enabled,
        });

        const finalScores = useQuery({
            queryKey: ["scoreboard", category, "final"],
            queryFn: () => scoreboardService.getFinalScores(category),
            ...QUERY_OPTIONS,
            select: (data) => data.data,
            enabled,
        });

        const rankedFinalScores = computed(() =>
            [...(finalScores.data.value ?? [])]
                .map(normalizeFinalRow)
                .sort((a, b) => b.finalScore - a.finalScore)
        );

        const topThree = computed(() => rankedFinalScores.value.slice(0, 3));

        const refetchAll = () => {
            judgeScores.refetch();
            finalScores.refetch();
        };

        const fetchError = reactive({ serverError: false, offline: false });

        watchEffect(() => {
            const judgesFailed = judgeScores.isError.value;
            const finalFailed = finalScores.isError.value;

            if (judgesFailed || finalFailed) {
                const error = (judgesFailed
                    ? judgeScores.error.value
                    : finalScores.error.value) as AxiosError<ScoreboardErrorResponse>;
                if (error) {
                    const { type, err } = appErrorHandler(error);
                    // 404 just means nobody has scored yet - that is an empty state, not an error.
                    const isEmpty = err.status === 404;
                    fetchError.offline = !isEmpty && type === "offline";
                    fetchError.serverError =
                        !isEmpty &&
                        (type === "serverError" || type === "unreachable" || type === "requestTimeout");
                }
            } else if (judgeScores.isSuccess.value && finalScores.isSuccess.value) {
                fetchError.offline = false;
                fetchError.serverError = false;
            }
        });

        return {
            judgeScores,
            finalScores,
            rankedFinalScores,
            topThree,
            refetchAll,
            fetchError: readonly(fetchError),
            enable: () => (enabled.value = true),
        };
    })();
