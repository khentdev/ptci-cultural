<template>
  <section class="min-h-screen p-3 overflow-x-auto flex flex-col items-center justify-center">
    <div class="w-full max-w-full mt-12 rounded-2xl" :class="isPending ? '' : SURFACE_STYLES.GLASS_CARD">
      <div class="overflow-hidden rounded-2xl">
        <FeatureOfflineState v-if="isOffline || !isOnline" />
        <DataLoadingState v-else-if="isPending" />
        <template v-else>
          <div class="relative">
            <InlineFetchIndicator v-show="isFetching" />
            <slot />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { SURFACE_STYLES } from "../../shared/constants/surfaceStyles";
  import DataLoadingState from "../../shared/components/reusables/DataLoadingState.vue";
  import FeatureOfflineState from "../../shared/components/reusables/FeatureOfflineState.vue";
  import InlineFetchIndicator from "../../shared/components/reusables/InlineFetchIndicator.vue";
  import { useNetworkCheck } from "../../../shared/composables/useNetworkStatus";

  /**
   * The offline / loading / content shell shared by the single-table scoreboard pages.
   * `isOffline` is the store's API-level offline signal; the browser's own
   * navigator.onLine state is checked here.
   */
  defineProps<{
    isPending: boolean;
    isFetching: boolean;
    isOffline: boolean;
  }>();

  const { isOnline } = useNetworkCheck();
</script>
