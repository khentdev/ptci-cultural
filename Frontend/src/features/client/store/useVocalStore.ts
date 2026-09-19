import { defineStore } from "pinia";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { vocalService } from "../services/vocalService";
import { ref, toRaw, watchEffect } from "vue";
import { useToast } from "../../shared/composables/useToast";
import type { CreateVocalScoreParams, VocalScoreErrorResponse } from "../types/vocal/types";
import type { AxiosError } from "axios";
import { appErrorHandler } from "../../errors/appErrorHandler";
import type { CandidateTeamOptions } from "../types/talent/types";
import { useLoadingStore } from "../../../shared/store/useLoadingState";
import { useGlobalErrorSetter } from "../../../shared/store/useGlobalErrorState";
import { useLocalStorage } from "@vueuse/core";

export const useVocalStore = defineStore("vocalScore", () => {
    const { toast } = useToast()

    const { setLoading } = useLoadingStore()
    const { setError } = useGlobalErrorSetter()

    type ScoreFields = {
        candidateId: string | null;
        candidateName: string | null;
        candidateTeam: Capitalize<CandidateTeamOptions>;
        voice_tone_quality: number,
        mastery_and_timing: number,
        vocal_expression: number,
        diction: number,
        stage_presence: number,
        entertainment_value: number
    }[]
    const submissions = useLocalStorage<Record<string, { submitted: boolean }>>(
        "vocal-submissions",
        {}
    );

    const setSubmitted = (val: boolean, key: string) => {
        submissions.value[key] = { submitted: val };
    };

    const isSubmitted = (key: string) => {
        return submissions.value[key]?.submitted ?? false;
    };
    const vocalCandidatesScoreInput = useLocalStorage<ScoreFields[]>("vocal-scores", []);

    const vocalEnabled = ref(false)
    const getVocalCandidates = useQuery({
        queryKey: ["vocalCandidates"],
        queryFn: () => vocalService.getCandidates(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => data.data,
        enabled: vocalEnabled
    });
    const refetchVocalCandidatesFeat = () => getVocalCandidates.refetch()

    const createVocalScoreMutation = useMutation({
        mutationFn: async (data: CreateVocalScoreParams[]) => {
            const results = await Promise.allSettled(data.map(d =>
                vocalService.createVocalScore(
                    {
                        cand_id: d.cand_id,
                        voice_tone_quality: d.voice_tone_quality,
                        mastery_and_timing: d.mastery_and_timing,
                        vocal_expression: d.vocal_expression,
                        diction: d.diction,
                        stage_presence: d.stage_presence,
                        entertainment_value: d.entertainment_value
                    })
            ))
            const failures = results.filter(d => d.status === "rejected")
            if (failures.length > 0) throw (failures[0] as PromiseRejectedResult).reason
            return results.filter(d => d.status === "fulfilled").map(v => v.value)
        },
        onMutate: () => {
            const backupScores = structuredClone(toRaw(vocalCandidatesScoreInput.value))
            return { backupScores }
        },
        onSuccess: () => {
            setSubmitted(true, "vocal-submitted")
            toast.success("All scores submitted successfully!")
        },
        onError: (err: AxiosError<VocalScoreErrorResponse>, _, context) => {
            const parsed = appErrorHandler(err)
            const infraMaps = ["offline", "unreachable", "serverError", "requestTimeout"]
            console.error(parsed.err)
            if (infraMaps.includes(parsed.type)) toast.error(parsed.message);
            if (context?.backupScores) {
                vocalCandidatesScoreInput.value = structuredClone(context.backupScores);
                toast.info("Vocal scores have been restored. Please try again.");
            }
        }
    })
    const createVocalScore = (data: CreateVocalScoreParams[]) => {
        if (isSubmitted("vocal-submitted")) {
            toast.info("You’ve already submitted scores for these candidates.");
            return
        }
        return createVocalScoreMutation.mutateAsync(data)
    }

    watchEffect(() => {
        setLoading("vocalCandidates", "initialFetching", getVocalCandidates.isPending.value || getVocalCandidates.isLoading.value)
        setLoading("vocalCandidates", "fetchRefresh", getVocalCandidates.isFetching.value)

        setLoading("vocalCandidates", "createVocalScore", createVocalScoreMutation.isPending.value)


        if (getVocalCandidates.data.value) {
            setError("vocalCandidates", "fetchOffline", false)
            setError("vocalCandidates", "fetchServerError", false)
        }
    })

    watchEffect(() => {

        if (getVocalCandidates.isError.value) {
            const vocalErr = getVocalCandidates.error.value as AxiosError<VocalScoreErrorResponse>
            if (vocalErr) {
                const { type, } = appErrorHandler(vocalErr)
                if (type === "offline") { setError("vocalCandidates", "fetchOffline", true) }
                if (type === "serverError" || type === "unreachable" || type === "requestTimeout") {
                    setError("vocalCandidates", "fetchServerError", true)
                }
            }
        }

    })

    return {
        getVocalCandidates,
        refetchVocalCandidatesFeat,
        createVocalScore,
        submissions,
        enableVocal: () => vocalEnabled.value = true,
        setSubmitted,
        isSubmitted,
    }
})