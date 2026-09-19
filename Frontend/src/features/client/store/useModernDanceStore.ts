import { defineStore } from "pinia";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { reactive, readonly, ref, toRaw, watchEffect } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { AxiosError } from "axios";

import { modernService } from "../services/modernService";
import { appErrorHandler } from "../../errors/appErrorHandler";
import { useToast } from "../../shared/composables/useToast";
import { useAuthStore } from "../../auth/store/authStore";
import type { CreateModernScoreParams, ModernScoreErrorResponse } from "../types/modern/types";

const INFRA_ERRORS = ["offline", "unreachable", "serverError", "requestTimeout"];

export const useModernDanceStore = defineStore("modernScore", () => {
    const { toast } = useToast();
    const authStore = useAuthStore();

    const scoreInputs = useLocalStorage<Record<string, unknown>[]>("modern-dance-scores", []);

    const enabled = ref(false);

    const getModernTeams = useQuery({
        queryKey: ["modernSubjects"],
        queryFn: () => modernService.getTeams(),
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
    const getMyModernScores = useQuery({
        queryKey: ["myModernScores"],
        queryFn: () => modernService.getMyModernScores(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => data.data,
        enabled,
    });

    const refetchModernFeat = () => {
        getModernTeams.refetch();
        getMyModernScores.refetch();
    };

    const createModernScoreMutation = useMutation({
        mutationFn: (scores: CreateModernScoreParams[]) => modernService.createModernScoreBatch(scores),
        onMutate: () => ({ backupScores: structuredClone(toRaw(scoreInputs.value)) }),
        onSuccess: (res) => {
            if (typeof res.has_submitted === "boolean") {
                authStore.setUserMetaDataAfterScoreSubmit(res.has_submitted);
            }
            getMyModernScores.refetch().catch(() => {});
            toast.success("All scores submitted successfully!");
        },
        onError: (err: AxiosError<ModernScoreErrorResponse>, _vars, context) => {
            const parsed = appErrorHandler(err);
            if (INFRA_ERRORS.includes(parsed.type)) toast.error(parsed.message);
            if (parsed.err.status === 422 || parsed.err.status === 409) {
                toast.error("You have already submitted your scores for this category.");
                getMyModernScores.refetch().catch(() => {});
                return;
            }
            if (context?.backupScores) {
                scoreInputs.value = structuredClone(context.backupScores);
                toast.info("Modern dance scores have been restored. Please try again.");
            }
        },
    });

    const createModernScore = (data: CreateModernScoreParams[]) =>
        createModernScoreMutation.mutateAsync(data);

    /** Ids this judge has already scored, as strings, for per-row disabling. */
    const scoredModernIds = () =>
        new Set((getMyModernScores.data.value ?? []).map((s) => String(s.team_id)));

    const fetchError = reactive({ serverError: false, offline: false });

    watchEffect(() => {
        const subjectsFailed = getModernTeams.isError.value;
        const myScoresFailed = getMyModernScores.isError.value;

        if (subjectsFailed || myScoresFailed) {
            const error = (subjectsFailed
                ? getModernTeams.error.value
                : getMyModernScores.error.value) as AxiosError<ModernScoreErrorResponse>;
            if (error) {
                const { type } = appErrorHandler(error);
                fetchError.offline = type === "offline";
                fetchError.serverError =
                    type === "serverError" || type === "unreachable" || type === "requestTimeout";
            }
        } else if (getModernTeams.isSuccess.value && getMyModernScores.isSuccess.value) {
            fetchError.offline = false;
            fetchError.serverError = false;
        }
    });

    return {
        getModernTeams,
        getMyModernScores,
        scoredModernIds,
        refetchModernFeat,
        createModernScore,
        createModernScoreMutation,
        fetchError: readonly(fetchError),
        enableModern: () => (enabled.value = true),
    };
});
