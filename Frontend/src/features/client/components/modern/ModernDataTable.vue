<template>
    <feature-base-table>
        <template #table>
            <feature-server-state v-if="isError" :on-retry="retryFn" title="Couldn't load modern dance teams"
                message="There was an issue retrieving the data. Please check your connection and try again." />
            <is-empty-state v-else-if="!scoreRows.length" />
            <table v-else :class="TABLE_STYLES.TB">
                <thead>
                    <tr>
                        <th :class="TABLE_STYLES.TH">Team</th>
                        <th v-for="criterion in CRITERIA" :key="criterion.key" :class="TABLE_STYLES.TH">
                            {{ criterion.label }} ({{ criterion.max }}%)
                        </th>
                    </tr>
                </thead>
                <tbody :class="TABLE_STYLES.TBODY">
                    <tr v-for="row in scoreRows" :key="row.subjectId" class="hover:bg-gray-50 transition-colors">
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <span class="px-2 py-1 rounded text-xs font-medium text-nowrap"
                                :class="getTeamBadgeClasses(row.team)">
                                {{ getFormattedTeamLabel(row.team) }}
                            </span>
                        </td>
                        <td v-for="criterion in CRITERIA" :key="criterion.key" :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" min="0" :max="criterion.max"
                                :value="row[criterion.key]"
                                :disabled="isRowLocked(row.subjectId)"
                                :title="isRowLocked(row.subjectId) ? 'You have already submitted a score for this entry.' : undefined"
                                @input="onCellInput(row, criterion.key, $event)"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </template>
    </feature-base-table>
</template>

<script lang="ts" setup>
    import { computed, watchEffect } from 'vue';
    import { useLocalStorage } from '@vueuse/core';
    import FeatureBaseTable from '../../../shared/components/reusables/FeatureBaseTable.vue';
    import IsEmptyState from '../../../shared/components/reusables/IsEmptyState.vue';
    import FeatureServerState from '../../../shared/components/reusables/FeatureServerState.vue';
    import { TABLE_STYLES } from '../../../shared/constants/tableStyles';
    import { useModernDanceStore } from '../../store/useModernDanceStore';
    import { getFormattedTeamLabel, getTeamBadgeClasses } from '../../types/shared/types';
    import { useScoreInput } from '../../composables/useScoreInput';

    const props = defineProps<{
        inputKey: string;
        retryFn: () => any;
        isLoading?: boolean;
        isError?: boolean;
    }>();

    const { getModernTeams, getMyModernScores } = useModernDanceStore()

    const CRITERIA = [
    { key: "mastery_of_steps", label: "Mastery of Steps", max: 25 },
    { key: "choreography_and_style", label: "Choreography and Style", max: 30 },
    { key: "costume_and_props", label: "Costume and Props", max: 20 },
    { key: "stage_presence", label: "Stage Presence", max: 15 },
    { key: "audience_impact", label: "Audience Impact", max: 10 }
    ] as const;

    type CriterionKey = (typeof CRITERIA)[number]["key"];
    type ScoreRow = { subjectId: string; name: string | null; team: string } & Record<CriterionKey, string>;

    const { clampValues, hasMissingFields } = useScoreInput(
        Object.fromEntries(CRITERIA.map((criterion) => [criterion.key, { max: criterion.max }])) as Record<
            CriterionKey,
            { max: number }
        >
    );

    const scoreRows = useLocalStorage<ScoreRow[]>(props.inputKey, []);

    /** score rows this judge has already committed, keyed by subject id */
    const submittedById = computed(() => {
        const map = new Map<string, Record<string, string>>();
        for (const score of getMyModernScores.data ?? []) {
            map.set(String(score.team_id), score as unknown as Record<string, string>);
        }
        return map;
    });

    const isRowLocked = (subjectId: string) => submittedById.value.has(subjectId);

    const onCellInput = (row: ScoreRow, key: CriterionKey, event: Event) => {
        if (isRowLocked(row.subjectId)) return;
        row[key] = (event.target as HTMLInputElement).value;
        clampValues(row);
    };

    /**
     * Three sources, in priority order: a score already on the server (read-only),
     * a locally cached draft, then a fresh blank row.
     */
    watchEffect(() => {
        const subjects = getModernTeams.data ?? [];
        if (!subjects.length) return;

        const cached = scoreRows.value;
        const submitted = submittedById.value;

        scoreRows.value = subjects.map((s) => {
            const base = {
                    subjectId: String(s.team_id),
                    name: null,
                    team: s.team,
            };
            const serverScore = submitted.get(base.subjectId);
            if (serverScore) {
                return {
                    ...base,
                    ...Object.fromEntries(CRITERIA.map((c2) => [c2.key, String(serverScore[c2.key] ?? "")])),
                } as ScoreRow;
            }
            const draft = cached.find((r) => r.subjectId === base.subjectId);
            if (draft) return { ...draft, ...base } as ScoreRow;
            return {
                ...base,
                ...Object.fromEntries(CRITERIA.map((c2) => [c2.key, ""])),
            } as ScoreRow;
        });
    });

    /** True when any UNLOCKED row still has a blank cell. */
    const validateFields = () =>
        hasMissingFields(scoreRows.value.filter((row) => !isRowLocked(row.subjectId)));

    defineExpose({ validateFields, scoreRows, isRowLocked })
</script>
