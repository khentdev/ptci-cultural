import { defineStore } from "pinia";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { interpretativeService } from "../services/interpretativeService";
import { ref, toRaw, watchEffect } from "vue";
import { useToast } from "../../shared/composables/useToast";
import type { CreateInterpretativeScoreParams, InterpretativeScoreErrorResponse } from "../types/interpretative/types";
import type { AxiosError } from "axios";
import { appErrorHandler } from "../../errors/appErrorHandler";
import { useLoadingStore } from "../../../shared/store/useLoadingState";
import { useGlobalErrorSetter } from "../../../shared/store/useGlobalErrorState";
import { useLocalStorage } from "@vueuse/core";
import type { CandidateTeamOptions } from "../types/talent/types";

export const useInterpretativeStore = defineStore("interpretativeScore", () => {
    const { toast } = useToast()

    const { setLoading } = useLoadingStore()
    const { setError } = useGlobalErrorSetter()

    type ScoreFields = {
        team_id: number,
        team: Capitalize<CandidateTeamOptions>
        originality: number,
        mastery_of_steps: number,
        choreography_and_style: number,
        costume_and_props: number,
        stage_presence: number
    }[]
    const submissions = useLocalStorage<Record<string, { submitted: boolean }>>(
        "interpretative-submissions",
        {}
    );

    const setSubmitted = (val: boolean, key: string) => {
        submissions.value[key] = { submitted: val };
    };

    const isSubmitted = (key: string) => {
        return submissions.value[key]?.submitted ?? false;
    };
    const interpretativeTeamsScoreInput = useLocalStorage<ScoreFields[]>("interpretative-scores", []);

    const interpretativeEnabled = ref(false)
    const getInterpretativeTeams = useQuery({
        queryKey: ["interpretativeTeams"],
        queryFn: () => interpretativeService.getTeams(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => data.data,
        enabled: interpretativeEnabled
    });
    const refetchInterpretativeTeamsFeat = () => getInterpretativeTeams.refetch()

    const createInterpretativeScoreMutation = useMutation({
        mutationFn: async (data: CreateInterpretativeScoreParams[]) => {
            const results = await Promise.allSettled(data.map(d =>
                interpretativeService.createInterpretativeScore(
                    {
                        team_id: d.team_id,
                        originality: d.originality,
                        mastery_of_steps: d.mastery_of_steps,
                        choreography_and_style: d.choreography_and_style,
                        costume_and_props: d.costume_and_props,
                        stage_presence: d.stage_presence
                    })
            ))
            const failures = results.filter(d => d.status === "rejected")
            if (failures.length > 0) throw (failures[0] as PromiseRejectedResult).reason
            return results.filter(d => d.status === "fulfilled").map(v => v.value)
        },
        onMutate: () => {
            const backupScores = structuredClone(toRaw(interpretativeTeamsScoreInput.value))
            return { backupScores }
        },
        onSuccess: () => {
            setSubmitted(true, "interpretative-submitted")
            toast.success("All scores submitted successfully!")
        },
        onError: (err: AxiosError<InterpretativeScoreErrorResponse>, _, context) => {
            const parsed = appErrorHandler(err)
            const infraMaps = ["offline", "unreachable", "serverError", "requestTimeout"]
            console.error(parsed.err)
            if (infraMaps.includes(parsed.type)) toast.error(parsed.message);
            if (context?.backupScores) {
                interpretativeTeamsScoreInput.value = structuredClone(context.backupScores);
                toast.info("Interpretative scores have been restored. Please try again.");
            }
        }
    })
    const createInterpretativeScore = (data: CreateInterpretativeScoreParams[]) => {
        if (isSubmitted("interpretative-submitted")) {
            toast.info("You’ve already submitted scores for these teams.");
            return
        }
        return createInterpretativeScoreMutation.mutateAsync(data)
    }

    watchEffect(() => {
        setLoading("interpretativeTeams", "initialFetching", getInterpretativeTeams.isPending.value || getInterpretativeTeams.isLoading.value)
        setLoading("interpretativeTeams", "fetchRefresh", getInterpretativeTeams.isFetching.value)

        setLoading("interpretativeTeams", "createInterpretativeScore", createInterpretativeScoreMutation.isPending.value)


        if (getInterpretativeTeams.data.value) {
            setError("interpretativeTeams", "fetchOffline", false)
            setError("interpretativeTeams", "fetchServerError", false)
        }
    })

    watchEffect(() => {

        if (getInterpretativeTeams.isError.value) {
            const interpretativeErr = getInterpretativeTeams.error.value as AxiosError<InterpretativeScoreErrorResponse>
            if (interpretativeErr) {
                const { type, } = appErrorHandler(interpretativeErr)
                if (type === "offline") { setError("interpretativeTeams", "fetchOffline", true) }
                if (type === "serverError" || type === "unreachable" || type === "requestTimeout") {
                    setError("interpretativeTeams", "fetchServerError", true)
                }
            }
        }
    })

    return {
        getInterpretativeTeams,
        refetchInterpretativeTeamsFeat,
        createInterpretativeScore,
        submissions,
        enableInterpretative: () => interpretativeEnabled.value = true,
        setSubmitted,
        isSubmitted,
    }
})