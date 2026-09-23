<template>
  <section class="min-h-screen p-3 overflow-x-auto flex flex-col items-center justify-center">
    <div class="w-full max-w-full mt-12 rounded-2xl" :class="getContestants.isPending ? '' : SURFACE_STYLES.GLASS_CARD">
      <div class="overflow-hidden rounded-2xl">
        <FeatureOfflineState v-if="fetchError.offline || isOffline" />
        <DataLoadingState v-else-if="getContestants.isPending" />
        <template v-else>
          <div class="relative">
            <InlineFetchIndicator v-show="getContestants.isFetching" />
            <FeatureHeader :has-icon="true" :action-fn="toggleForm" action-fn-name="Add Contestant"
              title="Manage Contestants" action-fn-title="Add new contestant"
              description="View and manage the Vocal Solo contestants" />
            <ContestantDataTable />
          </div>
        </template>
      </div>
    </div>
  </section>
  <FeatureBaseForm :show-form="formOpen" title="Add Contestant" description="Provide the contestant's name and team">
    <ContestantForm mode="create" :on-submit="addContestant" :is-loading="addContestantMutation.isPending"
      :on-close="() => (formOpen = false)" />
  </FeatureBaseForm>
</template>

<script setup lang="ts">
import { SURFACE_STYLES } from "../../shared/constants/surfaceStyles";
import InlineFetchIndicator from "../../shared/components/reusables/InlineFetchIndicator.vue";
import FeatureHeader from "../../shared/components/reusables/FeatureHeader.vue";
import DataLoadingState from "../../shared/components/reusables/DataLoadingState.vue";
import ContestantDataTable from "../components/contestants/ContestantDataTable.vue";
import FeatureBaseForm from "../../shared/components/reusables/FeatureBaseForm.vue";
import FeatureOfflineState from "../../shared/components/reusables/FeatureOfflineState.vue";
import ContestantForm from "../components/contestants/ContestantForm.vue";
import { useNetworkCheck } from "../../../shared/composables/useNetworkStatus";
import { computed, ref } from "vue";
import { useContestantsStore } from "../store/contestantStore";

const { isOnline } = useNetworkCheck();
const { addContestant, addContestantMutation, getContestants, fetchError } = useContestantsStore();

const isOffline = computed(() => !isOnline.value);

const formOpen = ref(false);
const toggleForm = () => (formOpen.value = !formOpen.value);
</script>
