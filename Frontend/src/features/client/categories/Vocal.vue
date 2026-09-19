<template>
    <feature-base-component :is-loading="useLoading['vocalCandidates:initialFetching']">
        <feature-offline-state v-if="getError['vocalCandidates:fetchOffline'] || offline" />
        <data-loading-state v-else-if="useLoading['vocalCandidates:initialFetching']" />
        <template v-else>
            <feature-header :popup-fn="openSevenRules" :has-icon="true" title="Contestants' Vocal Scores"
                action-fn-name="Submit" action-fn-title="Submit vocal scores for contestants"
                popup-fn-name="View Top 7 Rules" popup-fn-title="View top 7 rules" :action-fn="openConfirmationModal"
                description="Provide vocal performance scores for each vocal contestant." />

            <vocal-score-data-table input-key-submitted="vocal-submitted" :retry-fn="refetchVocalCandidatesFeat"
                ref="vocalScoreDataTable" input-key="vocal-scores"
                :is-loading="useLoading['vocalCandidates:fetchRefresh']"
                :is-error="getError['vocalCandidates:fetchServerError']" />
        </template>
    </feature-base-component>

    <top-seven-rules :is-dark-bg="true" :is-open="isSevenRulesOpen" :close="() => (isSevenRulesOpen = false)" />
    <popup-modal :show="isModalPopupShown" @close="() => (isModalPopupShown = false)" />
    <confirmation-modal title="Submit Vocal Scores for Contestants"
        :is-loading="useLoading['vocalCandidates:createVocalScore']"
        description="Once submitted, these scores will be locked and cannot be modified. Please review all entries carefully before confirming."
        :show="isConfirmationShown" :action-fn="handleCreateVocalScore" :close="() => isConfirmationShown = false" />

</template>
<script lang="ts" setup>
    import FeatureBaseComponent from '../components/reusables/FeatureBaseComponent.vue';
    import { useLoadingStore } from '../../../shared/store/useLoadingState';
    import FeatureOfflineState from '../../shared/components/reusables/FeatureOfflineState.vue';
    import TopSevenRules from '../components/reusables/TopSevenRules.vue';
    import { useGlobalErrorSetter } from '../../../shared/store/useGlobalErrorState';
    import DataLoadingState from '../../shared/components/reusables/DataLoadingState.vue';
    import ConfirmationModal from '../components/reusables/ConfirmationModal.vue';
    import PopupModal from '../components/reusables/PopupModal.vue';
    import FeatureHeader from '../../shared/components/reusables/FeatureHeader.vue';
    import { computed, onMounted, ref } from 'vue';
    import { useNetworkCheck } from '../../../shared/composables/useNetworkStatus';
    import { useVocalStore } from '../store/useVocalStore';
    import VocalScoreDataTable from '../components/vocal/VocalDataTable.vue';

    const { isOnline } = useNetworkCheck()
    const { getError } = useGlobalErrorSetter()
    const { useLoading } = useLoadingStore()

    const { refetchVocalCandidatesFeat, createVocalScore, enableVocal } = useVocalStore()
    const offline = computed(() => !isOnline.value)

    onMounted(() => {
        enableVocal()
    })

    const isSevenRulesOpen = ref(false);
    const openSevenRules = () => {
        isSevenRulesOpen.value = true;
    };
    const vocalScoreDataTable = ref<InstanceType<
        typeof VocalScoreDataTable
    > | null>(null);

    const isModalPopupShown = ref(false);
    const setModalPopupOpen = () => {
        isModalPopupShown.value = true;
    };
    const isConfirmationShown = ref(false);
    const openConfirmationModal = () => {
        if (
            getError["vocalCandidates:fetchOffline"] ||
            getError["vocalCandidates:fetchServerError"] ||
            offline.value
        )
            return;

        const hasMissingFields = vocalScoreDataTable.value?.validateFields();
        if (hasMissingFields) {
            setModalPopupOpen();
            return;
        }
        isConfirmationShown.value = true;
    };


    const handleCreateVocalScore = async () => {
        const scores = vocalScoreDataTable.value?.candidateScoreInputs;
        if (!scores || !scores.length) return;
        const payload = scores.map((s) => ({
            cand_id: Number(s.candidateId),
            voice_tone_quality: Number(s.voice_tone_quality),
            mastery_and_timing: Number(s.mastery_and_timing),
            vocal_expression: Number(s.vocal_expression),
            diction: Number(s.diction),
            stage_presence: Number(s.stage_presence),
            entertainment_value: Number(s.entertainment_value)
        }));

        await createVocalScore(payload);
    }
</script>
