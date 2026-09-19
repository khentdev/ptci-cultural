<template>
  <section class="min-h-screen p-3 overflow-x-auto flex flex-col items-center justify-center">
    <div class="w-full max-w-full mt-12 rounded-2xl" :class="{ 'border border-gray-200': !isPending }">
      <div class="overflow-hidden rounded-2xl">
        <FeatureOfflineState v-if="anyOffline || isOffline" />
        <DataLoadingState v-else-if="isPending" />
        <template v-else>
          <div class="relative space-y-8">
            <FeatureHeader title="Top 3 per Category"
              description="The three highest averaged scores in each Cultural Night category." />
            <div v-for="entry in categories" :key="entry.category.key">
              <FeatureHeader :title="entry.category.label" :description="`Top 3 ${entry.category.subject === 'contestant' ? 'contestants' : 'teams'}`" />
              <OverallScoreDataTable :category="entry.category" :rows="entry.store.topThree"
                :retry-fn="entry.store.refetchAll" :is-error="entry.store.fetchError.serverError" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, onMounted } from "vue";
  import FeatureHeader from "../../shared/components/reusables/FeatureHeader.vue";
  import DataLoadingState from "../../shared/components/reusables/DataLoadingState.vue";
  import FeatureOfflineState from "../../shared/components/reusables/FeatureOfflineState.vue";
  import OverallScoreDataTable from "../components/OverallScoreDataTable.vue";
  import { useNetworkCheck } from "../../../shared/composables/useNetworkStatus";
  import { useScoreboardStore } from "../store/useScoreboardStore";
  import { SCOREBOARD_CATEGORIES } from "../types/categories";
  import type { ScoreboardCategoryKey } from "../types/types";

  const KEYS: ScoreboardCategoryKey[] = ["vocal", "interpretative", "modern"];

  const { isOnline } = useNetworkCheck();
  const isOffline = computed(() => !isOnline.value);

  // Reuses each category's existing store, so no extra requests beyond the final-score query.
  const categories = KEYS.map((key) => ({
    category: SCOREBOARD_CATEGORIES[key],
    store: useScoreboardStore(key),
  }));

  const isPending = computed(() => categories.some((c) => c.store.finalScores.isPending));
  const anyOffline = computed(() => categories.some((c) => c.store.fetchError.offline));

  onMounted(() => categories.forEach((c) => c.store.enable()));
</script>
