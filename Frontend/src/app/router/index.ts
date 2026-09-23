import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import { useAuthStore } from "../../features/auth/store/authStore";
import { authRoutes } from "../../features/auth/authRoutes";
import { clientRoutes } from "../../features/client/clientRoutes";
import { scoreboardRoutes } from "../../features/scoreboard/scoreboardRoutes";
import { settingsRoutes } from "../../features/settings/settingsRoutes";

declare module "vue-router" {
    interface RouteMeta {
        requiresAuth?: boolean;
        /** Role required to enter. Enforced by the global guard below. */
        role?: "admin" | "judge";
    }
}

const routes: RouteRecordRaw[] = [
    {
        path: "",
        name: "root",
        component: () => import("../../views/initialMount.vue"),
    },
    {
        path: "/auth",
        name: "auth",
        component: () => import("../layouts/authLayout.vue"),
        redirect: { name: "login" },
        children: [...authRoutes],
    },
    {
        path: "/dashboard",
        name: "dashboard",
        meta: { requiresAuth: true, role: "admin" },
        redirect: { name: "scoreboard-vocal" },
        component: () => import("../layouts/dashboardLayout.vue"),
        children: [
            ...scoreboardRoutes,
            ...settingsRoutes,
            {
                path: ":pathMatch(.*)*",
                name: "dashboard-not-found",
                meta: { requiresAuth: true },
                component: () =>
                    import("../../features/shared/components/404/AppNotFound.vue"),
            },
        ],
    },
    {
        path: "/judge",
        name: "judge",
        meta: { requiresAuth: true, role: "judge" },
        redirect: { name: "judge-home" },
        component: () => import("../layouts/ClientLayout.vue"),
        children: [...clientRoutes],
    },
    {
        path: "/:pathMatch(.*)*",
        name: "global-not-found",
        component: () => import("../../views/404/Global404NotFound.vue"),
    },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to) => {
    const authStore = useAuthStore();

    if (!to.matched.some((r) => r.meta.requiresAuth)) return true;

    if (!authStore.loadingState.sessionInitialized) {
        await authStore.refreshSession();
    }

    // Check the user object rather than a boolean flag: a refreshSession that
    // failed with a 5xx reports logout:false, and must not admit anyone.
    const user = authStore.getUserMetaData;
    if (!user) return { name: "login" };

    const required = to.matched.find((r) => r.meta.role)?.meta.role;
    if (required && user.role !== required) {
        return { name: user.role === "admin" ? "scoreboard-vocal" : "judge-home" };
    }

    return true;
});
