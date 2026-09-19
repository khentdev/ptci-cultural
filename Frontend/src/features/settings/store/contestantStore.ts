import { defineStore } from "pinia";
import { reactive, readonly, watchEffect } from "vue";

import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

import { appErrorHandler } from "../../errors/appErrorHandler";
import { useToast } from "../../shared/composables/useToast";
import { contestantsService } from "../services/contestantsService";

import type { AxiosError } from "axios";
import type {
    ContestantErrorResponse,
    ContestantFormErrors,
    CreateContestantParams,
    DeleteContestantParams,
    GetContestantsDTO,
    UpdateContestantParams,
} from "../types/contestants";

const INFRA_ERRORS = ["offline", "unreachable", "serverError", "requestTimeout"];

export const useContestantsStore = defineStore("contestantStore", () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const contestantFormErrors = reactive<ContestantFormErrors>({ general: "" });
    const clearFormErrors = () => {
        contestantFormErrors.general = "";
    };

    const getContestants = useQuery({
        queryKey: ["contestantsData"],
        queryFn: () => contestantsService.getContestants(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => ({
            ...data,
            data: [...data.data].sort((a, b) => a.cand_name.localeCompare(b.cand_name)),
        }),
    });
    const refetchContestants = () => getContestants.refetch();

    /** Form mutations surface their error inside the open form. */
    const handleFormError = (err: AxiosError<ContestantErrorResponse>) => {
        const { type, message, err: error } = appErrorHandler(err);
        if (error.status === 422 || error.status === 400) {
            contestantFormErrors.general = message;
            return;
        }
        if (INFRA_ERRORS.includes(type)) contestantFormErrors.general = message;
    };

    const addContestantMutation = useMutation({
        mutationFn: (data: CreateContestantParams) => contestantsService.createContestant(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["contestantsData"] });
            toast.success(data.message, { dedup: true });
        },
        onError: handleFormError,
    });
    const addContestant = (data: CreateContestantParams) => addContestantMutation.mutateAsync(data);

    const updateContestantMutation = useMutation({
        mutationFn: (data: UpdateContestantParams) => contestantsService.updateContestant(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["contestantsData"] });
            toast.success(data.message, { dedup: true });
        },
        onError: handleFormError,
    });
    const updateContestant = (data: UpdateContestantParams) => updateContestantMutation.mutateAsync(data);

    const deleteContestantMutation = useMutation({
        mutationFn: ({ id }: DeleteContestantParams) => contestantsService.deleteContestant({ id }),
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries({ queryKey: ["contestantsData"] });
            const previousData = queryClient.getQueryData<GetContestantsDTO>(["contestantsData"]);
            if (previousData?.data) {
                queryClient.setQueryData<GetContestantsDTO>(["contestantsData"], {
                    ...previousData,
                    data: previousData.data.filter((c) => c.cand_id !== id),
                });
            }
            return { previousData };
        },
        onSuccess: (data) => toast.success(data.message),
        onError: (err: AxiosError<ContestantErrorResponse>, _, context) => {
            const parsed = appErrorHandler(err);
            if (INFRA_ERRORS.includes(parsed.type)) toast.error(parsed.message);
            if (parsed.err.status === 404) {
                toast.error("The contestant may already have been deleted or is not found.");
            }
            if (context?.previousData) {
                queryClient.setQueryData(["contestantsData"], context.previousData);
            }
        },
    });
    const deleteContestant = ({ id }: DeleteContestantParams) => deleteContestantMutation.mutate({ id });

    const fetchError = reactive({ serverError: false, offline: false });

    watchEffect(() => {
        if (getContestants.isError.value) {
            const error = getContestants.error.value as AxiosError<ContestantErrorResponse>;
            if (error) {
                const { type } = appErrorHandler(error);
                fetchError.offline = type === "offline";
                fetchError.serverError =
                    type === "serverError" || type === "unreachable" || type === "requestTimeout";
            }
        } else if (getContestants.isSuccess.value) {
            fetchError.offline = false;
            fetchError.serverError = false;
        }
    });

    return {
        contestantFormErrors,
        clearFormErrors,
        getContestants,
        refetchContestants,
        addContestant,
        updateContestant,
        deleteContestant,
        addContestantMutation,
        updateContestantMutation,
        deleteContestantMutation,
        fetchError: readonly(fetchError),
    };
});
