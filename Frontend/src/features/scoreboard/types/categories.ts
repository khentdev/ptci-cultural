import type { ScoreboardCategory, ScoreboardCategoryKey } from "./types"

export const SCOREBOARD_CATEGORIES: Record<ScoreboardCategoryKey, ScoreboardCategory> = {
    vocal: {
        key: "vocal",
        label: "Vocal Solo",
        subject: "contestant",
        judgesPath: "/scores/vocal/judges",
        finalPath: "/scores/vocal/final",
        criteria: [
            { key: "voice_tone_quality", label: "Voice/Tone Quality", max: 30 },
            { key: "mastery_and_timing", label: "Mastery and Timing", max: 25 },
            { key: "vocal_expression", label: "Vocal Expression", max: 15 },
            { key: "diction", label: "Diction", max: 10 },
            { key: "stage_presence", label: "Stage Presence", max: 10 },
            { key: "entertainment_value", label: "Entertainment Value", max: 10 },
        ],
    },
    cultural: {
        key: "cultural",
        label: "Cultural Dance",
        subject: "team",
        judgesPath: "/scores/cultural/judges",
        finalPath: "/scores/cultural/final",
        criteria: [
            { key: "originality", label: "Originality", max: 25 },
            { key: "mastery_of_steps", label: "Mastery of Steps", max: 15 },
            { key: "choreography_and_style", label: "Choreography and Style", max: 20 },
            { key: "costume_and_props", label: "Costume and Props", max: 25 },
            { key: "stage_presence", label: "Stage Presence", max: 15 },
        ],
    },
    modern: {
        key: "modern",
        label: "Modern Dance",
        subject: "team",
        judgesPath: "/scores/modern/judges",
        finalPath: "/scores/modern/final",
        criteria: [
            { key: "mastery_of_steps", label: "Mastery of Steps", max: 25 },
            { key: "choreography_and_style", label: "Choreography and Style", max: 30 },
            { key: "costume_and_props", label: "Costume and Props", max: 20 },
            { key: "stage_presence", label: "Stage Presence", max: 15 },
            { key: "audience_impact", label: "Audience Impact", max: 10 },
        ],
    },
}

/**
 * Sidebar order and URL generation order. Typed as a non-empty tuple because the
 * `scores/top-3` redirect resolves against the first entry.
 */
export const SCOREBOARD_CATEGORY_ORDER: readonly [ScoreboardCategoryKey, ...ScoreboardCategoryKey[]] = [
    "vocal",
    "modern",
    "cultural",
]

/** Derived in one place so the router and the sidebar cannot drift apart. */
export const finalScoresRouteName = (key: ScoreboardCategoryKey) => `scoreboard-${key}-final`
export const judgeScoresRouteName = (key: ScoreboardCategoryKey) => `scoreboard-${key}-judges`
export const topThreeRouteName = (key: ScoreboardCategoryKey) => `scoreboard-${key}-top3`
