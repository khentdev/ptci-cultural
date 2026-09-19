<template>
  <FeatureBaseTable>
    <template #table>
      <FeatureServerState v-if="fetchError.serverError" :on-retry="refetchTeams" title="Couldn't load teams"
        message="There was an issue retrieving the teams. Please check your connection and try again." />
      <IsEmptyState v-else-if="!getTeams.data?.data?.length" />
      <table v-else :class="TABLE_STYLES.TB">
        <thead :class="TABLE_STYLES.THEADROW">
          <tr>
            <th :class="TABLE_STYLES.TH">Team</th>
            <th :class="TABLE_STYLES.TH">Contestants</th>
            <th :class="TABLE_STYLES.TH">Time Created</th>
            <th :class="TABLE_STYLES.TH">Actions</th>
          </tr>
        </thead>

        <tbody :class="TABLE_STYLES.TBODY">
          <tr v-for="t in getTeams.data?.data" :key="t.team_id" class="hover:bg-gray-50 transition-colors">
            <td :class="TABLE_STYLES.TD.no_bold">
              <span class="px-2 py-1 rounded text-xs font-medium" :class="getTeamBadgeClasses(t.team)">
                {{ t.team }}
              </span>
            </td>
            <td :class="TABLE_STYLES.TD.no_bold">
              <span v-if="contestantCount(t.team_id)">{{ contestantCount(t.team_id) }}</span>
              <span v-else class="text-gray-400">none</span>
            </td>
            <td :class="TABLE_STYLES.TD.no_bold">{{ formatDateAndTime(t.created_at) }}</td>
            <td :class="TABLE_STYLES.TD.no_bold">
              <ActionsDropdown :items="rowActions(t)" />
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </FeatureBaseTable>

  <FeatureBaseForm title="Update Team" description="Rename this team" :show-form="showForm">
    <TeamForm :team-to-update="teamToUpdate" :on-submit="updateTeam" :is-loading="updateTeamMutation.isPending"
      mode="update" :on-close="() => (showForm = false)" />
  </FeatureBaseForm>

  <DeleteConfirmationModal :datas="dataToDelete" title="Delete Team"
    description="Are you sure you want to delete this team? Teams with contestants or submitted scores cannot be deleted."
    number-label="Contestants" name-label="Team" :on-close="() => (showConfirmation = false)" :show="showConfirmation"
    :on-delete="deleteTeam" />
</template>

<script setup lang="ts">
  import { computed, ref } from "vue";
  import { SquarePen, Trash } from "lucide-vue-next";
  import { useTeamsStore } from "../../store/teamStore";
  import { useContestantsStore } from "../../store/contestantStore";
  import type { TeamData, UpdateTeamParams } from "../../types/teams";
  import { getTeamBadgeClasses } from "../../../client/types/shared/types";
  import FeatureBaseTable from "../../../shared/components/reusables/FeatureBaseTable.vue";
  import FeatureBaseForm from "../../../shared/components/reusables/FeatureBaseForm.vue";
  import IsEmptyState from "../../../shared/components/reusables/IsEmptyState.vue";
  import DeleteConfirmationModal from "../../../shared/components/reusables/DeleteConfirmationModal.vue";
  import FeatureServerState from "../../../shared/components/reusables/FeatureServerState.vue";
  import ActionsDropdown from "../../../shared/components/reusables/ActionsDropdown.vue";
  import TeamForm from "./TeamForm.vue";
  import { TABLE_STYLES } from "../../../shared/constants/tableStyles";
  import type { ActionsDropdownItem } from "../../../shared/types/actionsDropdown";

  const { getTeams, updateTeam, updateTeamMutation, deleteTeam, refetchTeams, fetchError } = useTeamsStore();
  const { getContestants } = useContestantsStore();

  /**
   * Derived client-side from the contestants already in cache — it tells the admin
   * up front which teams the API will refuse to delete.
   */
  const countsByTeam = computed(() => {
    const counts = new Map<string, number>();
    for (const c of getContestants.data?.data ?? []) {
      counts.set(c.team_id, (counts.get(c.team_id) ?? 0) + 1);
    }
    return counts;
  });
  const contestantCount = (teamId: string) => countsByTeam.value.get(teamId) ?? 0;

  const formatDateAndTime = (date: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
  };

  const showForm = ref(false);
  const teamToUpdate = ref<UpdateTeamParams>();
  const toggleForm = (data: UpdateTeamParams) => {
    teamToUpdate.value = data;
    showForm.value = true;
  };

  type DataToDelete = { id: string; number: string; name: string };
  const showConfirmation = ref(false);
  const dataToDelete = ref<DataToDelete | null>(null);
  const toggleConfirmationModal = (data: DataToDelete) => {
    dataToDelete.value = data;
    showConfirmation.value = true;
  };

  const rowActions = (t: TeamData): ActionsDropdownItem[] => [
    {
      label: "Rename team",
      icon: SquarePen,
      onClick: () => toggleForm({ team_id: t.team_id, team: t.team }),
    },
    {
      label: "Delete team",
      icon: Trash,
      danger: true,
      disabled: contestantCount(t.team_id) > 0,
      title:
        contestantCount(t.team_id) > 0
          ? "This team still has contestants. Reassign or remove them first."
          : undefined,
      onClick: () =>
        toggleConfirmationModal({
          id: t.team_id,
          number: String(contestantCount(t.team_id)),
          name: t.team,
        }),
    },
  ];
</script>
