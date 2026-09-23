import type { RouteRecordRaw } from "vue-router";

import {
    SCOREBOARD_CATEGORY_ORDER,
    finalScoresRouteName,
    judgeScoresRouteName,
    topThreeRouteName,
} from "./types/categories";

/**
 * Four records per category. The bare `scores/<key>` URL stays on as a redirect so
 * old links keep working - and so the `scoreboard-vocal` name that /dashboard, the
 * auth guard and the post-login push all point at keeps resolving.
 */
const categoryRoutes = SCOREBOARD_CATEGORY_ORDER.flatMap((key): RouteRecordRaw[] => [
    {
        path: `scores/${key}`,
        name: `scoreboard-${key}`,
        meta: { requiresAuth: true },
        redirect: { name: finalScoresRouteName(key) },
    },
    {
        path: `scores/${key}/final`,
        name: finalScoresRouteName(key),
        meta: { requiresAuth: true },
        props: { categoryKey: key },
        component: () => import("./views/CategoryFinalScores.vue"),
    },
    {
        path: `scores/${key}/judges`,
        name: judgeScoresRouteName(key),
        meta: { requiresAuth: true },
        props: { categoryKey: key },
        component: () => import("./views/CategoryJudgeScores.vue"),
    },
    {
        path: `scores/${key}/top-3`,
        name: topThreeRouteName(key),
        meta: { requiresAuth: true },
        props: { categoryKey: key },
        component: () => import("./views/CategoryTopThree.vue"),
    },
]);

export const scoreboardRoutes: RouteRecordRaw[] = [
    ...categoryRoutes,
    {
        // The old combined page is gone; land on the first category's Top 3 instead.
        path: "scores/top-3",
        name: "scoreboard-top3",
        meta: { requiresAuth: true },
        redirect: { name: topThreeRouteName(SCOREBOARD_CATEGORY_ORDER[0]) },
    },
];
