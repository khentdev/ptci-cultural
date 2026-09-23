/**
 * The "liquid glass" formula already used by the sidebar
 * (shared/components/reusables/FeatureBaseLayout.vue), AppHeader.vue and
 * features/client/Home.vue. Kept in one place so page surfaces match the shell
 * instead of drifting into their own interpretations of it.
 *
 * Data surfaces stay opaque on purpose - see FeatureBaseTable.vue.
 */
export const SURFACE_STYLES = {
    /** Page card: the frame around a feature's header + table. */
    GLASS_CARD: "border border-white/50 bg-white/25 backdrop-blur-lg shadow-2xl shadow-black/5",

    /** Section header strip inside a glass card. */
    GLASS_HEADER: "bg-white/30 backdrop-blur-sm border-b border-white/40",

    /** Standalone floating panel - the offline / not-found takeovers. */
    GLASS_PANEL: "rounded-2xl border border-white/50 bg-white/40 backdrop-blur-lg shadow-2xl shadow-black/5",
} as const
