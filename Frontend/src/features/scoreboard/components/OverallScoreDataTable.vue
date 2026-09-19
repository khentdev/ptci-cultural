<template>
  <FeatureBaseTable>
    <template #table>
      <FeatureServerState v-if="isError" :on-retry="retryFn" :title="`Couldn't load ${category.label} final scores`"
        message="There was an issue retrieving the scores. Please check your connection and try again." />
      <IsEmptyState v-else-if="!rows.length" />
      <table v-else :class="TABLE_STYLES.TB">
        <thead :class="TABLE_STYLES.THEADROW">
          <tr>
            <th :class="TABLE_STYLES.TH">Rank</th>
            <th v-if="category.subject === 'contestant'" :class="TABLE_STYLES.TH">Contestant</th>
            <th :class="TABLE_STYLES.TH">Team</th>
            <th :class="TABLE_STYLES.TH">Final Score</th>
          </tr>
        </thead>
        <tbody :class="TABLE_STYLES.TBODY">
          <tr v-for="(row, index) in rows" :key="row.id" class="hover:bg-gray-50 transition-colors">
            <td :class="TABLE_STYLES.TD.bold">{{ RANK_LABELS[index] ?? `#${index + 1}` }}</td>
            <td v-if="category.subject === 'contestant'" :class="TABLE_STYLES.TD.bold">
              {{ FormatFullName(row.name) }}
            </td>
            <td :class="TABLE_STYLES.TD.no_bold">
              <span class="px-2 py-1 rounded text-xs font-medium text-nowrap" :class="getTeamBadgeClasses(row.team)">
                {{ getFormattedTeamLabel(row.team) || "-" }}
              </span>
            </td>
            <td :class="TABLE_STYLES.TD.bold">{{ row.finalScore.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </FeatureBaseTable>
</template>

<script setup lang="ts">
  import FeatureBaseTable from "../../shared/components/reusables/FeatureBaseTable.vue";
  import IsEmptyState from "../../shared/components/reusables/IsEmptyState.vue";
  import FeatureServerState from "../../shared/components/reusables/FeatureServerState.vue";
  import { TABLE_STYLES } from "../../shared/constants/tableStyles";
  import { FormatFullName } from "../../../utils/capitalizeWord";
  import { getFormattedTeamLabel, getTeamBadgeClasses } from "../../client/types/shared/types";
  import type { ScoreboardCategory } from "../types/types";
  import type { NormalizedFinalRow } from "../store/useScoreboardStore";

  defineProps<{
    category: ScoreboardCategory;
    rows: NormalizedFinalRow[];
    retryFn: () => any;
    isError?: boolean;
  }>();

  const RANK_LABELS = ["1st", "2nd", "3rd"];
</script>
