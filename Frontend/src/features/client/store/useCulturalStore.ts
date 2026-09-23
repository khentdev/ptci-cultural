import { useScoreDrafts, SCORE_DRAFT_KEYS } from "../composables/useScoreDrafts";
import { defineStore } from "pinia";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { reactive, readonly, ref, toRaw, watchEffect } from "vue";
import type { AxiosError } from "axios";

import { culturalService } from "../services/culturalService";
import { appErrorHandler } from "../../errors/appErrorHandler";
import { useToast } from "../../shared/composables/useToast";
import { useAuthStore } from "../../auth/store/authStore";
import type { CreateCulturalScoreParams, CulturalScoreErrorResponse } from "../types/cultural/types";

const INFRA_ERRORS = ["offline", "unreachable", "serverError", "requestTimeout"];

export const useCulturalStore = defineStore("culturalScore", () => {
    const { toast } = useToast();
    const authStore = useAuthStore();

    const scoreInputs = useScoreDrafts<Record<string, unknown>>(SCORE_DRAFT_KEYS.cultural);

    const enabled = ref(false);

    const getCulturalTeams = useQuery({
        queryKey: ["culturalSubjects"],
        queryFn: () => culturalService.getTeams(),
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
    const getMyCulturalScores = useQuery({
        queryKey: ["myCulturalScores"],
        queryFn: () => culturalService.getMyCulturalScores(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => data.data,
        enabled,
    });

    const refetchCulturalFeat = () => {
        getCulturalTeams.refetch();
        getMyCulturalScores.refetch();
    };

    const createCulturalScoreMutation = useMutation({
        mutationFn: (scores: CreateCulturalScoreParams[]) => culturalService.createCulturalScoreBatch(scores),
        onMutate: () => ({ backupScores: structuredClone(toRaw(scoreInputs.value)) }),
        onSuccess: (res) => {
            if (typeof res.has_submitted === "boolean") {
                authStore.setUserMetaDataAfterScoreSubmit(res.has_submitted);
            }
            getMyCulturalScores.refetch().catch(() => {});
            toast.success("All scores submitted successfully!");
        },
        onError: (err: AxiosError<CulturalScoreErrorResponse>, _vars, context) => {
            const parsed = appErrorHandler(err);
            if (INFRA_ERRORS.includes(parsed.type)) toast.error(parsed.message);
            if (parsed.err.status === 422 || parsed.err.status === 409) {
                toast.error("You have already submitted your scores for this category.");
                getMyCulturalScores.refetch().catch(() => {});
                return;
            }
            if (context?.backupScores) {
                scoreInputs.value = structuredClone(context.backupScores);
                toast.info("Cultural dance scores have been restored. Please try again.");
            }
        },
    });

    const createCulturalScore = (data: CreateCulturalScoreParams[]) =>
        createCulturalScoreMutation.mutateAsync(data);

    /** Ids this judge has already scored, as strings, for per-row disabling. */
    const scoredCulturalIds = () =>
        new Set((getMyCulturalScores.data.value ?? []).map((s) => String(s.team_id)));

    const fetchError = reactive({ serverError: false, offline: false });

    watchEffect(() => {
        const subjectsFailed = getCulturalTeams.isError.value;
        const myScoresFailed = getMyCulturalScores.isError.value;

        if (subjectsFailed || myScoresFailed) {
            const error = (subjectsFailed
                ? getCulturalTeams.error.value
                : getMyCulturalScores.error.value) as AxiosError<CulturalScoreErrorResponse>;
            if (error) {
                const { type } = appErrorHandler(error);
                fetchError.offline = type === "offline";
                fetchError.serverError =
                    type === "serverError" || type === "unreachable" || type === "requestTimeout";
            }
        } else if (getCulturalTeams.isSuccess.value && getMyCulturalScores.isSuccess.value) {
            fetchError.offline = false;
            fetchError.serverError = false;
        }
    });

    return {
        getCulturalTeams,
        getMyCulturalScores,
        scoredCulturalIds,
        refetchCulturalFeat,
        createCulturalScore,
        createCulturalScoreMutation,
        fetchError: readonly(fetchError),
        enableCultural: () => (enabled.value = true),
    };
});
