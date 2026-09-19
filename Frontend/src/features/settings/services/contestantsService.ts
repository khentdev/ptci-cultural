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
        const res = await axiosInstance.get("/vocal_contestants/readContestants.php")
        return GetTypedResponse<GetContestantsDTO>(res)
    },
    createContestant: async (data: CreateContestantParams) => {
        const res = await axiosInstance.post("/vocal_contestants/createContestants.php", { ...data })
        return GetTypedResponse<CreateContestantDTO>(res)
    },
    updateContestant: async (data: UpdateContestantParams) => {
        const res = await axiosInstance.put("/vocal_contestants/updateContestants.php", { ...data })
        return GetTypedResponse<UpdateContestantDTO>(res)
    },
    deleteContestant: async ({ id }: { id: string }) => {
        const res = await axiosInstance.delete("/vocal_contestants/deleteContestants.php", { data: { cand_id: id } })
        return GetTypedResponse<DeleteContestantDTO>(res)
    },
}
