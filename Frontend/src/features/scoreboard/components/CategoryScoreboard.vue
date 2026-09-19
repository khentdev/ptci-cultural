<template>
  <section class="min-h-screen p-3 overflow-x-auto flex flex-col items-center justify-center">
    <div class="w-full max-w-full mt-12 rounded-2xl" :class="{ 'border border-gray-200': !isPending }">
      <div class="overflow-hidden rounded-2xl">
        <FeatureOfflineState v-if="fetchError.offline || isOffline" />
        <DataLoadingState v-else-if="isPending" />
        <template v-else>
          <div class="relative space-y-8">
            <InlineFetchIndicator v-show="isFetching" />

            <div>
              <FeatureHeader :title="`${category.label} - Final Scores`"
                :description="`Averaged score per ${subjectNoun}, highest first.`" />
              <OverallScoreDataTable :category="category" :rows="rankedFinalScores" :retry-fn="refetchAll"
                :is-error="fetchError.serverError" />
            </div>

            <div>
              <FeatureHeader :title="`${category.label} - Scores per Judge`"
                :description="`Every score submitted for this category, grouped by judge.`" />
              <JudgeScoresDataTable :category="category" :data="judgeScores.data" :retry-fn="refetchAll"
                :is-error="fetchError.serverError" />
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
  import InlineFetchIndicator from "../../shared/components/reusables/InlineFetchIndicator.vue";
  import OverallScoreDataTable from "./OverallScoreDataTable.vue";
  import JudgeScoresDataTable from "./JudgeScoresDataTable.vue";
  import { useNetworkCheck } from "../../../shared/composables/useNetworkStatus";
  import { useScoreboardStore } from "../store/useScoreboardStore";
  import { SCOREBOARD_CATEGORIES } from "../types/categories";
  import type { ScoreboardCategoryKey } from "../types/types";

  const props = defineProps<{ categoryKey: ScoreboardCategoryKey }>();

  const category = computed(() => SCOREBOARD_CATEGORIES[props.categoryKey]);
  const subjectNoun = computed(() => (category.value.subject === "contestant" ? "contestant" : "team"));

  const { isOnline } = useNetworkCheck();
  const isOffline = computed(() => !isOnline.value);

  const store = useScoreboardStore(props.categoryKey);
  const { judgeScores, rankedFinalScores, refetchAll, fetchError } = store;

  const isPending = computed(() => judgeScores.isPending || store.finalScores.isPending);
  const isFetching = computed(() => judgeScores.isFetching || store.finalScores.isFetching);

  onMounted(() => store.enable());
</script>
