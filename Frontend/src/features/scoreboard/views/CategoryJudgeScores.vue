<template>
  <ScoreboardPage :is-pending="store.judgeScores.isPending" :is-fetching="store.judgeScores.isFetching"
    :is-offline="judgesFetchError.offline">
    <FeatureHeader :title="`${category.label} - Scores per Judge`"
      description="Every score submitted for this category, grouped by judge." />
    <JudgeScoresDataTable :category="category" :data="store.judgeScores.data" :retry-fn="store.refetchJudgeScores"
      :is-error="judgesFetchError.serverError" />
  </ScoreboardPage>
</template>

<script setup lang="ts">
  import { computed, onMounted } from "vue";
  import { storeToRefs } from "pinia";
  import FeatureHeader from "../../shared/components/reusables/FeatureHeader.vue";
  import ScoreboardPage from "../components/ScoreboardPage.vue";
  import JudgeScoresDataTable from "../components/JudgeScoresDataTable.vue";
  import { useScoreboardStore } from "../store/useScoreboardStore";
  import { SCOREBOARD_CATEGORIES } from "../types/categories";
  import type { ScoreboardCategoryKey } from "../types/types";

  const props = defineProps<{ categoryKey: ScoreboardCategoryKey }>();

  const category = computed(() => SCOREBOARD_CATEGORIES[props.categoryKey]);

  const store = useScoreboardStore(props.categoryKey);
  const { judgesFetchError } = storeToRefs(store);

  // This is the only page that renders the judges payload, so it opts in.
  onMounted(() => store.enableJudgeScores());
</script>
