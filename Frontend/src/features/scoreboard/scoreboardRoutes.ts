import type { RouteRecordRaw } from "vue-router";

export const scoreboardRoutes: RouteRecordRaw[] = [
    {
        path: "scores/vocal",
        name: "scoreboard-vocal",
        meta: { requiresAuth: true },
        component: () => import("./views/VocalScoreboard.vue"),
    },
    {
        path: "scores/interpretative",
        name: "scoreboard-interpretative",
        meta: { requiresAuth: true },
        component: () => import("./views/InterpretativeScoreboard.vue"),
    },
    {
        path: "scores/modern",
        name: "scoreboard-modern",
        meta: { requiresAuth: true },
        component: () => import("./views/ModernScoreboard.vue"),
    },
    {
        path: "scores/top-3",
        name: "scoreboard-top3",
        meta: { requiresAuth: true },
        component: () => import("./views/TopThree.vue"),
    },
];
