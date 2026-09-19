import type { RouteRecordRaw } from "vue-router";

export const clientRoutes: RouteRecordRaw[] = [
    {
        path: "home",
        name: "judge-home",
        meta: { requiresAuth: true },
        component: () => import("./Home.vue"),
    },
    {
        path: "vocal-solo",
        name: "vocal-solo",
        meta: { requiresAuth: true },
        component: () => import("./categories/Vocal.vue"),
    },
    {
        path: "interpretative-dance",
        name: "interpretative-dance",
        meta: { requiresAuth: true },
        component: () => import("./categories/Interpretative.vue"),
    },
    {
        path: "modern-dance",
        name: "modern-dance",
        meta: { requiresAuth: true },
        component: () => import("./categories/Modern.vue"),
    },
];
