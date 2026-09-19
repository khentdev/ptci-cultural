<template>
    <feature-base-component :is-loading="useLoading['interpretativeTeams:initialFetching']">
        <feature-offline-state v-if="getError['interpretativeTeams:fetchOffline'] || offline" />
        <data-loading-state v-else-if="useLoading['interpretativeTeams:initialFetching']" />
        <template v-else>
            <feature-header :popup-fn="openSevenRules" :has-icon="true" title="Interpretative Contestants' Scores"
                action-fn-name="Submit" action-fn-title="Submit interpretative scores for teams"
                popup-fn-name="View Top 7 Rules" popup-fn-title="View top 7 rules" :action-fn="openConfirmationModal"
                description="Provide performance scores for each interpretative contestants based on their presentation and creativity." />

            <interpretative-score-data-table input-key-submitted="interpretative-submitted"
                :retry-fn="refetchInterpretativeTeamsFeat" ref="interpretativeScoreDataTable"
                input-key="interpretative-scores" :is-loading="useLoading['interpretativeTeams:fetchRefresh']"
                :is-error="getError['interpretativeTeams:fetchServerError']" />
        </template>
    </feature-base-component>

    <top-seven-rules :is-dark-bg="true" :is-open="isSevenRulesOpen" :close="() => (isSevenRulesOpen = false)" />
    <popup-modal :show="isModalPopupShown" @close="() => (isModalPopupShown = false)" />
    <confirmation-modal title="Submit Interpretative Scores for Contestants"
        :is-loading="useLoading['interpretativeTeams:createInterpretativeScore']"
        description="Once submitted, these scores will be locked and cannot be modified. Please review all entries carefully before confirming."
        :show="isConfirmationShown" :action-fn="handleCreateInterpretativeScore"
        :close="() => isConfirmationShown = false" />

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
    import { useInterpretativeStore } from '../store/useInterpretativeStore';
    import InterpretativeScoreDataTable from '../components/interpretative/InterpretativeDataTable.vue';

    const { isOnline } = useNetworkCheck()
    const { getError } = useGlobalErrorSetter()
    const { useLoading } = useLoadingStore()

    const { refetchInterpretativeTeamsFeat, createInterpretativeScore, enableInterpretative } = useInterpretativeStore()
    const offline = computed(() => !isOnline.value)

    onMounted(() => {
        enableInterpretative()
    })

    const isSevenRulesOpen = ref(false);
    const openSevenRules = () => {
        isSevenRulesOpen.value = true;
    };
    const interpretativeScoreDataTable = ref<InstanceType<
        typeof InterpretativeScoreDataTable
    > | null>(null);

    const isModalPopupShown = ref(false);
    const setModalPopupOpen = () => {
        isModalPopupShown.value = true;
    };
    const isConfirmationShown = ref(false);
    const openConfirmationModal = () => {
        if (
            getError["interpretativeTeams:fetchOffline"] ||
            getError["interpretativeTeams:fetchServerError"] ||
            offline.value
        )
            return;

        const hasMissingFields = interpretativeScoreDataTable.value?.validateFields();
        if (hasMissingFields) {
            setModalPopupOpen();
            return;
        }
        isConfirmationShown.value = true;
    };

    const handleCreateInterpretativeScore = async () => {
        const scores = interpretativeScoreDataTable.value?.candidateScoreInputs;
        if (!scores || !scores.length) return;
        const payload = scores.map((s) => ({
            team_id: Number(s.team_id),
            originality: Number(s.originality),
            mastery_of_steps: Number(s.mastery_of_steps),
            choreography_and_style: Number(s.choreography_and_style),
            costume_and_props: Number(s.costume_and_props),
            stage_presence: Number(s.stage_presence)
        }));

        await createInterpretativeScore(payload);
    }
</script>
