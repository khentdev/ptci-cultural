import axiosInstance from '../../../core/API/axiosConfig';
import { GetTypedResponse } from '../../shared/types/typedResponse';

import type {
    CreateContestantDTO,
    CreateContestantParams,
    DeleteContestantDTO,
    GetContestantsDTO,
    UpdateContestantDTO,
    UpdateContestantParams,
} from "../types/contestants";

export const contestantsService = {
    getContestants: async () => {
        const res = await axiosInstance.get("/contestants")
        return GetTypedResponse<GetContestantsDTO>(res)
    },
    createContestant: async (data: CreateContestantParams) => {
        const res = await axiosInstance.post("/contestants", { ...data })
        return GetTypedResponse<CreateContestantDTO>(res)
    },
    updateContestant: async (data: UpdateContestantParams) => {
        const res = await axiosInstance.put(`/contestants/${data.cand_id}`, { ...data })
        return GetTypedResponse<UpdateContestantDTO>(res)
    },
    deleteContestant: async ({ id }: { id: string }) => {
        const res = await axiosInstance.delete(`/contestants/${id}`)
        return GetTypedResponse<DeleteContestantDTO>(res)
    },
}
