<template>
    <feature-base-component :is-loading="getModernTeams.isPending">
        <feature-offline-state v-if="fetchError.offline || offline" />
        <data-loading-state v-else-if="getModernTeams.isPending || getMyModernScores.isPending" />
        <template v-else>
            <div class="relative">
                <inline-fetch-indicator v-show="getModernTeams.isFetching" />
                <feature-header :popup-fn="openSevenRules" :has-icon="true" title="Teams' Modern Dance Scores"
                    action-fn-name="Submit" action-fn-title="Submit modern dance scores for teams"
                    popup-fn-name="View Judging Rules" popup-fn-title="View judging rules"
                    :action-fn="openConfirmationModal" :should-show-action-button="!hasSubmittedAll"
                    description="Provide modern dance performance scores for each team." />

                <ModernDataTable :retry-fn="refetchModernFeat" ref="scoreDataTable" :input-key="SCORE_DRAFT_KEYS.modern"
                    :is-loading="getModernTeams.isFetching" :is-error="fetchError.serverError" />
            </div>
        </template>
    </feature-base-component>

    <top-seven-rules :is-dark-bg="true" :is-open="isSevenRulesOpen" :close="() => (isSevenRulesOpen = false)" />
    <popup-modal :show="isModalPopupShown" @close="() => (isModalPopupShown = false)" />
    <confirmation-modal title="Submit Modern Dance Scores for Teams" :is-loading="createModernScoreMutation.isPending"
        description="Once submitted, these scores will be locked and cannot be modified. Please review all entries carefully before confirming."
        :show="isConfirmationShown" :action-fn="handleCreateModernScore" :close="() => isConfirmationShown = false" />
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
    import { useModernDanceStore } from '../store/useModernDanceStore';
    import ModernDataTable from '../components/modern/ModernDataTable.vue';

    const { isOnline } = useNetworkCheck()
    const {
        getModernTeams,
        getMyModernScores,
        refetchModernFeat,
        createModernScore,
        createModernScoreMutation,
        enableModern,
        fetchError,
    } = useModernDanceStore()

    const offline = computed(() => !isOnline.value)

    onMounted(() => enableModern())

    /** Every subject already scored by this judge -> nothing left to submit. */
    const hasSubmittedAll = computed(() => {
        const subjects = getModernTeams.data ?? []
        const scored = getMyModernScores.data ?? []
        return subjects.length > 0 && scored.length >= subjects.length
    })

    const isSevenRulesOpen = ref(false);
    const openSevenRules = () => (isSevenRulesOpen.value = true);

    const scoreDataTable = ref<InstanceType<typeof ModernDataTable> | null>(null);

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

    const handleCreateModernScore = async () => {
        const rows = scoreDataTable.value?.scoreRows;
        const isRowLocked = scoreDataTable.value?.isRowLocked;
        if (!rows || !rows.length) return;

        // Never resend a row the server already holds.
        const payload = rows
            .filter((row) => !isRowLocked?.(row.subjectId))
            .map((row) => ({
            team_id: Number(row.subjectId),
            mastery_of_steps: Number(row.mastery_of_steps),
            choreography_and_style: Number(row.choreography_and_style),
            costume_and_props: Number(row.costume_and_props),
            stage_presence: Number(row.stage_presence),
            audience_impact: Number(row.audience_impact),
        }));

        if (!payload.length) return;

        await createModernScore(payload);
        isConfirmationShown.value = false;
    }
</script>
