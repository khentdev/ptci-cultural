<template>
    <feature-base-component :is-loading="getVocalCandidates.isPending">
        <feature-offline-state v-if="fetchError.offline || offline" />
        <data-loading-state v-else-if="getVocalCandidates.isPending || getMyVocalScores.isPending" />
        <template v-else>
            <div class="relative">
                <inline-fetch-indicator v-show="getVocalCandidates.isFetching" />
                <feature-header :popup-fn="openSevenRules" :has-icon="true" title="Contestants' Vocal Scores"
                    action-fn-name="Submit" action-fn-title="Submit vocal scores for contestants"
                    popup-fn-name="View Judging Rules" popup-fn-title="View judging rules"
                    :action-fn="openConfirmationModal" :should-show-action-button="!hasSubmittedAll"
                    description="Provide vocal performance scores for each vocal contestant." />

                <VocalDataTable :retry-fn="refetchVocalFeat" ref="scoreDataTable" :input-key="SCORE_DRAFT_KEYS.vocal"
                    :is-loading="getVocalCandidates.isFetching" :is-error="fetchError.serverError" />
            </div>
        </template>
    </feature-base-component>

    <top-seven-rules :is-dark-bg="true" :is-open="isSevenRulesOpen" :close="() => (isSevenRulesOpen = false)" />
    <popup-modal :show="isModalPopupShown" @close="() => (isModalPopupShown = false)" />
    <confirmation-modal title="Submit Vocal Scores for Contestants" :is-loading="createVocalScoreMutation.isPending"
        description="Once submitted, these scores will be locked and cannot be modified. Please review all entries carefully before confirming."
        :show="isConfirmationShown" :action-fn="handleCreateVocalScore" :close="() => isConfirmationShown = false" />
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
    import { useVocalStore } from '../store/useVocalStore';
    import VocalDataTable from '../components/vocal/VocalDataTable.vue';

    const { isOnline } = useNetworkCheck()
    const {
        getVocalCandidates,
        getMyVocalScores,
        refetchVocalFeat,
        createVocalScore,
        createVocalScoreMutation,
        enableVocal,
        fetchError,
    } = useVocalStore()

    const offline = computed(() => !isOnline.value)

    onMounted(() => enableVocal())

    /** Every subject already scored by this judge -> nothing left to submit. */
    const hasSubmittedAll = computed(() => {
        const subjects = getVocalCandidates.data ?? []
        const scored = getMyVocalScores.data ?? []
        return subjects.length > 0 && scored.length >= subjects.length
    })

    const isSevenRulesOpen = ref(false);
    const openSevenRules = () => (isSevenRulesOpen.value = true);

    const scoreDataTable = ref<InstanceType<typeof VocalDataTable> | null>(null);

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

    const handleCreateVocalScore = async () => {
        const rows = scoreDataTable.value?.scoreRows;
        const isRowLocked = scoreDataTable.value?.isRowLocked;
        if (!rows || !rows.length) return;

        // Never resend a row the server already holds.
        const payload = rows
            .filter((row) => !isRowLocked?.(row.subjectId))
            .map((row) => ({
            cand_id: Number(row.subjectId),
            voice_tone_quality: Number(row.voice_tone_quality),
            mastery_and_timing: Number(row.mastery_and_timing),
            vocal_expression: Number(row.vocal_expression),
            diction: Number(row.diction),
            stage_presence: Number(row.stage_presence),
            entertainment_value: Number(row.entertainment_value),
        }));

        if (!payload.length) return;

        await createVocalScore(payload);
        isConfirmationShown.value = false;
    }
</script>
