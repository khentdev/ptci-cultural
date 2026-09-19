import { defineStore } from "pinia";
import { reactive, readonly, watchEffect } from "vue";

import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

import { appErrorHandler } from "../../errors/appErrorHandler";
import { useToast } from "../../shared/composables/useToast";
import { teamsService } from "../services/teamsService";

import type { AxiosError } from "axios";
import type {
    CreateTeamParams,
    DeleteTeamParams,
    GetTeamsDTO,
    TeamErrorResponse,
    TeamFormErrors,
    UpdateTeamParams,
} from "../types/teams";

const INFRA_ERRORS = ["offline", "unreachable", "serverError", "requestTimeout"];

export const useTeamsStore = defineStore("teamStore", () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const teamFormErrors = reactive<TeamFormErrors>({ general: "" });
    const clearFormErrors = () => {
        teamFormErrors.general = "";
    };

    const getTeams = useQuery({
        queryKey: ["teamsData"],
        queryFn: () => teamsService.getTeams(),
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        select: (data) => ({
            ...data,
            data: [...data.data].sort((a, b) => a.team.localeCompare(b.team)),
        }),
    });
    const refetchTeams = () => getTeams.refetch();

    /** Form mutations surface their error inside the open form. */
    const handleFormError = (err: AxiosError<TeamErrorResponse>) => {
        const { type, message, err: error } = appErrorHandler(err);
        if (error.status === 422 || error.status === 400) {
            teamFormErrors.general = message;
            return;
        }
        if (INFRA_ERRORS.includes(type)) teamFormErrors.general = message;
    };

    const addTeamMutation = useMutation({
        mutationFn: (data: CreateTeamParams) => teamsService.createTeam(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["teamsData"] });
            toast.success(data.message, { dedup: true });
        },
        onError: handleFormError,
    });
    const addTeam = (data: CreateTeamParams) => addTeamMutation.mutateAsync(data);

    const updateTeamMutation = useMutation({
        mutationFn: (data: UpdateTeamParams) => teamsService.updateTeam(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["teamsData"] });
            // A rename changes the team shown against every contestant.
            queryClient.invalidateQueries({ queryKey: ["contestantsData"] });
            toast.success(data.message, { dedup: true });
        },
        onError: handleFormError,
    });
    const updateTeam = (data: UpdateTeamParams) => updateTeamMutation.mutateAsync(data);

    const deleteTeamMutation = useMutation({
        mutationFn: ({ id }: DeleteTeamParams) => teamsService.deleteTeam({ id }),
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries({ queryKey: ["teamsData"] });
            const previousData = queryClient.getQueryData<GetTeamsDTO>(["teamsData"]);
            if (previousData?.data) {
                queryClient.setQueryData<GetTeamsDTO>(["teamsData"], {
                    ...previousData,
                    data: previousData.data.filter((t) => t.team_id !== id),
                });
            }
            return { previousData };
        },
        onSuccess: (data) => toast.success(data.message),
        onError: (err: AxiosError<TeamErrorResponse>, _vars, context) => {
            const parsed = appErrorHandler(err);
            if (INFRA_ERRORS.includes(parsed.type)) toast.error(parsed.message);
            // The API refuses to delete a team that contestants or scores still
            // reference. Its message names the fix, so show it verbatim.
            if (parsed.err.status === 422) toast.error(parsed.message);
            if (parsed.err.status === 404) {
                toast.error("The team may already have been deleted or is not found.");
            }
            if (context?.previousData) {
                queryClient.setQueryData(["teamsData"], context.previousData);
            }
        },
    });
    const deleteTeam = ({ id }: DeleteTeamParams) => deleteTeamMutation.mutate({ id });

    const fetchError = reactive({ serverError: false, offline: false });

    watchEffect(() => {
        if (getTeams.isError.value) {
            const error = getTeams.error.value as AxiosError<TeamErrorResponse>;
            if (error) {
                const { type } = appErrorHandler(error);
                fetchError.offline = type === "offline";
                fetchError.serverError =
                    type === "serverError" || type === "unreachable" || type === "requestTimeout";
            }
        } else if (getTeams.isSuccess.value) {
            fetchError.offline = false;
            fetchError.serverError = false;
        }
    });

    return {
        teamFormErrors,
        clearFormErrors,
        getTeams,
        refetchTeams,
        addTeam,
        updateTeam,
        deleteTeam,
        addTeamMutation,
        updateTeamMutation,
        deleteTeamMutation,
        fetchError: readonly(fetchError),
    };
});
