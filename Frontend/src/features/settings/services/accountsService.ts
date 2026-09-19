import axiosInstance from '../../../core/API/axiosConfig';
import { GetTypedResponse } from '../../shared/types/typedResponse';

import type { AccountIdParams, AccountMutationDTO, AccountRole, CreateAccountParams, GetAccountsDTO, ResetPasswordParams, SetAccountActiveParams } from "../types/accounts";

// The PHP backend routes by file, not by REST path, and reads mutation bodies
// from php://input - so ids travel in the body rather than the URL.
export const accountsService = {
    getAccounts: async (role: AccountRole) => {
        const res = await axiosInstance.get("/users/readUsers.php", { params: { role } })
        return GetTypedResponse<GetAccountsDTO>(res)
    },
    createAccount: async (data: CreateAccountParams) => {
        const res = await axiosInstance.post("/users/createUsers.php", { ...data })
        return GetTypedResponse<AccountMutationDTO>(res)
    },
    resetPassword: async ({ id, password }: ResetPasswordParams) => {
        const res = await axiosInstance.put("/users/resetPassword.php", { id, password })
        return GetTypedResponse<AccountMutationDTO>(res)
    },
    resetSubmission: async ({ id }: AccountIdParams) => {
        const res = await axiosInstance.put("/users/resetSubmission.php", { id })
        return GetTypedResponse<AccountMutationDTO>(res)
    },
    setActive: async ({ id, is_active }: SetAccountActiveParams) => {
        const res = await axiosInstance.put("/users/setActive.php", { id, is_active })
        return GetTypedResponse<AccountMutationDTO>(res)
    },
    deleteAccount: async ({ id }: AccountIdParams) => {
        const res = await axiosInstance.delete("/users/deleteUsers.php", { data: { id } })
        return GetTypedResponse<AccountMutationDTO>(res)
    }
}
