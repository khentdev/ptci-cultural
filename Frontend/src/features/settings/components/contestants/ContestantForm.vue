<template>
  <form class="grid grid-cols-2 gap-2 md:gap-5" @submit.prevent="handleSubmit">
    <div class="col-span-2">
      <label for="teamName" class="block text-sm font-medium text-gray-700">
        Team
      </label>
      <div class="relative">
        <button @click.stop="toggleTeamDropdown" type="button" aria-controls="dropdown-listbox"
          :aria-expanded="teamDropdownOpen" :class="FORM_FIELDS.DROPDOWN">
          <span>{{ selectedTeamLabel || "Select team..." }}</span>
          <ChevronDown class="shrink-0 size-4" />
        </button>
        <transition enter-active-class="transition-transform duration-100 ease-out"
          enter-from-class="-translate-y-5 opacity-0" enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-75 ease-in" leave-from-class="translate-y-0 opacity-100"
          leave-to-class="opacity-0">
          <ul v-if="teamDropdownOpen" role="listbox" v-on-click-outside.bubble="toggleTeamDropdown"
            class="absolute z-40 w-full mt-1 overflow-hidden overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 md:max-h-50">
            <li v-for="(item, i) in teamOptions" :key="i" :id="'team-' + item" role="option" tabindex="0"
              :aria-selected="selectedTeam === item" @click="selectTeam(item)"
              @keydown.enter.prevent="selectTeam(item)" @keydown.space.prevent="selectTeam(item)" :class="[
                'flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100',
                formatTeamColor(item),
              ]">
              {{ TEAM_LABELS[item] }}
            </li>
          </ul>
        </transition>
      </div>
    </div>

    <div>
      <label for="lastName" class="block text-sm font-medium text-gray-700">
        Last Name
      </label>
      <input v-model="contestantLastName" id="lastName" type="text" :class="FORM_FIELDS.INPUT_FIELD"
        placeholder="Doe" />
    </div>

    <div>
      <label for="firstName" class="block text-sm font-medium text-gray-700">
        First Name
      </label>
      <input v-model="contestantFirstName" id="firstName" type="text" placeholder="John"
        :class="FORM_FIELDS.INPUT_FIELD" />
    </div>

    <p v-if="contestantFormErrors.general" class="col-span-2 text-sm text-red-500 flex items-center gap-3 mt-1">
      <TriangleAlert class="size-4 shrink-0" />
      {{ contestantFormErrors.general }}
    </p>

    <div class="flex justify-between items-center gap-5 col-span-2 mt-3">
      <button @click="onClose" type="button" :class="ACTION_STYLES.CANCELBTN">
        Cancel
      </button>
      <button type="submit" :disabled="isLoading" :class="ACTION_STYLES.PRIMARYBTN">
        {{ isLoading ? "Submitting..." : "Submit" }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ChevronDown, TriangleAlert } from "lucide-vue-next";
import { vOnClickOutside } from "@vueuse/components";
import { useContestantsStore } from "../../store/contestantStore";
import { ACTION_STYLES, FORM_FIELDS } from "../../../shared/constants/formStyles";
import { TEAM_LABELS } from "../../../client/types/shared/types";
import type { CandidateTeamOptions, CreateContestantParams, UpdateContestantParams } from "../../types/contestants";
import { CapitalizeLabel, splitName } from "../../../../utils/capitalizeWord";

const { contestantFormErrors, clearFormErrors } = useContestantsStore();
onBeforeUnmount(() => clearFormErrors());

const props = defineProps<{
  mode: "create" | "update";
  onClose: () => void;
  isLoading?: boolean;
  onSubmit: (data: any) => Promise<UpdateContestantParams | CreateContestantParams | any>;
  contestantToUpdate?: UpdateContestantParams | null;
}>();

const contestantFirstName = ref("");
const contestantLastName = ref("");
const teamDropdownOpen = ref(false);
const selectedTeam = ref<CandidateTeamOptions | null>(null);
const selectedTeamLabel = computed(() => (selectedTeam.value ? TEAM_LABELS[selectedTeam.value] : null));

const teamOptions: CandidateTeamOptions[] = ["red", "yellow", "green", "purple", "blue"];

const populateForm = (data: UpdateContestantParams) => {
  selectedTeam.value = data.cand_team;
  const { lastName, firstName } = splitName(data.cand_name);
  contestantLastName.value = lastName;
  contestantFirstName.value = firstName;
};

watch(
  [() => props.contestantToUpdate, () => props.mode],
  ([hasData, mode]) => {
    if (hasData && mode === "update") populateForm(hasData);
  },
  { immediate: true }
);

const toggleTeamDropdown = () => (teamDropdownOpen.value = !teamDropdownOpen.value);
const selectTeam = (team: CandidateTeamOptions) => {
  selectedTeam.value = team;
  teamDropdownOpen.value = false;
};

const formatTeamColor = (color: CandidateTeamOptions) =>
  ({
    red: "text-red-500",
    yellow: "text-yellow-400",
    green: "text-green-500",
    purple: "text-purple-500",
    blue: "text-blue-500",
  })[color];

watch([contestantFirstName, contestantLastName, selectedTeam], () => {
  if (contestantFormErrors.general) contestantFormErrors.general = "";
});

// Unicode-aware so accented and ñ names survive.
watch([contestantFirstName, contestantLastName], ([firstName, lastName]) => {
  const wordsOnly = /[^\p{L}\s,.'-]/gu;
  contestantFirstName.value = firstName.replace(wordsOnly, "").substring(0, 49);
  contestantLastName.value = lastName.replace(wordsOnly, "").substring(0, 49);
});

const validateForm = () => {
  clearFormErrors();
  if (!contestantFirstName.value.trim() || !contestantLastName.value.trim() || !selectedTeam.value) {
    contestantFormErrors.general = "All fields are required.";
    return false;
  }
  return true;
};

const contestantFullName = computed(
  () => `${CapitalizeLabel(contestantLastName.value)}, ${CapitalizeLabel(contestantFirstName.value)}`
);

const handleSubmit = async () => {
  if (!validateForm()) return;

  const addFormData: CreateContestantParams = {
    cand_name: contestantFullName.value,
    cand_team: selectedTeam.value!,
  };

  try {
    if (props.mode === "update" && props.contestantToUpdate) {
      await props.onSubmit({ cand_id: props.contestantToUpdate.cand_id, ...addFormData });
    } else {
      await props.onSubmit(addFormData);
    }
    props.onClose();
  } catch {
    // Keep the form open so the error stays visible.
  }
};
</script>
