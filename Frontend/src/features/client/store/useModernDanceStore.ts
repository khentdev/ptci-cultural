import { defineStore } from "pinia";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { modernService } from "../services/modernService";
import { ref, toRaw, watchEffect } from "vue";
import { useToast } from "../../shared/composables/useToast";
import type { CreateModernScoreParams, ModernScoreErrorResponse } from "../types/modern/types";
import type { AxiosError } from "axios";
import { appErrorHandler } from "../../errors/appErrorHandler";
import { useLoadingStore } from "../../../shared/store/useLoadingState";
import { useGlobalErrorSetter } from "../../../shared/store/useGlobalErrorState";
import { useLocalStorage } from "@vueuse/core";

export const useModernStore = defineStore("modernScore", () => {
    const { toast } = useToast()

    const { setLoading } = useLoadingStore()
    const { setError } = useGlobalErrorSetter()

    type ScoreFields = {
        cand_id: number
        team_id: number
        audience_impact: number
        mastery_of_steps: number
        choreography_and_style: number
        costume_and_props: number
        stage_presence: number
    }[]
    const submissions = useLocalStorage<Record<string, { submitted: boolean }>>(
        "modern-submissions",
        {}
    );
    const setSubmitted = (val: boolean, key: string) => {
        submissions.value[key] = { submitted: val };
    };

    const isSubmitted = (key: string) => {
        return submissions.value[key]?.submitted ?? false;
    };
    const modernTeamsScoreInput = useLocalStorage<ScoreFields[]>("modern-dance-scores", []);

    const modernEnabled = ref(false)
    const getModernTeams = useQuery({
        queryKey: ["modernTeams"],
        queryFn: () => modernService.getTeams(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => data.data,
        enabled: modernEnabled
    });
    const refetchModernTeamsFeat = () => getModernTeams.refetch()

    const createModernScoreMutation = useMutation({
        mutationFn: async (data: CreateModernScoreParams[]) => {
            const results = await Promise.allSettled(data.map(d =>
                modernService.createModernScore(
                    {
                        team_id: d.team_id,
                        cand_id: d.cand_id,
                        audience_impact: d.audience_impact,
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
            const backupScores = structuredClone(toRaw(modernTeamsScoreInput.value))
            return { backupScores }
        },
        onSuccess: () => {
            setSubmitted(true, "modern-dance-submitted")
            toast.success("All scores submitted successfully!")
        },
        onError: (err: AxiosError<ModernScoreErrorResponse>, _, context) => {
            const parsed = appErrorHandler(err)
            const infraMaps = ["offline", "unreachable", "serverError", "requestTimeout"]
            if (infraMaps.includes(parsed.type)) toast.error(parsed.message);
            if (context?.backupScores) {
                modernTeamsScoreInput.value = structuredClone(context.backupScores);
                toast.info("Modern dance scores have been restored. Please try again.");
            }
        }
    })
    const createModernScore = (data: CreateModernScoreParams[]) => {
        if (isSubmitted("modern-submitted")) {
            toast.info("You’ve already submitted scores for these teams.");
            return
        }
        return createModernScoreMutation.mutateAsync(data)
    }

    watchEffect(() => {
        setLoading("modernTeams", "initialFetching", getModernTeams.isPending.value || getModernTeams.isLoading.value)
        setLoading("modernTeams", "fetchRefresh", getModernTeams.isFetching.value)

        setLoading("modernTeams", "createModernScore", createModernScoreMutation.isPending.value)


        if (getModernTeams.data.value) {
            setError("modernTeams", "fetchOffline", false)
            setError("modernTeams", "fetchServerError", false)
        }
    })

    watchEffect(() => {

        if (getModernTeams.isError.value) {
            const modernErr = getModernTeams.error.value as AxiosError<ModernScoreErrorResponse>
            if (modernErr) {
                const { type, } = appErrorHandler(modernErr)
                if (type === "offline") { setError("modernTeams", "fetchOffline", true) }
                if (type === "serverError" || type === "unreachable" || type === "requestTimeout") {
                    setError("modernTeams", "fetchServerError", true)
                }
            }
        }
    })

    return {
        getModernTeams,
        refetchModernTeamsFeat,
        createModernScore,
        submissions,
        enableModern: () => modernEnabled.value = true,
        setSubmitted,
        isSubmitted,
    }
})