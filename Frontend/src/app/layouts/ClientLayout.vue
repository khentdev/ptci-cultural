<template>
  <feature-base-layout :navigation-btns="navigationBtns" :user-name="authStore.capitalizedUsername"
    :role="authStore.capitalizedRole">
    <template #router-view><router-view></router-view></template>
  </feature-base-layout>
</template>
<script setup lang="ts">
  import { ref } from "vue";
  import { useAuthStore } from "../../features/auth/store/authStore";
  import FeatureBaseLayout from "../../shared/components/reusables/FeatureBaseLayout.vue";
  import { ChevronRight, House, ChartBarStacked } from "lucide-vue-next";
  import type { NavigationBtns } from "../../shared/components/reusables/types/featureBaseLayout";
  const authStore = useAuthStore();

  const toggleCategory = ref(false);


  const navigationBtns: NavigationBtns = [
    {
      icon: House,
      label: "Home",
      routeName: "judge-home",
    },
    {
      icon: ChartBarStacked,
      label: "Category",
      dropDownIcon: ChevronRight,
      hasChildren: true,
      onClick: () => (toggleCategory.value = !toggleCategory.value),
      isOpen: toggleCategory,
      childrens: [
        {
          label: "Vocal Solo",
          routeName: "vocal-solo",
        },
        {
          label: "Modern Dance",
          routeName: "modern-dance",
        },
        {
          label: "Cultural Dance",
          routeName: "cultural-dance",
        },
      ],
    }
  ];
</script>
