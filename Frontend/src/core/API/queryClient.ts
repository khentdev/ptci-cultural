import { QueryClient } from "@tanstack/vue-query";

/**
 * The app's QueryClient, kept in its own module so non-component code can reach it.
 *
 * authStore.clearSession() calls queryClient.clear() on logout: the judge queries
 * ("myVocalScores" and friends) are keyed without an account, so cached per-judge
 * data would otherwise be served to the next person to sign in on this device.
 */
export const queryClient = new QueryClient();
