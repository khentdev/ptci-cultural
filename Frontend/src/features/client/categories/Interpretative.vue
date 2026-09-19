<template>
    <feature-base-component :is-loading="getInterpretativeTeams.isPending">
        <feature-offline-state v-if="fetchError.offline || offline" />
        <data-loading-state v-else-if="getInterpretativeTeams.isPending || getMyInterpretativeScores.isPending" />
        <template v-else>
            <div class="relative">
                <inline-fetch-indicator v-show="getInterpretativeTeams.isFetching" />
                <feature-header :popup-fn="openSevenRules" :has-icon="true" title="Teams' Interpretative Dance Scores"
                    action-fn-name="Submit" action-fn-title="Submit interpretative dance scores for teams"
                    popup-fn-name="View Judging Rules" popup-fn-title="View judging rules"
                    :action-fn="openConfirmationModal" :should-show-action-button="!hasSubmittedAll"
                    description="Provide interpretative dance performance scores for each team." />

                <InterpretativeDataTable :retry-fn="refetchInterpretativeFeat" ref="scoreDataTable" input-key="interpretative-scores"
                    :is-loading="getInterpretativeTeams.isFetching" :is-error="fetchError.serverError" />
            </div>
        </template>
    </feature-base-component>

    <top-seven-rules :is-dark-bg="true" :is-open="isSevenRulesOpen" :close="() => (isSevenRulesOpen = false)" />
    <popup-modal :show="isModalPopupShown" @close="() => (isModalPopupShown = false)" />
    <confirmation-modal title="Submit Interpretative Dance Scores for Teams" :is-loading="createInterpretativeScoreMutation.isPending"
        description="Once submitted, these scores will be locked and cannot be modified. Please review all entries carefully before confirming."
        :show="isConfirmationShown" :action-fn="handleCreateInterpretativeScore" :close="() => isConfirmationShown = false" />
</template>

<script lang="ts" setup>
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
    import { useInterpretativeStore } from '../store/useInterpretativeStore';
    import InterpretativeDataTable from '../components/interpretative/InterpretativeDataTable.vue';

    const { isOnline } = useNetworkCheck()
    const {
        getInterpretativeTeams,
        getMyInterpretativeScores,
        refetchInterpretativeFeat,
        createInterpretativeScore,
        createInterpretativeScoreMutation,
        enableInterpretative,
        fetchError,
    } = useInterpretativeStore()

    const offline = computed(() => !isOnline.value)

    onMounted(() => enableInterpretative())

    /** Every subject already scored by this judge -> nothing left to submit. */
    const hasSubmittedAll = computed(() => {
        const subjects = getInterpretativeTeams.data ?? []
        const scored = getMyInterpretativeScores.data ?? []
        return subjects.length > 0 && scored.length >= subjects.length
    })

    const isSevenRulesOpen = ref(false);
    const openSevenRules = () => (isSevenRulesOpen.value = true);

    const scoreDataTable = ref<InstanceType<typeof InterpretativeDataTable> | null>(null);

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

    const handleCreateInterpretativeScore = async () => {
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

        await createInterpretativeScore(payload);
        isConfirmationShown.value = false;
    }
</script>
