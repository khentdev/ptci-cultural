<template>
    <feature-base-table>
        <template #table>
            <feature-server-state v-if="isError" :on-retry="retryFn" title="Couldn't load vocal contestants"
                message="There was an issue retrieving the data. Please check your connection and try again." />
            <is-empty-state v-else-if="!scoreRows.length" />
            <table v-else :class="TABLE_STYLES.TB">
                <thead>
                    <tr>
                        <th :class="TABLE_STYLES.TH">Full Name</th>
                        <th :class="TABLE_STYLES.TH">Team</th>
                        <th v-for="criterion in CRITERIA" :key="criterion.key" :class="TABLE_STYLES.TH">
                            {{ criterion.label }} ({{ criterion.max }}%)
                        </th>
                    </tr>
                </thead>
                <tbody :class="TABLE_STYLES.TBODY">
                    <tr v-for="row in scoreRows" :key="row.subjectId" class="hover:bg-gray-50 transition-colors">
                        <td
                            class="px-6 py-3 text-xs md:text-sm text-gray-800 font-medium border-gray-200 break-words min-w-35 max-w-35">
                            {{ FormatFullName(row.name ?? "") }}
                        </td>
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
    import { useScoreDrafts } from '../../composables/useScoreDrafts';
    import type { ScoreDraftKey } from '../../composables/useScoreDrafts';
    import { computed, watchEffect } from 'vue';
    import FeatureBaseTable from '../../../shared/components/reusables/FeatureBaseTable.vue';
    import IsEmptyState from '../../../shared/components/reusables/IsEmptyState.vue';
    import FeatureServerState from '../../../shared/components/reusables/FeatureServerState.vue';
    import { TABLE_STYLES } from '../../../shared/constants/tableStyles';
    import { useVocalStore } from '../../store/useVocalStore';
    import { getFormattedTeamLabel, getTeamBadgeClasses } from '../../types/shared/types';
    import { FormatFullName } from '../../../../utils/capitalizeWord';
    import { useScoreInput } from '../../composables/useScoreInput';

    const props = defineProps<{
        inputKey: ScoreDraftKey;
        retryFn: () => any;
        isLoading?: boolean;
        isError?: boolean;
    }>();

    const { getVocalCandidates, getMyVocalScores } = useVocalStore()

    const CRITERIA = [
    { key: "voice_tone_quality", label: "Voice/Tone Quality", max: 30 },
    { key: "mastery_and_timing", label: "Mastery and Timing", max: 25 },
    { key: "vocal_expression", label: "Vocal Expression", max: 15 },
    { key: "diction", label: "Diction", max: 10 },
    { key: "stage_presence", label: "Stage Presence", max: 10 },
    { key: "entertainment_value", label: "Entertainment Value", max: 10 }
    ] as const;

    type CriterionKey = (typeof CRITERIA)[number]["key"];
    type ScoreRow = { subjectId: string; name: string | null; team: string } & Record<CriterionKey, string>;

    const { clampValues, hasMissingFields } = useScoreInput(
        Object.fromEntries(CRITERIA.map((criterion) => [criterion.key, { max: criterion.max }])) as Record<
            CriterionKey,
            { max: number }
        >
    );

    const scoreRows = useScoreDrafts<ScoreRow>(props.inputKey);

    /** score rows this judge has already committed, keyed by subject id */
    const submittedById = computed(() => {
        const map = new Map<string, Record<string, string>>();
        for (const score of getMyVocalScores.data ?? []) {
            map.set(String(score.cand_id), score as unknown as Record<string, string>);
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
        const subjects = getVocalCandidates.data ?? [];
        if (!subjects.length) return;

        const cached = scoreRows.value;
        const submitted = submittedById.value;

        scoreRows.value = subjects.map((s) => {
            const base = {
                    subjectId: String(s.cand_id),
                    name: s.cand_name,
                    team: s.cand_team,
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
