<template>
  <FeatureBaseTable>
    <template #table>
      <FeatureServerState v-if="isError" :on-retry="retryFn" :title="`Couldn't load ${category.label} judge scores`"
        message="There was an issue retrieving the scores. Please check your connection and try again." />
      <IsEmptyState v-else-if="!judgeGroups.length" />
      <table v-else :class="TABLE_STYLES.TB">
        <thead :class="TABLE_STYLES.THEADROW">
          <tr>
            <th :class="TABLE_STYLES.TH">Judge</th>
            <th v-if="category.subject === 'contestant'" :class="TABLE_STYLES.TH">Contestant</th>
            <th :class="TABLE_STYLES.TH">Team</th>
            <th v-for="criterion in category.criteria" :key="criterion.key" :class="TABLE_STYLES.TH">
              {{ criterion.label }} ({{ criterion.max }}%)
            </th>
            <th :class="TABLE_STYLES.TH">Total</th>
          </tr>
        </thead>
        <tbody :class="TABLE_STYLES.TBODY">
          <template v-for="(group, groupIndex) in judgeGroups" :key="group.judgeKey">
            <tr v-for="(row, rowIndex) in group.rows" :key="row.score_id" class="hover:bg-gray-50 transition-colors">
              <td :class="TABLE_STYLES.TD.bold">
                <span v-if="rowIndex === 0">Judge {{ groupIndex + 1 }}</span>
              </td>
              <td v-if="category.subject === 'contestant'" :class="TABLE_STYLES.TD.bold">
                {{ FormatFullName(row.cand_name ?? "-") }}
              </td>
              <td :class="TABLE_STYLES.TD.no_bold">
                <span class="px-2 py-1 rounded text-xs font-medium text-nowrap"
                  :class="getTeamBadgeClasses(row.cand_team ?? row.team)">
                  {{ getFormattedTeamLabel(row.cand_team ?? row.team) || "-" }}
                </span>
              </td>
              <td v-for="criterion in category.criteria" :key="criterion.key" :class="TABLE_STYLES.TD.no_bold">
                {{ row[criterion.key] ?? "-" }}
              </td>
              <td :class="TABLE_STYLES.TD.bold">{{ row.total_score }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>
  </FeatureBaseTable>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import FeatureBaseTable from "../../shared/components/reusables/FeatureBaseTable.vue";
  import IsEmptyState from "../../shared/components/reusables/IsEmptyState.vue";
  import FeatureServerState from "../../shared/components/reusables/FeatureServerState.vue";
  import { TABLE_STYLES } from "../../shared/constants/tableStyles";
  import { FormatFullName } from "../../../utils/capitalizeWord";
  import { getFormattedTeamLabel, getTeamBadgeClasses } from "../../client/types/shared/types";
  import type { JudgeScoresMap, ScoreboardCategory } from "../types/types";

  const props = defineProps<{
    category: ScoreboardCategory;
    data?: JudgeScoresMap;
    retryFn: () => any;
    isError?: boolean;
  }>();

  // The backend already groups rows under "judge_<id>" keys; judges stay anonymous
  // in the UI and are labelled positionally.
  const judgeGroups = computed(() =>
    Object.entries(props.data ?? {}).map(([judgeKey, rows]) => ({ judgeKey, rows }))
  );
</script>
