<template>
  <section class="relative overflow-x-auto rounded-2xl flex flex-col p-6 min-h-screen">
    <div
      class="flex flex-col space-y-8 mt-20 w-full backdrop-blur-lg bg-white/25 h-[80vh] p-6 rounded-2xl overflow-y-auto border border-white/50 shadow-2xl shadow-black/5">
      <header class="text-center space-y-3 pb-6 border-b border-white/30">
        <h1 class="text-text-primary text-2xl sm:text-3xl font-bold font-lora drop-shadow-sm">
          Welcome,
          <span class="text-text-primary tracking-wide font-lora">{{
            capitalizedName(authStore.getUserMetaData?.username)?.concat("!")
          }}</span>
        </h1>
        <p class="text-text-primary/80 text-sm sm:text-base font-poppins drop-shadow-sm">
          You're logged in as a
          <span class="font-semibold text-text-primary">Judge</span> for the cultural
          evaluation.
        </p>
      </header>
      <div class="space-y-8 flex flex-col h-full">
        <div class="text-center space-y-6 h-full flex flex-col justify-center items-center">
          <h2 class="text-text-primary text-2xl sm:text-3xl font-bold font-lora relative z-10 drop-shadow-sm">
            Ready to Begin Judging
          </h2>
          <p
            class="text-text-primary/80 text-base sm:text-lg font-poppins max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            You may now begin evaluating candidates across all cultural performance categories -
            including <span class="font-semibold text-text-primary">Vocals</span>,
            <span class="font-semibold text-text-primary">Modern Dance</span>, and
            <span class="font-semibold text-text-primary">Interpretative Dance</span>.
            All judging routes are now open and ready for your evaluation.
          </p>

          <button @click="
            () => {
              router.push({ name: 'vocal-solo' });
            }
          "
            class="group cursor-pointer bg-gradient-to-r from-primary to-primary/95 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-5 md:px-10 py-4 rounded-xl font-semibold font-poppins transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-primary/30 disabled:hover:scale-100 disabled:hover:shadow-none focus:outline-none focus:ring-4 focus:ring-primary/20 border border-white/20">
            Start Judging
          </button>
        </div>
        <div
          class="backdrop-blur-md bg-white/20 rounded-2xl p-3 md:p-6 border border-white/40 shadow-lg shadow-black/5">
          <div
            class="flex md:flex-row flex-col items-center justify-between space-y-5 md:space-y-0 md:space-x-10 overflow-x-auto">
            <div class="space-y-1 md:text-start text-center md:min-w-56">
              <h3 class="font-semibold text-text-primary font-lora text-lg drop-shadow-sm">
                Need to review rules again?
              </h3>
              <p class="text-sm text-text-primary/80 font-poppins drop-shadow-sm">
                Access the judging guidelines anytime during your session.
              </p>
            </div>
            <div class="flex md:flex-row flex-col items-center gap-3">
              <button @click="openTopSix"
                class="group bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/40 text-nowrap text-text-primary px-5 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-md hover:shadow-black/10 flex items-center gap-2">
                <Menu class="stroke-text-primary size-4 stroke-3 shrink-0" />
                <span>View Top 7 Rules</span>
                <chevron-right
                  class="stroke-text-primary w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
              </button>
              <button @click="openGeneralRules"
                class="group bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/30 hover:border-white/40 md:mr-3 md:text-center text-start md:text-nowrap text-text-primary px-5 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-md hover:shadow-black/10 flex items-center gap-2"
                title="View general judging rules">
                <Menu class="stroke-text-primary size-4 stroke-3 shrink-0" />
                <span>See General Judging Rules</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <top-seven-rules :close="closeTopSix" :isOpen="isTopSixOpen" />
  <transition enter-active-class="transition-color duration-200 ease-out"
    leave-active-class="transition-color duration-200 ease-out" enter-from-class="opacity-0"
    enter-to-class="opacity-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
    <div v-if="isGeneralRulesOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click="closeGeneralRules">
      <div
        class="backdrop-blur-xl bg-white/90 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-black/10 border border-white/60"
        @click.stop>
        <div class="p-6 border-b border-white/40 backdrop-blur-sm bg-white/30">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="size-8 bg-text-primary/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <Menu class="stroke-text-primary size-4 stroke-3" />
              </div>
              <h3 class="text-xl font-bold text-text-primary font-lora drop-shadow-sm">
                General Judging Rules
              </h3>
            </div>
          </div>
        </div>
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <div class="space-y-6">
            <div class="space-y-4">
              <text-card :rules="judgingRules" />
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-white/40 backdrop-blur-sm bg-white/30">
          <div class="flex justify-end">
            <button @click="closeGeneralRules"
              class="bg-gradient-to-r from-primary to-primary/95 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 border border-white/20">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
  import { ref } from "vue";
  import TextCard from "./components/reusables/TextCard.vue";
  import { ChevronRight, Menu } from "lucide-vue-next";
  import TopSevenRules from "./components/reusables/TopSevenRules.vue";
  import { useAuthStore } from "../auth/store/authStore";
  import { CapitalizeLabel } from "../../utils/capitalizeWord";
  import { useRouter } from "vue-router";

  const router = useRouter();
  const authStore = useAuthStore();

  type Rules = {
    boldTitle?: string;
    text: string;
  }[];

  const judgingRules: Rules = [
    {
      text: "1. Scores cannot be edited or repeated once submitted.",
    },
    {
      text: "2. Strictly no duplication or repetition of score submissions.",
    },
    {
      text: "3. Scores will be automatically saved to the admin once submitted.",
    },
    {
      text: "4. Each contestants must be assigned a unique total score according to the judging criteria.",
    },
    {
      boldTitle: "5. Important",
      text: "View the system rules to check the rules per category.",
    },
  ];

  const isTopSixOpen = ref(false);
  const isGeneralRulesOpen = ref(false);

  const openTopSix = () => (isTopSixOpen.value = true);
  const closeTopSix = () => (isTopSixOpen.value = false);

  const openGeneralRules = () => (isGeneralRulesOpen.value = true);
  const closeGeneralRules = () => (isGeneralRulesOpen.value = false);


  const capitalizedName = (val: string | undefined) =>
    val ? CapitalizeLabel(val) : "- Unknown User -";

</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(107, 114, 128, 0.2);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.3);
}
</style>