import type { RouteRecordRaw } from "vue-router";

export const settingsRoutes: RouteRecordRaw[] = [
    {
        path: "settings/manage-teams",
        name: "manage-teams",
        meta: { requiresAuth: true },
        component: () => import("./views/ManageTeams.vue"),
    },
    {
        path: "settings/manage-contestants",
        name: "manage-contestants",
        meta: { requiresAuth: true },
        component: () => import("./views/ManageContestants.vue"),
    },
    {
        path: "settings/manage-judge-accounts",
        name: "manage-judge-accounts",
        meta: { requiresAuth: true },
        component: () => import("./views/ManageJudgeAccounts.vue"),
    },
    {
        path: "settings/manage-admin-accounts",
        name: "manage-admin-accounts",
        meta: { requiresAuth: true },
        component: () => import("./views/ManageAdminAccounts.vue"),
    },
];
