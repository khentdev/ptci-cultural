<template>
    <feature-base-table>
        <template #table>
            <feature-server-state :on-retry="retryFn" :title="`Couldn't load interpretative contestants`"
                message="There was an issue retrieving contestants data. Please check your connection and try again."
                v-if="isError" />
            <is-empty-state v-else-if="!candidatesQuery" />
            <table :class="TABLE_STYLES.TB" v-else>
                <thead>
                    <tr>
                        <th :class="TABLE_STYLES.TH">Team</th>
                        <th :class="TABLE_STYLES.TH">Originality (25%)</th>
                        <th :class="TABLE_STYLES.TH">Mastery of Steps (15%)</th>
                        <th :class="TABLE_STYLES.TH">Choreography and Style (20%)</th>
                        <th :class="TABLE_STYLES.TH">Costume and Props (25%)</th>
                        <th :class="TABLE_STYLES.TH">Stage Presence (15%)</th>
                    </tr>
                </thead>
                <tbody :class="TABLE_STYLES.TBODY">
                    <tr class="hover:bg-gray-50 transition-colors" v-for="c in candidateScoreInputs" :key="c.team_id!">
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <span class="px-2 py-1 rounded text-xs font-medium text-nowrap"
                                :class="getTeamBadgeClasses(c.team)">
                                {{ getFormattedTeamLabel(c.team) }}
                            </span>
                        </td>

                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.originality" :max="SCORE_CRITERIA.originality.max"
                                :disabled="hasSubmitted" @input="clampValues(c)" min="0"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.mastery_of_steps" :max="SCORE_CRITERIA.mastery_of_steps.max"
                                min="0" :disabled="hasSubmitted" @input="clampValues(c)"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.choreography_and_style"
                                :max="SCORE_CRITERIA.choreography_and_style.max" :disabled="hasSubmitted" min="0"
                                @input="clampValues(c)"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.costume_and_props" :max="SCORE_CRITERIA.costume_and_props.max"
                                :disabled="hasSubmitted" min="0" @input="clampValues(c)"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.stage_presence" :max="SCORE_CRITERIA.stage_presence.max"
                                :disabled="hasSubmitted" min="0" @input="clampValues(c)"
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
    import FeatureBaseTable from '../../../shared/components/reusables/FeatureBaseTable.vue';
    import IsEmptyState from '../../../shared/components/reusables/IsEmptyState.vue';
    import FeatureServerState from '../../../shared/components/reusables/FeatureServerState.vue';
    import { useLocalStorage } from '@vueuse/core';
    import { TABLE_STYLES } from '../../../shared/constants/tableStyles';
    import { useInterpretativeStore } from '../../store/useInterpretativeStore';
    import type { CandidateTeamOptions } from '../../types/talent/types';
    import { CapitalizeLabel } from '../../../../utils/capitalizeWord';

    const { getInterpretativeTeams, isSubmitted } = useInterpretativeStore()
    const props = defineProps<{
        inputKey: string;
        inputKeySubmitted?: string;
        retryFn: () => any;
        isLoading?: boolean;
        isError?: boolean;
    }>();


    const hasSubmitted = computed(() =>
        isSubmitted(props.inputKeySubmitted ?? "")
    );


    type ScoreFields = {
        team_id: string | null,
        team: Capitalize<CandidateTeamOptions>
        originality: string,
        mastery_of_steps: string,
        choreography_and_style: string,
        costume_and_props: string,
        stage_presence: string
    }

    const SCORE_CRITERIA = {
        originality: { max: 25 },
        mastery_of_steps: { max: 15 },
        choreography_and_style: { max: 20 },
        costume_and_props: { max: 25 },
        stage_presence: { max: 15 },
    } as const;

    const candidatesQuery = computed(() => getInterpretativeTeams)
    const candidateScoreInputs = useLocalStorage<ScoreFields[]>(props.inputKey, [])

    watchEffect(() => {
        const data = candidatesQuery.value.data || []
        if (data.length) {
            const cachedData = candidateScoreInputs.value
            candidateScoreInputs.value = data.map(d => {
                const cached = cachedData.find(c => c.team_id === d.team_id)
                return cached ?? {
                    team_id: d.team_id,
                    team: CapitalizeLabel(d.team),
                    originality: "",
                    mastery_of_steps: "",
                    choreography_and_style: "",
                    costume_and_props: "",
                    stage_presence: ""
                }
            })
        }
    })

    const clampValues = (candidate: ScoreFields) => {
        const sanitize = (value: string) => {

            let cleaned = value.replace(/[^0-9.]/g, "");
            if (!cleaned) return "";

            const decimalIndex = cleaned.indexOf(".");
            if (decimalIndex !== -1) {
                cleaned =
                    cleaned.substring(0, decimalIndex + 1) +
                    cleaned.substring(decimalIndex + 1).replace(/\./g, "");
            }

            const parts = cleaned.split(".");
            let integerPart = parts[0] || "";
            let decimalPart = parts[1] ? parts[1].slice(0, 2) : "";

            integerPart = integerPart.replace(/[^0-9]/g, "").replace(/^0+/, "");

            decimalPart = decimalPart.replace(/[^0-9]/g, "");

            if (!integerPart && decimalPart) {
                integerPart = "1";
            }

            if (cleaned.startsWith(".")) {
                return decimalPart ? `1.${decimalPart}` : "1.0";
            }
            if (cleaned.endsWith(".") && !decimalPart) {
                return integerPart + ".";
            }

            if (decimalPart) {
                return `${integerPart}.${decimalPart}`;
            }

            return integerPart || "1";
        };

        candidate.originality = sanitize(candidate.originality);
        candidate.mastery_of_steps = sanitize(candidate.mastery_of_steps);
        candidate.choreography_and_style = sanitize(candidate.choreography_and_style);
        candidate.costume_and_props = sanitize(candidate.costume_and_props);
        candidate.stage_presence = sanitize(candidate.stage_presence);


        if (Number(candidate.originality) >= SCORE_CRITERIA.originality.max) {
            candidate.originality = SCORE_CRITERIA.originality.max.toString();
            candidate.originality = candidate.originality.replace(/\.$/, "");
        }
        if (Number(candidate.mastery_of_steps) >= SCORE_CRITERIA.mastery_of_steps.max) {
            candidate.mastery_of_steps = SCORE_CRITERIA.mastery_of_steps.max.toString();
            candidate.mastery_of_steps = candidate.mastery_of_steps.replace(/\.$/, "");
        }
        if (Number(candidate.choreography_and_style) >= SCORE_CRITERIA.choreography_and_style.max) {
            candidate.choreography_and_style = SCORE_CRITERIA.choreography_and_style.max.toString();
            candidate.choreography_and_style = candidate.choreography_and_style.replace(/\.$/, "");
        }
        if (Number(candidate.costume_and_props) >= SCORE_CRITERIA.costume_and_props.max) {
            candidate.costume_and_props = SCORE_CRITERIA.costume_and_props.max.toString();
            candidate.costume_and_props = candidate.costume_and_props.replace(/\.$/, "");
        }
        if (Number(candidate.stage_presence) >= SCORE_CRITERIA.stage_presence.max) {
            candidate.stage_presence = SCORE_CRITERIA.stage_presence.max.toString();
            candidate.stage_presence = candidate.stage_presence.replace(/\.$/, "");
        }

    };

    const getFormattedTeamLabel = (team: Capitalize<CandidateTeamOptions>) => {
        const teamLower = team.toLowerCase();
        return {
            red: "Red Avengers",
            yellow: "Yellow Predators",
            green: "Green Warriors",
            purple: "Purple Gladiators",
            blue: "Blue Raptors",
        }[teamLower];
    };

    const getTeamBadgeClasses = (team: Capitalize<CandidateTeamOptions> | null) => {
        if (team) {
            const teamLabel = getFormattedTeamLabel(team);
            return teamLabel
                ? {
                    "Red Avengers": "bg-red-400 text-white",
                    "Yellow Predators": "bg-yellow-400 text-gray-800",
                    "Green Warriors": "bg-green-400 text-gray-800",
                    "Purple Gladiators": "bg-purple-400 text-white",
                    "Blue Raptors": "bg-blue-400 text-white",
                }[teamLabel]
                : "";
        }
    };

    const validateFields = () => {
        const hasError = candidateScoreInputs.value.some((c) => {
            return !c.originality || !c.mastery_of_steps || !c.choreography_and_style || !c.costume_and_props || !c.stage_presence
        });
        return hasError;
    };

    defineExpose({ validateFields, candidateScoreInputs })
</script>