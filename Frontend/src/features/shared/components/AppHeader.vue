<template>
  <header
    class="absolute top-0 left-0 w-full h-14 z-50 flex items-center px-6 sm:px-12 justify-center backdrop-blur-xl bg-white/40 border-b border-white/50 shadow-lg shadow-black/10">
    <div class="container max-w-3xl sm:max-w-7xl flex items-center justify-center sm:justify-between w-full">
      <h1 class="hidden sm:text-2xl sm:flex font-bold font-lora text-text-primary drop-shadow-md w-full">
        Cultural Night
      </h1>

      <nav class="flex justify-start items-center sm:justify-end sm:gap-2 sm:text-sm text-xs w-full">
        <router-link v-for="(r, i) in navRoutes" :to="{ name: r.routeName }" :key="r.routeName + i"
          v-slot="{ navigate, href, isExactActive }" :custom="true">
          <a :href="href" @click.prevent="() => handleNav(navigate)"
            class="relative font-semibold font-poppins transition-all px-4 py-2 rounded-lg duration-200 backdrop-blur-sm border"
            :class="[
              isActive(r, isExactActive)
                ? 'text-white bg-gradient-to-r from-primary to-primary/95 border-primary/30 shadow-lg shadow-primary/25'
                : 'text-text-primary bg-white/60 border-white/60 hover:bg-white/80 hover:border-white/80 hover:shadow-md hover:shadow-black/10 hover:scale-105',
            ]">
            <span class="flex flex-col items-center relative">{{ r.label }}
              <span v-if="isActive(r, isExactActive)"
                class="absolute -bottom-1 left-0 w-full h-0.5 bg-white rounded-full"></span>
            </span>
          </a>
        </router-link>

        <button @click="handleLogout" :class="[
          isMobile ? 'p-3 ' : 'px-5 border-2 border-primary hover:border-primary', isMobile && authStore.loadingState.isLoggingOut ? 'w-20' : '',
          'ml-auto sm:ml-3 py-2 gap-3 cursor-pointer rounded-full flex items-center text-sm font-semibold font-poppins text-primary bg-white/70 hover:bg-gradient-to-r hover:from-primary hover:to-primary/95 hover:text-white transition-all duration-200 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/25 hover:scale-105',
        ]">

          <template v-if="isMobile">
            <LogOut class="size-4 shrink-0" />
            <span v-if="authStore.loadingState.isLoggingOut" class="size-4 rounded-full border-t-transparent border-1 border-primary animate-spin"></span>
          </template>
          <template v-else>
            <template v-if="authStore.loadingState.isLoggingOut">
              <span>Logging out...</span>
              <span class="size-4 rounded-full border-t-transparent border-1 border-primary animate-spin"></span>
            </template>
            <span v-else>Logout</span>
          </template>
        </button>
      </nav>
    </div>
  </header>
</template>

<script lang="ts" setup>
  import { LogOut } from "lucide-vue-next";
  import { computed, onMounted, onUnmounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useAuthStore } from "../../auth/store/authStore";

  const authStore = useAuthStore();
  const userRole = computed(() => authStore.getUserMetaData?.role);
  const router = useRouter()

  const allNavRoutes: NavRoute[] = [
    {
      label: "Dashboard",
      routeName: "dashboard-overview",
      pathPrefix: "/dashboard",
      role: "admin",
    },
    {
      label: "Judge",
      routeName: "judge-home",
      pathPrefix: "/judge",
      role: "judge",
    },
  ];

  const navRoutes = computed(() =>
    allNavRoutes.filter((r) => !r.role || r.role === userRole.value)
  );

  const handleNav = (nav: () => void) => nav();

  const windowSize = ref(window.innerWidth);
  const setWindowSize = () => (windowSize.value = window.innerWidth);
  const isMobile = computed(() => (windowSize.value < 640 ? true : false));

  const route = useRoute();

  type NavRoute = {
    label: string;
    routeName: string;
    pathPrefix: string;
    role?: "judge" | "admin";
  };
  const isActive = (r: NavRoute, isExactActive: boolean): boolean => {
    const matchesPrefix =
      r.pathPrefix !== "/" && route.path.startsWith(r.pathPrefix);
    return matchesPrefix || isExactActive;
  };


  const handleLogout = async () => {
    try {
      await authStore.logoutUser()
    } catch (err) {
      console.warn("Logout error: ",err)
    } finally {
      router.replace({ name: "login" })
    }
  }

  onMounted(() => {
    window.addEventListener("resize", setWindowSize);
  });
  onUnmounted(() => {
    window.removeEventListener("resize", setWindowSize);
  });
</script>