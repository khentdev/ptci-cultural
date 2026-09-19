import axiosInstance from '../../../core/API/axiosConfig';
import { GetTypedResponse } from '../../shared/types/typedResponse';

import type { UpdateCandidateDTO, CreateCandidateDTO, CreateCandidateParams, GetCandidatesDTO, UpdateCandidateParams, DeleteCandidateDTO } from "../types/candidates";

export const candidatesService = {
    getCandidates: async () => {
        const res = await axiosInstance.get("/contestants/readContestants.php")
        return GetTypedResponse<GetCandidatesDTO>(res)
    },
    createCandidate: async (data: CreateCandidateParams) => {
        const res = await axiosInstance.post("/contestants/createContestants.php", { ...data })
        return GetTypedResponse<CreateCandidateDTO>(res)
    },
    updateCandidate: async (data: UpdateCandidateParams) => {
        const res = await axiosInstance.put("/contestants/updateContestants.php", { ...data })
        return GetTypedResponse<UpdateCandidateDTO>(res)
    },
    deleteCandidate: async ({ id }: { id: string }) => {
        const res = await axiosInstance.delete("/contestants/deleteContestants.php", { data: { cand_id: id } });
        return GetTypedResponse<DeleteCandidateDTO>(res);
    }
}