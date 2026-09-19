<template>
  <FeatureBaseLayout :navigation-btns="navigationBtns" :role="authStore.capitalizedRole"
    :user-name="authStore.capitalizedUsername"><template #router-view><router-view></router-view></template>
  </FeatureBaseLayout>
</template>

<script lang="ts" setup>
  import { ref } from "vue";
  import FeatureBaseLayout from "../../shared/components/reusables/FeatureBaseLayout.vue";
  import { ChartPie, ChevronRight, Settings, Trophy } from "lucide-vue-next";
  import { useAuthStore } from "../../features/auth/store/authStore";
  import type { NavigationBtns } from "../../shared/components/reusables/types/featureBaseLayout";

  const authStore = useAuthStore();

  const toggleScoreboard = ref(false);
  const toggleSettings = ref(false);

  const navigationBtns: NavigationBtns = [
    {
      icon: ChartPie,
      label: "Overview",
      routeName: "dashboard-overview",
    },
    {
      icon: Trophy,
      label: "Scoreboard",
      dropDownIcon: ChevronRight,
      hasChildren: true,
      onClick: () => (toggleScoreboard.value = !toggleScoreboard.value),
      isOpen: toggleScoreboard,
      childrens: [
        { label: "Vocal Solo", routeName: "scoreboard-vocal" },
        { label: "Interpretative Dance", routeName: "scoreboard-interpretative" },
        { label: "Modern Dance", routeName: "scoreboard-modern" },
        { label: "Top 3 per Category", routeName: "scoreboard-top3" },
      ],
    },
    {
      icon: Settings,
      label: "Settings",
      dropDownIcon: ChevronRight,
      hasChildren: true,
      onClick: () => (toggleSettings.value = !toggleSettings.value),
      isOpen: toggleSettings,
      childrens: [
        { label: "Manage Contestants", routeName: "manage-contestants" },
        { label: "Manage Judge Accounts", routeName: "manage-judge-accounts" },
        { label: "Manage Admin Accounts", routeName: "manage-admin-accounts" },
        { label: "Activity Logs", routeName: "activity-logs" },
      ],
    },
  ];
</script>
