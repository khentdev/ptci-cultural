import { useScoreDrafts, SCORE_DRAFT_KEYS } from "../composables/useScoreDrafts";
import { defineStore } from "pinia";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { reactive, readonly, ref, toRaw, watchEffect } from "vue";
import type { AxiosError } from "axios";

import { vocalService } from "../services/vocalService";
import { appErrorHandler } from "../../errors/appErrorHandler";
import { useToast } from "../../shared/composables/useToast";
import { useAuthStore } from "../../auth/store/authStore";
import type { CreateVocalScoreParams, VocalScoreErrorResponse } from "../types/vocal/types";

const INFRA_ERRORS = ["offline", "unreachable", "serverError", "requestTimeout"];

export const useVocalStore = defineStore("vocalScore", () => {
    const { toast } = useToast();
    const authStore = useAuthStore();

    const scoreInputs = useScoreDrafts<Record<string, unknown>>(SCORE_DRAFT_KEYS.vocal);

    const enabled = ref(false);

    const getVocalCandidates = useQuery({
        queryKey: ["vocalSubjects"],
        queryFn: () => vocalService.getCandidates(),
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
    const getMyVocalScores = useQuery({
        queryKey: ["myVocalScores"],
        queryFn: () => vocalService.getMyVocalScores(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => data.data,
        enabled,
    });

    const refetchVocalFeat = () => {
        getVocalCandidates.refetch();
        getMyVocalScores.refetch();
    };

    const createVocalScoreMutation = useMutation({
        mutationFn: (scores: CreateVocalScoreParams[]) => vocalService.createVocalScoreBatch(scores),
        onMutate: () => ({ backupScores: structuredClone(toRaw(scoreInputs.value)) }),
        onSuccess: (res) => {
            if (typeof res.has_submitted === "boolean") {
                authStore.setUserMetaDataAfterScoreSubmit(res.has_submitted);
            }
            getMyVocalScores.refetch().catch(() => {});
            toast.success("All scores submitted successfully!");
        },
        onError: (err: AxiosError<VocalScoreErrorResponse>, _vars, context) => {
            const parsed = appErrorHandler(err);
            if (INFRA_ERRORS.includes(parsed.type)) toast.error(parsed.message);
            if (parsed.err.status === 422 || parsed.err.status === 409) {
                toast.error("You have already submitted your scores for this category.");
                getMyVocalScores.refetch().catch(() => {});
                return;
            }
            if (context?.backupScores) {
                scoreInputs.value = structuredClone(context.backupScores);
                toast.info("Vocal scores have been restored. Please try again.");
            }
        },
    });

    const createVocalScore = (data: CreateVocalScoreParams[]) =>
        createVocalScoreMutation.mutateAsync(data);

    /** Ids this judge has already scored, as strings, for per-row disabling. */
    const scoredVocalIds = () =>
        new Set((getMyVocalScores.data.value ?? []).map((s) => String(s.cand_id)));

    const fetchError = reactive({ serverError: false, offline: false });

    watchEffect(() => {
        const subjectsFailed = getVocalCandidates.isError.value;
        const myScoresFailed = getMyVocalScores.isError.value;

        if (subjectsFailed || myScoresFailed) {
            const error = (subjectsFailed
                ? getVocalCandidates.error.value
                : getMyVocalScores.error.value) as AxiosError<VocalScoreErrorResponse>;
            if (error) {
                const { type } = appErrorHandler(error);
                fetchError.offline = type === "offline";
                fetchError.serverError =
                    type === "serverError" || type === "unreachable" || type === "requestTimeout";
            }
        } else if (getVocalCandidates.isSuccess.value && getMyVocalScores.isSuccess.value) {
            fetchError.offline = false;
            fetchError.serverError = false;
        }
    });

    return {
        getVocalCandidates,
        getMyVocalScores,
        scoredVocalIds,
        refetchVocalFeat,
        createVocalScore,
        createVocalScoreMutation,
        fetchError: readonly(fetchError),
        enableVocal: () => (enabled.value = true),
    };
});
