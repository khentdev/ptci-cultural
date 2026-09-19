<template>
  <form class="grid grid-cols-2 gap-2 md:gap-5" @submit.prevent="handleSubmit">
    <div class="col-span-2">
      <label for="teamName" class="block text-sm font-medium text-gray-700">Team Name</label>
      <input v-model="teamName" id="teamName" type="text" placeholder="e.g. Red Avengers"
        :class="FORM_FIELDS.INPUT_FIELD" />
      <p class="mt-1 text-xs text-gray-500">
        Starting the name with a colour (red, yellow, green, purple, blue) gives the team a matching badge.
      </p>
    </div>

    <p v-if="teamFormErrors.general" class="col-span-2 text-sm text-red-500 flex items-center gap-3 mt-1">
      <TriangleAlert class="size-4 shrink-0" />
      {{ teamFormErrors.general }}
    </p>

    <div class="flex justify-between items-center gap-5 col-span-2 mt-3">
      <button @click="onClose" type="button" :class="ACTION_STYLES.CANCELBTN">Cancel</button>
      <button type="submit" :disabled="isLoading" :class="ACTION_STYLES.PRIMARYBTN">
        {{ isLoading ? "Submitting..." : "Submit" }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { TriangleAlert } from "lucide-vue-next";
import { useTeamsStore } from "../../store/teamStore";
import { ACTION_STYLES, FORM_FIELDS } from "../../../shared/constants/formStyles";
import type { CreateTeamParams, UpdateTeamParams } from "../../types/teams";

const { teamFormErrors, clearFormErrors } = useTeamsStore();
onBeforeUnmount(() => clearFormErrors());

const props = defineProps<{
  mode: "create" | "update";
  onClose: () => void;
  isLoading?: boolean;
  onSubmit: (data: any) => Promise<UpdateTeamParams | CreateTeamParams | any>;
  teamToUpdate?: UpdateTeamParams | null;
}>();

const teamName = ref("");

watch(
  [() => props.teamToUpdate, () => props.mode],
  ([hasData, mode]) => {
    if (hasData && mode === "update") teamName.value = hasData.team;
  },
  { immediate: true }
);

watch(teamName, (value) => {
  if (teamFormErrors.general) teamFormErrors.general = "";
  // Unicode-aware so accented names survive; the API caps the column at 64.
  teamName.value = value.replace(/[^\p{L}\p{N}\s.'-]/gu, "").substring(0, 64);
});

const validateForm = () => {
  clearFormErrors();
  if (teamName.value.trim().length < 2) {
    teamFormErrors.general = "Team name is required.";
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  const payload: CreateTeamParams = { team: teamName.value.trim() };

  try {
    if (props.mode === "update" && props.teamToUpdate) {
      await props.onSubmit({ team_id: props.teamToUpdate.team_id, ...payload });
    } else {
      await props.onSubmit(payload);
    }
    props.onClose();
  } catch {
    // Keep the form open so the error stays visible.
  }
};
</script>
