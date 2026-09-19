<template>
    <feature-base-table>
        <template #table>
            <feature-server-state :on-retry="retryFn" :title="`Couldn't load vocal contestants`"
                message="There was an issue retrieving contestants data. Please check your connection and try again."
                v-if="isError" />
            <is-empty-state v-else-if="!candidatesQuery" />
            <table :class="TABLE_STYLES.TB" v-else>
                <thead>
                    <tr>
                        <th :class="TABLE_STYLES.TH">Full Name</th>
                        <th :class="TABLE_STYLES.TH">Team</th>
                        <th :class="TABLE_STYLES.TH">Voice/Tone Quality (30%)</th>
                        <th :class="TABLE_STYLES.TH">Mastery and Timing (25%)</th>
                        <th :class="TABLE_STYLES.TH">Vocal Expression (15%)</th>
                        <th :class="TABLE_STYLES.TH">Diction (10%)</th>
                        <th :class="TABLE_STYLES.TH">Stage Presence (10%)</th>
                        <th :class="TABLE_STYLES.TH">Entertainment Value (10%)</th>
                    </tr>
                </thead>
                <tbody :class="TABLE_STYLES.TBODY">
                    <tr class="hover:bg-gray-50 transition-colors" v-for="c in candidateScoreInputs"
                        :key="c.candidateId!">
                        <td
                            class="px-6 py-3 text-xs md:text-sm text-gray-800 font-medium border-gray-200 break-words min-w-35 max-w-35">
                            {{ FormatFullName(c.candidateName!) }}</td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <span class="px-2 py-1 rounded text-xs font-medium text-nowrap"
                                :class="getTeamBadgeClasses(c.candidateTeam)">
                                {{ getFormattedTeamLabel(c.candidateTeam) }}
                            </span>
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.voice_tone_quality"
                                :max="SCORE_CRITERIA.voice_tone_quality.max" :disabled="hasSubmitted"
                                @input="clampValues(c)" min="0"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.mastery_and_timing"
                                :max="SCORE_CRITERIA.mastery_and_timing.max" min="0" :disabled="hasSubmitted"
                                @input="clampValues(c)"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.vocal_expression" :max="SCORE_CRITERIA.vocal_expression.max"
                                :disabled="hasSubmitted" min="0" @input="clampValues(c)"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.diction" :max="SCORE_CRITERIA.diction.max"
                                :disabled="hasSubmitted" min="0" @input="clampValues(c)"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.stage_presence" :max="SCORE_CRITERIA.stage_presence.max"
                                :disabled="hasSubmitted" min="0" @input="clampValues(c)"
                                class="w-20 px-2 py-1 disabled:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-gray-700 hover:border-primary text-center focus:border-primary focus:outline-none transition-colors focus:ring-primary/20 focus:ring-2" />
                        </td>
                        <td :class="TABLE_STYLES.TD.no_bold">
                            <input type="text" v-model="c.entertainment_value"
                                :max="SCORE_CRITERIA.entertainment_value.max" :disabled="hasSubmitted" min="0"
                                @input="clampValues(c)"
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
    import { useVocalStore } from '../../store/useVocalStore';
    import type { CandidateTeamOptions } from '../../types/talent/types';
    import { CapitalizeLabel, FormatFullName } from '../../../../utils/capitalizeWord';

    const { getVocalCandidates, isSubmitted } = useVocalStore()
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
        candidateId: string | null;
        candidateName: string | null;
        candidateTeam: Capitalize<CandidateTeamOptions>;
        voice_tone_quality: string,
        mastery_and_timing: string,
        vocal_expression: string,
        diction: string,
        stage_presence: string,
        entertainment_value: string
    }

    const SCORE_CRITERIA = {
        voice_tone_quality: { max: 30 },
        mastery_and_timing: { max: 25 },
        vocal_expression: { max: 15 },
        diction: { max: 10 },
        stage_presence: { max: 10 },
        entertainment_value: { max: 10 }
    } as const;

    const candidatesQuery = computed(() => getVocalCandidates)
    const candidateScoreInputs = useLocalStorage<ScoreFields[]>(props.inputKey, [])

    watchEffect(() => {
        const data = candidatesQuery.value.data || []
        if (data.length) {
            const cachedData = candidateScoreInputs.value
            candidateScoreInputs.value = data.map(d => {
                const cached = cachedData.find(c => c.candidateId === d.cand_id)
                return cached ?? {
                    candidateId: d.cand_id,
                    candidateName: d.cand_name,
                    candidateTeam: CapitalizeLabel(d.cand_team),
                    voice_tone_quality: "",
                    mastery_and_timing: "",
                    vocal_expression: "",
                    diction: "",
                    stage_presence: "",
                    entertainment_value: ""
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

        candidate.voice_tone_quality = sanitize(candidate.voice_tone_quality);
        candidate.mastery_and_timing = sanitize(candidate.mastery_and_timing);
        candidate.vocal_expression = sanitize(candidate.vocal_expression);
        candidate.diction = sanitize(candidate.diction);
        candidate.stage_presence = sanitize(candidate.stage_presence);
        candidate.entertainment_value = sanitize(candidate.entertainment_value);


        if (Number(candidate.voice_tone_quality) >= SCORE_CRITERIA.voice_tone_quality.max) {
            candidate.voice_tone_quality = SCORE_CRITERIA.voice_tone_quality.max.toString();
            candidate.voice_tone_quality = candidate.voice_tone_quality.replace(/\.$/, "");
        }

        if (Number(candidate.mastery_and_timing) >= SCORE_CRITERIA.mastery_and_timing.max) {
            candidate.mastery_and_timing = SCORE_CRITERIA.mastery_and_timing.max.toString();
            candidate.mastery_and_timing = candidate.mastery_and_timing.replace(/\.$/, "");
        }
        if (Number(candidate.vocal_expression) >= SCORE_CRITERIA.vocal_expression.max) {
            candidate.vocal_expression = SCORE_CRITERIA.vocal_expression.max.toString();
            candidate.vocal_expression = candidate.vocal_expression.replace(/\.$/, "");
        }
        if (Number(candidate.diction) >= SCORE_CRITERIA.diction.max) {
            candidate.diction = SCORE_CRITERIA.diction.max.toString();
            candidate.diction = candidate.diction.replace(/\.$/, "");
        }
        if (Number(candidate.stage_presence) >= SCORE_CRITERIA.stage_presence.max) {
            candidate.stage_presence = SCORE_CRITERIA.stage_presence.max.toString();
            candidate.stage_presence = candidate.stage_presence.replace(/\.$/, "");
        }
        if (Number(candidate.entertainment_value) >= SCORE_CRITERIA.entertainment_value.max) {
            candidate.entertainment_value = SCORE_CRITERIA.entertainment_value.max.toString();
            candidate.entertainment_value = candidate.entertainment_value.replace(/\.$/, "");
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
            return !c.voice_tone_quality || !c.mastery_and_timing || !c.vocal_expression || !c.diction || !c.stage_presence || !c.entertainment_value
        });
        return hasError;
    };

    defineExpose({ validateFields, candidateScoreInputs })
</script>