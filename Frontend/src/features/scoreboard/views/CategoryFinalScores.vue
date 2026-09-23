<template>
  <ScoreboardPage :is-pending="store.finalScores.isPending" :is-fetching="store.finalScores.isFetching"
    :is-offline="finalFetchError.offline">
    <FeatureHeader :title="`${category.label} - Final Scores`"
      :description="`Averaged score per ${subjectNoun}, highest first.`" />
    <OverallScoreDataTable :category="category" :rows="rankedFinalScores" :retry-fn="store.refetchFinalScores"
      :is-error="finalFetchError.serverError" />
  </ScoreboardPage>
</template>

<script setup lang="ts">
  import { computed, onMounted } from "vue";
  import { storeToRefs } from "pinia";
  import FeatureHeader from "../../shared/components/reusables/FeatureHeader.vue";
  import ScoreboardPage from "../components/ScoreboardPage.vue";
  import OverallScoreDataTable from "../components/OverallScoreDataTable.vue";
  import { useScoreboardStore } from "../store/useScoreboardStore";
  import { SCOREBOARD_CATEGORIES } from "../types/categories";
  import type { ScoreboardCategoryKey } from "../types/types";

  const props = defineProps<{ categoryKey: ScoreboardCategoryKey }>();

  const category = computed(() => SCOREBOARD_CATEGORIES[props.categoryKey]);
  const subjectNoun = computed(() => (category.value.subject === "contestant" ? "contestant" : "team"));

  const store = useScoreboardStore(props.categoryKey);
  const { rankedFinalScores, finalFetchError } = storeToRefs(store);

  // Fetch only when this page is actually opened.
  onMounted(() => store.enableFinalScores());
</script>
