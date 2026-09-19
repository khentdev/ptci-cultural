import { defineStore } from "pinia";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { reactive, readonly, ref, toRaw, watchEffect } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { AxiosError } from "axios";

import { interpretativeService } from "../services/interpretativeService";
import { appErrorHandler } from "../../errors/appErrorHandler";
import { useToast } from "../../shared/composables/useToast";
import { useAuthStore } from "../../auth/store/authStore";
import type { CreateInterpretativeScoreParams, InterpretativeScoreErrorResponse } from "../types/interpretative/types";

const INFRA_ERRORS = ["offline", "unreachable", "serverError", "requestTimeout"];

export const useInterpretativeStore = defineStore("interpretativeScore", () => {
    const { toast } = useToast();
    const authStore = useAuthStore();

    const scoreInputs = useLocalStorage<Record<string, unknown>[]>("interpretative-scores", []);

    const enabled = ref(false);

    const getInterpretativeTeams = useQuery({
        queryKey: ["interpretativeSubjects"],
        queryFn: () => interpretativeService.getTeams(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => data.data,
        enabled,
    });

    /**
     * The server is the source of truth for "already submitted" - a page refresh,
     * a cleared browser store or a different device all still lock the inputs.
     */
    const getMyInterpretativeScores = useQuery({
        queryKey: ["myInterpretativeScores"],
        queryFn: () => interpretativeService.getMyInterpretativeScores(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => data.data,
        enabled,
    });

    const refetchInterpretativeFeat = () => {
        getInterpretativeTeams.refetch();
        getMyInterpretativeScores.refetch();
    };

    const createInterpretativeScoreMutation = useMutation({
        mutationFn: (scores: CreateInterpretativeScoreParams[]) => interpretativeService.createInterpretativeScoreBatch(scores),
        onMutate: () => ({ backupScores: structuredClone(toRaw(scoreInputs.value)) }),
        onSuccess: (res) => {
            if (typeof res.has_submitted === "boolean") {
                authStore.setUserMetaDataAfterScoreSubmit(res.has_submitted);
            }
            getMyInterpretativeScores.refetch().catch(() => {});
            toast.success("All scores submitted successfully!");
        },
        onError: (err: AxiosError<InterpretativeScoreErrorResponse>, _vars, context) => {
            const parsed = appErrorHandler(err);
            if (INFRA_ERRORS.includes(parsed.type)) toast.error(parsed.message);
            if (parsed.err.status === 422 || parsed.err.status === 409) {
                toast.error("You have already submitted your scores for this category.");
                getMyInterpretativeScores.refetch().catch(() => {});
                return;
            }
            if (context?.backupScores) {
                scoreInputs.value = structuredClone(context.backupScores);
                toast.info("Interpretative dance scores have been restored. Please try again.");
            }
        },
    });

    const createInterpretativeScore = (data: CreateInterpretativeScoreParams[]) =>
        createInterpretativeScoreMutation.mutateAsync(data);

    /** Ids this judge has already scored, as strings, for per-row disabling. */
    const scoredInterpretativeIds = () =>
        new Set((getMyInterpretativeScores.data.value ?? []).map((s) => String(s.team_id)));

    const fetchError = reactive({ serverError: false, offline: false });

    watchEffect(() => {
        const subjectsFailed = getInterpretativeTeams.isError.value;
        const myScoresFailed = getMyInterpretativeScores.isError.value;

        if (subjectsFailed || myScoresFailed) {
            const error = (subjectsFailed
                ? getInterpretativeTeams.error.value
                : getMyInterpretativeScores.error.value) as AxiosError<InterpretativeScoreErrorResponse>;
            if (error) {
                const { type } = appErrorHandler(error);
                fetchError.offline = type === "offline";
                fetchError.serverError =
                    type === "serverError" || type === "unreachable" || type === "requestTimeout";
            }
        } else if (getInterpretativeTeams.isSuccess.value && getMyInterpretativeScores.isSuccess.value) {
            fetchError.offline = false;
            fetchError.serverError = false;
        }
    });

    return {
        getInterpretativeTeams,
        getMyInterpretativeScores,
        scoredInterpretativeIds,
        refetchInterpretativeFeat,
        createInterpretativeScore,
        createInterpretativeScoreMutation,
        fetchError: readonly(fetchError),
        enableInterpretative: () => (enabled.value = true),
    };
});
