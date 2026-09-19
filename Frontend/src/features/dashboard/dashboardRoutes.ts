import type { RouteRecordRaw } from "vue-router";

export const dashboardRoutes: RouteRecordRaw[] = [
    {
        path: "overview",
        name: "dashboard-overview",
        meta: { requiresAuth: true },
        component: () => import("./views/Overview.vue"),
    },
];
