<template>
    <feature-base-component :is-loading="useLoading['modernTeams:initialFetching']">
        <feature-offline-state v-if="getError['modernTeams:fetchOffline'] || offline" />
        <data-loading-state v-else-if="useLoading['modernTeams:initialFetching']" />
        <template v-else>
            <feature-header :popup-fn="openSevenRules" :has-icon="true" title="Modern Contestants' Scores"
                action-fn-name="Submit" action-fn-title="Submit modern scores for teams"
                popup-fn-name="View Top 7 Rules" popup-fn-title="View top 7 rules" :action-fn="openConfirmationModal"
                description="Provide performance scores for each modern contestants based on their presentation and creativity." />

            <modern-score-data-table input-key-submitted="modern-dance-submitted" :retry-fn="refetchModernTeamsFeat"
                ref="modernScoreDataTable" input-key="modern-dance-scores"
                :is-loading="useLoading['modernTeams:fetchRefresh']"
                :is-error="getError['modernTeams:fetchServerError']" />
        </template>
    </feature-base-component>

    <top-seven-rules :is-dark-bg="true" :is-open="isSevenRulesOpen" :close="() => (isSevenRulesOpen = false)" />
    <popup-modal :show="isModalPopupShown" @close="() => (isModalPopupShown = false)" />
    <confirmation-modal title="Submit Modern Scores for Contestants"
        :is-loading="useLoading['modernTeams:createModernScore']"
        description="Once submitted, these scores will be locked and cannot be modified. Please review all entries carefully before confirming."
        :show="isConfirmationShown" :action-fn="handleCreateModernScore" :close="() => isConfirmationShown = false" />

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
    import { useModernStore } from '../store/useModernDanceStore';
    import ModernScoreDataTable from '../components/modern/ModernDataTable.vue';

    const { isOnline } = useNetworkCheck()
    const { getError } = useGlobalErrorSetter()
    const { useLoading } = useLoadingStore()

    const { refetchModernTeamsFeat, createModernScore, enableModern } = useModernStore()
    const offline = computed(() => !isOnline.value)

    onMounted(() => {
        enableModern()
    })

    const isSevenRulesOpen = ref(false);
    const openSevenRules = () => {
        isSevenRulesOpen.value = true;
    };
    const modernScoreDataTable = ref<InstanceType<
        typeof ModernScoreDataTable
    > | null>(null);

    const isModalPopupShown = ref(false);
    const setModalPopupOpen = () => {
        isModalPopupShown.value = true;
    };
    const isConfirmationShown = ref(false);
    const openConfirmationModal = () => {
        if (
            getError["modernTeams:fetchOffline"] ||
            getError["modernTeams:fetchServerError"] ||
            offline.value
        )
            return;

        const hasMissingFields = modernScoreDataTable.value?.validateFields();
        if (hasMissingFields) {
            setModalPopupOpen();
            return;
        }
        isConfirmationShown.value = true;
    };

    const handleCreateModernScore = async () => {
        const scores = modernScoreDataTable.value?.candidateScoreInputs;
        if (!scores || !scores.length) return;
        const payload = scores.map((s) => ({
            team_id: Number(s.team_id),
            cand_id: Number(s.cand_id),
            audience_impact: Number(s.audience_impact),
            mastery_of_steps: Number(s.mastery_of_steps),
            choreography_and_style: Number(s.choreography_and_style),
            costume_and_props: Number(s.costume_and_props),
            stage_presence: Number(s.stage_presence)
        }));

        await createModernScore(payload);
    }
</script>
