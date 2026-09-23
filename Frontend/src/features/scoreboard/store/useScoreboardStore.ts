import { defineStore } from "pinia";
import { useQuery } from "@tanstack/vue-query";
import { computed, reactive, readonly, ref, watchEffect } from "vue";
import type { Ref } from "vue";
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
 * One { serverError, offline } pair per query. The judges and final endpoints are
 * independent and now live on separate pages, so a failure on one must not black
 * out the other one's page.
 */
const deriveFetchError = <TError>(query: {
    isError: Ref<boolean>;
    isSuccess: Ref<boolean>;
    error: Ref<TError>;
}) => {
    const state = reactive({ serverError: false, offline: false });

    watchEffect(() => {
        if (query.isError.value) {
            const error = query.error.value as AxiosError<ScoreboardErrorResponse> | null;
            if (!error) return;

            const { type, err } = appErrorHandler(error);
            // 404 just means nobody has scored yet - that is an empty state, not an error.
            const isEmpty = err.status === 404;
            state.offline = !isEmpty && type === "offline";
            state.serverError =
                !isEmpty &&
                (type === "serverError" || type === "unreachable" || type === "requestTimeout");
        } else if (query.isSuccess.value) {
            state.offline = false;
            state.serverError = false;
        }
    });

    return readonly(state);
};

/**
 * One store instance per category, so /dashboard/scores/vocal and .../modern
 * keep separate caches and separate error state.
 */
export const useScoreboardStore = (category: ScoreboardCategoryKey) =>
    defineStore(`scoreboard-${category}`, () => {
        // Neither endpoint is fetched until a page that actually renders it opts in,
        // so opening one category page never pulls the other page's data.
        const judgesEnabled = ref(false);
        const finalEnabled = ref(false);

        const judgeScores = useQuery({
            queryKey: ["scoreboard", category, "judges"],
            queryFn: () => scoreboardService.getJudgeScores(category),
            ...QUERY_OPTIONS,
            select: (data) => data.data,
            enabled: judgesEnabled,
        });

        const finalScores = useQuery({
            queryKey: ["scoreboard", category, "final"],
            queryFn: () => scoreboardService.getFinalScores(category),
            ...QUERY_OPTIONS,
            select: (data) => data.data,
            enabled: finalEnabled,
        });

        const rankedFinalScores = computed(() =>
            [...(finalScores.data.value ?? [])]
                .map(normalizeFinalRow)
                .sort((a, b) => b.finalScore - a.finalScore)
        );

        const topThree = computed(() => rankedFinalScores.value.slice(0, 3));

        const refetchJudgeScores = () => judgeScores.refetch();
        const refetchFinalScores = () => finalScores.refetch();

        const judgesFetchError = deriveFetchError(judgeScores);
        const finalFetchError = deriveFetchError(finalScores);

        return {
            judgeScores,
            finalScores,
            rankedFinalScores,
            topThree,
            refetchJudgeScores,
            refetchFinalScores,
            judgesFetchError,
            finalFetchError,
            enableJudgeScores: () => (judgesEnabled.value = true),
            enableFinalScores: () => (finalEnabled.value = true),
        };
    })();
