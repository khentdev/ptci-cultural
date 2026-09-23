import { useLocalStorage } from "@vueuse/core";
import { nextTick } from "vue";
import type { Ref } from "vue";

/**
 * localStorage keys holding a judge's unsubmitted score drafts, one per category.
 *
 * Drafts are deliberately keyed per browser, not per account, so that a judge can
 * refresh or reopen the tab mid-scoring without losing work. The flip side is that
 * they MUST be wiped when a session ends - see clearAllScoreDrafts.
 */
export const SCORE_DRAFT_KEYS = {
    vocal: "vocal-scores",
    modern: "modern-dance-scores",
    cultural: "cultural-scores",
} as const;

export type ScoreDraftKey = (typeof SCORE_DRAFT_KEYS)[keyof typeof SCORE_DRAFT_KEYS];

/**
 * One ref per key, shared by the category store and its data table. They used to
 * create separate useLocalStorage refs over the same key, which could diverge
 * in-memory; sharing one instance also lets clearAllScoreDrafts reset live state.
 */
const drafts = new Map<ScoreDraftKey, Ref<unknown[]>>();

export const useScoreDrafts = <T>(key: ScoreDraftKey): Ref<T[]> => {
    const existing = drafts.get(key);
    if (existing) return existing as Ref<T[]>;

    const created = useLocalStorage<T[]>(key, []);
    drafts.set(key, created as unknown as Ref<unknown[]>);
    return created as Ref<T[]>;
};

/**
 * Wipe every judge's drafts. Called on session teardown (authStore.clearSession),
 * so the next account to sign in on this device never inherits them.
 */
export const clearAllScoreDrafts = () => {
    const remove = (key: ScoreDraftKey) => {
        try {
            localStorage.removeItem(key);
        } catch {
            // Private mode or blocked site data - the in-memory reset still holds.
        }
    };

    for (const key of Object.values(SCORE_DRAFT_KEYS)) {
        // Reset the live ref so nothing can write the old drafts back, then drop the key.
        const ref = drafts.get(key);
        if (ref) ref.value = [];
        remove(key);
    }

    // VueUse persists on change with a "pre" flush, i.e. asynchronously: that pending
    // write lands AFTER the removal above and would restore each key as "[]". Harmless
    // in effect, but it leaves logout traces behind, so sweep again once it has run.
    void nextTick(() => {
        for (const key of Object.values(SCORE_DRAFT_KEYS)) remove(key);
    });
};
