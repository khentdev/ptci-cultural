import axiosInstance from '../../../core/API/axiosConfig';
import { GetTypedResponse } from '../../shared/types/typedResponse';

import type {
    CreateTeamDTO,
    CreateTeamParams,
    DeleteTeamDTO,
    GetTeamsDTO,
    UpdateTeamDTO,
    UpdateTeamParams,
} from "../types/teams";

export const teamsService = {
    getTeams: async () => {
        const res = await axiosInstance.get("/teams")
        return GetTypedResponse<GetTeamsDTO>(res)
    },
    createTeam: async (data: CreateTeamParams) => {
        const res = await axiosInstance.post("/teams", { ...data })
        return GetTypedResponse<CreateTeamDTO>(res)
    },
    updateTeam: async ({ team_id, team }: UpdateTeamParams) => {
        const res = await axiosInstance.put(`/teams/${team_id}`, { team })
        return GetTypedResponse<UpdateTeamDTO>(res)
    },
    deleteTeam: async ({ id }: { id: string }) => {
        const res = await axiosInstance.delete(`/teams/${id}`)
        return GetTypedResponse<DeleteTeamDTO>(res)
    },
}
