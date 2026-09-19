<template>
  <form class="grid grid-cols-2 gap-2 md:gap-5" @submit.prevent="handleSubmit">
    <div class="col-span-2 sm:col-span-1">
      <label for="candidateNumber" class="block text-sm font-medium text-gray-700">
        Contestant Number
      </label>
      <input v-model="contestantNumber" id="candidateNumber" type="text" placeholder="Enter contestant no."
        :class="FORM_FIELDS.INPUT_FIELD" />
    </div>

    <div class="col-span-2 sm:col-span-1">
      <label for="teamName" class="block text-sm font-medium text-gray-700">Team</label>
      <div class="relative">
        <button @click.stop="toggleTeamDropdown" type="button" aria-controls="team-dropdown-list"
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
            <li v-if="!teams.length" class="px-3 py-2 text-sm text-gray-500">No teams yet</li>
            <li v-for="team in teams" :key="team.team_id" :id="'team-' + team.team_id" role="option" tabindex="0"
              :aria-selected="selectedTeamId === team.team_id" @click="selectTeam(team)"
              @keydown.enter.prevent="selectTeam(team)" @keydown.space.prevent="selectTeam(team)"
              class="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 transition-colors focus:outline-none focus:bg-gray-100">
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="getTeamBadgeClasses(team.team)">
                {{ team.team }}
              </span>
            </li>
          </ul>
        </transition>
      </div>
    </div>

    <div class="col-span-2">
      <label for="gender" class="block text-sm font-medium text-gray-700">Gender</label>
      <div class="relative">
        <button @click.stop="toggleGenderDropdown" type="button" aria-controls="gender-dropdown-list"
          :aria-expanded="genderDropdownOpen" :class="FORM_FIELDS.DROPDOWN">
          <span>{{ CapitalizeLabel(selectedGender) }}</span>
          <ChevronDown class="shrink-0 size-4" />
        </button>
        <transition enter-active-class="transition-transform duration-100 ease-out"
          enter-from-class="-translate-y-5 opacity-0" enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-75 ease-in" leave-from-class="translate-y-0 opacity-100"
          leave-to-class="opacity-0">
          <ul v-if="genderDropdownOpen" role="listbox" v-on-click-outside.bubble="toggleGenderDropdown"
            class="absolute z-40 w-full mt-1 overflow-hidden overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 md:max-h-50">
            <li v-for="gender in GENDER_OPTIONS" :key="gender" :id="'gender-' + gender" role="option" tabindex="0"
              :aria-selected="selectedGender === gender" @click="selectGender(gender)"
              @keydown.enter.prevent="selectGender(gender)" @keydown.space.prevent="selectGender(gender)"
              class="px-3 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-100 transition-colors focus:bg-gray-100 focus:outline-none">
              {{ CapitalizeLabel(gender) }}
            </li>
          </ul>
        </transition>
      </div>
    </div>

    <div>
      <label for="lastName" class="block text-sm font-medium text-gray-700">Last Name</label>
      <input v-model="contestantLastName" id="lastName" type="text" :class="FORM_FIELDS.INPUT_FIELD"
        placeholder="Doe" />
    </div>

    <div>
      <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
      <input v-model="contestantFirstName" id="firstName" type="text" placeholder="John"
        :class="FORM_FIELDS.INPUT_FIELD" />
    </div>

    <p v-if="contestantFormErrors.general" class="col-span-2 text-sm text-red-500 flex items-center gap-3 mt-1">
      <TriangleAlert class="size-4 shrink-0" />
      {{ contestantFormErrors.general }}
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
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ChevronDown, TriangleAlert } from "lucide-vue-next";
import { vOnClickOutside } from "@vueuse/components";
import { useContestantsStore } from "../../store/contestantStore";
import { useTeamsStore } from "../../store/teamStore";
import { ACTION_STYLES, FORM_FIELDS } from "../../../shared/constants/formStyles";
import { getTeamBadgeClasses } from "../../../client/types/shared/types";
import {
  GENDER_OPTIONS,
  type CreateContestantParams,
  type GenderOptions,
  type UpdateContestantParams,
} from "../../types/contestants";
import type { TeamData } from "../../types/teams";
import { CapitalizeLabel, splitName } from "../../../../utils/capitalizeWord";

const { contestantFormErrors, clearFormErrors } = useContestantsStore();
const { getTeams } = useTeamsStore();
onBeforeUnmount(() => clearFormErrors());

const props = defineProps<{
  mode: "create" | "update";
  onClose: () => void;
  isLoading?: boolean;
  onSubmit: (data: any) => Promise<UpdateContestantParams | CreateContestantParams | any>;
  contestantToUpdate?: UpdateContestantParams | null;
}>();

// Teams come from the API, so the form can never offer a team the backend would reject.
const teams = computed(() => getTeams.data?.data ?? []);

const contestantNumber = ref("");
const contestantFirstName = ref("");
const contestantLastName = ref("");
const selectedTeamId = ref<string | null>(null);
const selectedGender = ref<GenderOptions>("male");

const teamDropdownOpen = ref(false);
const genderDropdownOpen = ref(false);

const selectedTeamLabel = computed(
  () => teams.value.find((t) => t.team_id === selectedTeamId.value)?.team ?? null
);

const populateForm = (data: UpdateContestantParams) => {
  contestantNumber.value = data.cand_number;
  selectedTeamId.value = data.team_id;
  selectedGender.value = data.cand_gender;
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

const toggleTeamDropdown = () => {
  if (genderDropdownOpen.value) genderDropdownOpen.value = false;
  teamDropdownOpen.value = !teamDropdownOpen.value;
};
const toggleGenderDropdown = () => {
  if (teamDropdownOpen.value) teamDropdownOpen.value = false;
  genderDropdownOpen.value = !genderDropdownOpen.value;
};

const selectTeam = (team: TeamData) => {
  selectedTeamId.value = team.team_id;
  teamDropdownOpen.value = false;
};
const selectGender = (gender: GenderOptions) => {
  selectedGender.value = gender;
  genderDropdownOpen.value = false;
};

watch([contestantNumber, contestantFirstName, contestantLastName, selectedTeamId, selectedGender], () => {
  if (contestantFormErrors.general) contestantFormErrors.general = "";
});

// Unicode-aware so accented and ñ names survive.
watch([contestantNumber, contestantFirstName, contestantLastName], ([number, firstName, lastName]) => {
  const wordsOnly = /[^\p{L}\s,.'-]/gu;
  contestantNumber.value = number.replace(/[^0-9A-Za-z-]/g, "").substring(0, 8);
  contestantFirstName.value = firstName.replace(wordsOnly, "").substring(0, 49);
  contestantLastName.value = lastName.replace(wordsOnly, "").substring(0, 49);
});

const validateForm = () => {
  clearFormErrors();
  if (
    !contestantNumber.value.trim() ||
    !contestantFirstName.value.trim() ||
    !contestantLastName.value.trim() ||
    !selectedTeamId.value
  ) {
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
    cand_number: contestantNumber.value,
    cand_name: contestantFullName.value,
    team_id: selectedTeamId.value!,
    cand_gender: selectedGender.value,
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
