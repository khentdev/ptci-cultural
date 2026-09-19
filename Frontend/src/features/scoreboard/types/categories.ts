import type { ScoreboardCategory, ScoreboardCategoryKey } from "./types"

export const SCOREBOARD_CATEGORIES: Record<ScoreboardCategoryKey, ScoreboardCategory> = {
    vocal: {
        key: "vocal",
        label: "Vocal Solo",
        subject: "contestant",
        judgesPath: "/category/vocal_solo/getJudgeScore.php",
        finalPath: "/category/vocal_solo/vocalFinalScore.php",
        criteria: [
            { key: "voice_tone_quality", label: "Voice/Tone Quality", max: 30 },
            { key: "mastery_and_timing", label: "Mastery and Timing", max: 25 },
            { key: "vocal_expression", label: "Vocal Expression", max: 15 },
            { key: "diction", label: "Diction", max: 10 },
            { key: "stage_presence", label: "Stage Presence", max: 10 },
            { key: "entertainment_value", label: "Entertainment Value", max: 10 },
        ],
    },
    interpretative: {
        key: "interpretative",
        label: "Interpretative Dance",
        subject: "team",
        judgesPath: "/category/interpretative_dance/getJudgeScore.php",
        finalPath: "/category/interpretative_dance/InterpretativeFinalScore.php",
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
        judgesPath: "/category/modern_dance/getJudgeScore.php",
        finalPath: "/category/modern_dance/modernFinalScore.php",
        criteria: [
            { key: "mastery_of_steps", label: "Mastery of Steps", max: 25 },
            { key: "choreography_and_style", label: "Choreography and Style", max: 30 },
            { key: "costume_and_props", label: "Costume and Props", max: 20 },
            { key: "stage_presence", label: "Stage Presence", max: 15 },
            { key: "audience_impact", label: "Audience Impact", max: 10 },
        ],
    },
}
