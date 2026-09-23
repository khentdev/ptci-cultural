<template>
    <feature-base-component :is-loading="getCulturalTeams.isPending">
        <feature-offline-state v-if="fetchError.offline || offline" />
        <data-loading-state v-else-if="getCulturalTeams.isPending || getMyCulturalScores.isPending" />
        <template v-else>
            <div class="relative">
                <inline-fetch-indicator v-show="getCulturalTeams.isFetching" />
                <feature-header :popup-fn="openSevenRules" :has-icon="true" title="Teams' Cultural Dance Scores"
                    action-fn-name="Submit" action-fn-title="Submit cultural dance scores for teams"
                    popup-fn-name="View Judging Rules" popup-fn-title="View judging rules"
                    :action-fn="openConfirmationModal" :should-show-action-button="!hasSubmittedAll"
                    description="Provide cultural dance performance scores for each team." />

                <CulturalDanceDataTable :retry-fn="refetchCulturalFeat" ref="scoreDataTable" :input-key="SCORE_DRAFT_KEYS.cultural"
                    :is-loading="getCulturalTeams.isFetching" :is-error="fetchError.serverError" />
            </div>
        </template>
    </feature-base-component>

    <top-seven-rules :is-dark-bg="true" :is-open="isSevenRulesOpen" :close="() => (isSevenRulesOpen = false)" />
    <popup-modal :show="isModalPopupShown" @close="() => (isModalPopupShown = false)" />
    <confirmation-modal title="Submit Cultural Dance Scores for Teams" :is-loading="createCulturalScoreMutation.isPending"
        description="Once submitted, these scores will be locked and cannot be modified. Please review all entries carefully before confirming."
        :show="isConfirmationShown" :action-fn="handleCreateCulturalScore" :close="() => isConfirmationShown = false" />
</template>

<script lang="ts" setup>
    import { SCORE_DRAFT_KEYS } from "../composables/useScoreDrafts";
    import { computed, onMounted, ref } from 'vue';
    import FeatureBaseComponent from '../components/reusables/FeatureBaseComponent.vue';
    import FeatureOfflineState from '../../shared/components/reusables/FeatureOfflineState.vue';
    import DataLoadingState from '../../shared/components/reusables/DataLoadingState.vue';
    import InlineFetchIndicator from '../../shared/components/reusables/InlineFetchIndicator.vue';
    import TopSevenRules from '../components/reusables/TopSevenRules.vue';
    import ConfirmationModal from '../components/reusables/ConfirmationModal.vue';
    import PopupModal from '../components/reusables/PopupModal.vue';
    import FeatureHeader from '../../shared/components/reusables/FeatureHeader.vue';
    import { useNetworkCheck } from '../../../shared/composables/useNetworkStatus';
    import { useCulturalStore } from '../store/useCulturalStore';
    import CulturalDanceDataTable from '../components/cultural/CulturalDanceDataTable.vue';

    const { isOnline } = useNetworkCheck()
    const {
        getCulturalTeams,
        getMyCulturalScores,
        refetchCulturalFeat,
        createCulturalScore,
        createCulturalScoreMutation,
        enableCultural,
        fetchError,
    } = useCulturalStore()

    const offline = computed(() => !isOnline.value)

    onMounted(() => enableCultural())

    /** Every subject already scored by this judge -> nothing left to submit. */
    const hasSubmittedAll = computed(() => {
        const subjects = getCulturalTeams.data ?? []
        const scored = getMyCulturalScores.data ?? []
        return subjects.length > 0 && scored.length >= subjects.length
    })

    const isSevenRulesOpen = ref(false);
    const openSevenRules = () => (isSevenRulesOpen.value = true);

    const scoreDataTable = ref<InstanceType<typeof CulturalDanceDataTable> | null>(null);

    const isModalPopupShown = ref(false);
    const isConfirmationShown = ref(false);

    const openConfirmationModal = () => {
        if (fetchError.offline || fetchError.serverError || offline.value) return;

        const hasMissingFields = scoreDataTable.value?.validateFields();
        if (hasMissingFields) {
            isModalPopupShown.value = true;
            return;
        }
        isConfirmationShown.value = true;
    };

    const handleCreateCulturalScore = async () => {
        const rows = scoreDataTable.value?.scoreRows;
        const isRowLocked = scoreDataTable.value?.isRowLocked;
        if (!rows || !rows.length) return;

        // Never resend a row the server already holds.
        const payload = rows
            .filter((row) => !isRowLocked?.(row.subjectId))
            .map((row) => ({
            team_id: Number(row.subjectId),
            originality: Number(row.originality),
            mastery_of_steps: Number(row.mastery_of_steps),
            choreography_and_style: Number(row.choreography_and_style),
            costume_and_props: Number(row.costume_and_props),
            stage_presence: Number(row.stage_presence),
        }));

        if (!payload.length) return;

        await createCulturalScore(payload);
        isConfirmationShown.value = false;
    }
</script>
