<template>
  <FeatureBaseLayout :navigation-btns="navigationBtns" :role="authStore.capitalizedRole"
    :user-name="authStore.capitalizedUsername"><template #router-view><router-view></router-view></template>
  </FeatureBaseLayout>
</template>

<script lang="ts" setup>
  import { ref, watch } from "vue";
  import type { FunctionalComponent } from "vue";
  import { useRoute } from "vue-router";
  import FeatureBaseLayout from "../../shared/components/reusables/FeatureBaseLayout.vue";
  import { ChevronRight, Drama, Mic, Music, Settings } from "lucide-vue-next";
  import type { LucideProps } from "lucide-vue-next";
  import { useAuthStore } from "../../features/auth/store/authStore";
  import {
    SCOREBOARD_CATEGORIES,
    SCOREBOARD_CATEGORY_ORDER,
    finalScoresRouteName,
    judgeScoresRouteName,
    topThreeRouteName,
  } from "../../features/scoreboard/types/categories";
  import type { ScoreboardCategoryKey } from "../../features/scoreboard/types/types";
  import type { NavigationBtns } from "../../shared/components/reusables/types/featureBaseLayout";

  const authStore = useAuthStore();
  const route = useRoute();

  const CATEGORY_ICONS: Record<ScoreboardCategoryKey, FunctionalComponent<LucideProps>> = {
    vocal: Mic,
    modern: Music,
    cultural: Drama,
  };

  /** Each category is its own domain: one collapsible group holding its three pages. */
  const categoryGroups = SCOREBOARD_CATEGORY_ORDER.map((key) => ({
    key,
    isOpen: ref(false),
    routeNames: [finalScoresRouteName(key), judgeScoresRouteName(key), topThreeRouteName(key)],
  }));

  const toggleSettings = ref(false);

  const navigationBtns: NavigationBtns = [
    ...categoryGroups.map((group) => ({
      icon: CATEGORY_ICONS[group.key],
      label: SCOREBOARD_CATEGORIES[group.key].label,
      dropDownIcon: ChevronRight,
      hasChildren: true,
      onClick: () => (group.isOpen.value = !group.isOpen.value),
      isOpen: group.isOpen,
      childrens: [
        { label: "Final Scores", routeName: finalScoresRouteName(group.key) },
        { label: "Scores per Judge", routeName: judgeScoresRouteName(group.key) },
        { label: "Top 3", routeName: topThreeRouteName(group.key) },
      ],
    })),
    {
      icon: Settings,
      label: "Settings",
      dropDownIcon: ChevronRight,
      hasChildren: true,
      onClick: () => (toggleSettings.value = !toggleSettings.value),
      isOpen: toggleSettings,
      childrens: [
        { label: "Manage Teams", routeName: "manage-teams" },
        { label: "Manage Contestants", routeName: "manage-contestants" },
        { label: "Manage Judge Accounts", routeName: "manage-judge-accounts" },
        { label: "Manage Admin Accounts", routeName: "manage-admin-accounts" },
      ],
    },
  ];

  // The sidebar starts collapsed, so reveal which category group the current
  // route lives in instead of showing everything shut.
  watch(
    () => route.name,
    (name) => {
      const active = categoryGroups.find((group) => group.routeNames.includes(String(name)));
      if (active) active.isOpen.value = true;
    },
    { immediate: true }
  );
</script>
