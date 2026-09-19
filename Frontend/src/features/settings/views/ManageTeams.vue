<template>
  <section class="min-h-screen p-3 overflow-x-auto flex flex-col items-center justify-center">
    <div class="w-full max-w-full mt-12 rounded-2xl" :class="{ 'border border-gray-200': !getTeams.isPending }">
      <div class="overflow-hidden rounded-2xl">
        <FeatureOfflineState v-if="fetchError.offline || isOffline" />
        <DataLoadingState v-else-if="getTeams.isPending" />
        <template v-else>
          <div class="relative">
            <InlineFetchIndicator v-show="getTeams.isFetching" />
            <FeatureHeader :has-icon="true" :action-fn="toggleForm" action-fn-name="Add Team" title="Manage Teams"
              action-fn-title="Add new team"
              description="Teams are scored directly in Interpretative and Modern Dance, and every contestant belongs to one." />
            <TeamDataTable />
          </div>
        </template>
      </div>
    </div>
  </section>
  <FeatureBaseForm :show-form="formOpen" title="Add Team" description="Give the team a name">
    <TeamForm mode="create" :on-submit="addTeam" :is-loading="addTeamMutation.isPending"
      :on-close="() => (formOpen = false)" />
  </FeatureBaseForm>
</template>

<script setup lang="ts">
import InlineFetchIndicator from "../../shared/components/reusables/InlineFetchIndicator.vue";
import FeatureHeader from "../../shared/components/reusables/FeatureHeader.vue";
import DataLoadingState from "../../shared/components/reusables/DataLoadingState.vue";
import TeamDataTable from "../components/teams/TeamDataTable.vue";
import FeatureBaseForm from "../../shared/components/reusables/FeatureBaseForm.vue";
import FeatureOfflineState from "../../shared/components/reusables/FeatureOfflineState.vue";
import TeamForm from "../components/teams/TeamForm.vue";
import { useNetworkCheck } from "../../../shared/composables/useNetworkStatus";
import { computed, ref } from "vue";
import { useTeamsStore } from "../store/teamStore";

const { isOnline } = useNetworkCheck();
const { addTeam, addTeamMutation, getTeams, fetchError } = useTeamsStore();

const isOffline = computed(() => !isOnline.value);

const formOpen = ref(false);
const toggleForm = () => (formOpen.value = !formOpen.value);
</script>
