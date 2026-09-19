<template>
  <FeatureBaseTable>
    <template #table>
      <FeatureServerState v-if="fetchError.serverError" :on-retry="refetchContestants"
        title="Couldn't load contestants"
        message="There was an issue retrieving contestant data. Please check your connection and try again." />
      <IsEmptyState v-else-if="!getContestants.data?.data?.length" />
      <table v-else :class="TABLE_STYLES.TB">
        <thead :class="TABLE_STYLES.THEADROW">
          <tr>
            <th :class="TABLE_STYLES.TH">No.</th>
            <th :class="TABLE_STYLES.TH">Contestant Name</th>
            <th :class="TABLE_STYLES.TH">Team</th>
            <th :class="TABLE_STYLES.TH">Gender</th>
            <th :class="TABLE_STYLES.TH">Time Created</th>
            <th :class="TABLE_STYLES.TH">Actions</th>
          </tr>
        </thead>

        <tbody :class="TABLE_STYLES.TBODY">
          <tr v-for="c in getContestants.data?.data" :key="`${c.cand_team}-${c.cand_id}`"
            class="hover:bg-gray-50 transition-colors">
            <td :class="TABLE_STYLES.TD.bold">{{ c.cand_number }}</td>
            <td :class="TABLE_STYLES.TD.bold">{{ FormatFullName(c.cand_name) }}</td>
            <td :class="TABLE_STYLES.TD.no_bold">
              <span class="px-2 py-1 rounded text-xs font-medium" :class="getTeamBadgeClasses(c.cand_team)">
                {{ getFormattedTeamLabel(c.cand_team) }}
              </span>
            </td>
            <td :class="TABLE_STYLES.TD.no_bold">
              <span class="px-2 py-1 rounded text-xs font-medium" :class="getGenderBadgeClasses(c.cand_gender)">
                {{ CapitalizeLabel(c.cand_gender) }}
              </span>
            </td>
            <td :class="TABLE_STYLES.TD.no_bold">{{ formatDateAndTime(c.created_at) }}</td>
            <td :class="TABLE_STYLES.TD.no_bold">
              <ActionsDropdown :items="rowActions(c)" />
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </FeatureBaseTable>

  <FeatureBaseForm title="Update Contestant" description="Update the contestant's name or team" :show-form="showForm">
    <ContestantForm :contestant-to-update="contestantToUpdate" :on-submit="updateContestant"
      :is-loading="updateContestantMutation.isPending" mode="update" :on-close="() => (showForm = false)" />
  </FeatureBaseForm>

  <DeleteConfirmationModal :datas="dataToDelete" title="Delete Contestant"
    description="Are you sure you want to delete this contestant? Their submitted scores are not removed."
    number-label="Contestant Number" name-label="Contestant" :on-close="() => (showConfirmation = false)" :show="showConfirmation"
    :on-delete="deleteContestant" />
</template>

<script setup lang="ts">
  import { SquarePen, Trash } from "lucide-vue-next";
  import { ref } from "vue";
  import { useContestantsStore } from "../../store/contestantStore";
  import type { ContestantData, UpdateContestantParams } from "../../types/contestants";
  import { getFormattedTeamLabel, getTeamBadgeClasses } from "../../../client/types/shared/types";
  import FeatureBaseTable from "../../../shared/components/reusables/FeatureBaseTable.vue";
  import FeatureBaseForm from "../../../shared/components/reusables/FeatureBaseForm.vue";
  import IsEmptyState from "../../../shared/components/reusables/IsEmptyState.vue";
  import DeleteConfirmationModal from "../../../shared/components/reusables/DeleteConfirmationModal.vue";
  import FeatureServerState from "../../../shared/components/reusables/FeatureServerState.vue";
  import ActionsDropdown from "../../../shared/components/reusables/ActionsDropdown.vue";
  import ContestantForm from "./ContestantForm.vue";
  import { TABLE_STYLES } from "../../../shared/constants/tableStyles";
  import { CapitalizeLabel, FormatFullName } from "../../../../utils/capitalizeWord";
  import type { ActionsDropdownItem } from "../../../shared/types/actionsDropdown";

  const {
    getContestants,
    updateContestant,
    updateContestantMutation,
    deleteContestant,
    refetchContestants,
    fetchError,
  } = useContestantsStore();

  const getGenderBadgeClasses = (gender: string) =>
    ({
      male: "bg-blue-100 text-blue-800",
      female: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-700",
    })[gender.toLowerCase()] ?? "bg-gray-100 text-gray-700";

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
  const contestantToUpdate = ref<UpdateContestantParams>();
  const toggleForm = (data: UpdateContestantParams) => {
    contestantToUpdate.value = data;
    showForm.value = true;
  };

  type DataToDelete = { id: string; number: string; name: string };
  const showConfirmation = ref(false);
  const dataToDelete = ref<DataToDelete | null>(null);
  const toggleConfirmationModal = (data: DataToDelete) => {
    dataToDelete.value = data;
    showConfirmation.value = true;
  };

  const rowActions = (c: ContestantData): ActionsDropdownItem[] => [
    {
      label: "Edit contestant",
      icon: SquarePen,
      onClick: () =>
        toggleForm({
          cand_id: c.cand_id,
          cand_number: c.cand_number,
          cand_name: c.cand_name,
          team_id: c.team_id,
          cand_gender: c.cand_gender,
        }),
    },
    {
      label: "Delete contestant",
      icon: Trash,
      danger: true,
      onClick: () =>
        toggleConfirmationModal({
          id: c.cand_id,
          number: c.cand_number,
          name: c.cand_name,
        }),
    },
  ];
</script>
