<template>
  <main class="relative w-full min-h-screen bg-center bg-no-repeat bg-cover">
    <div class="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-60"
      :style="{ backgroundImage: `url(${authBg})` }"></div>

    <div class="relative flex items-center justify-center min-h-screen px-3 py-10">
      <div class="flex items-center justify-center w-full px-3 sm:px-6 md:px-10">
        <div
          class="container flex flex-col items-center justify-center max-w-md bg-white border border-gray-200 shadow-2xl shadow-black/30 rounded">
          <div class="flex flex-col items-center justify-center w-full gap-5 p-6 md:gap-10">
            <h2 class="text-xl font-bold text-center text-gray-800 font-poppins md:mt-3 md:text-2xl">
              <span class="bg-clip-text bg-gradient-to-r from-text-primary text-transparent to-primary"> Welcome to the
                Official
                PTCI Cultural Tabulation System</span>
            </h2>

            <form @submit.prevent="handleSubmit"
              class="flex flex-col w-full h-full gap-5 text-sm text-gray-800 rounded-xl">
              <div class="grid gap-2">
                <label for="username" class="text-xs font-semibold text-gray-700 md:text-sm">Username</label>
                <div class="relative">
                  <AtSign
                    class="absolute transform -translate-y-1/2 pointer-events-none top-1/2 size-4 left-2 stroke-gray-400" />
                  <input @input="authStore.clearLoginErrors()" v-model="usernameInput" type="text" required
                    id="username" autocomplete="username" placeholder="Enter your username"
                    class="w-full h-12 px-4 py-3 pl-10 text-gray-800 placeholder-gray-400 transition-all duration-300 ease-out bg-white border border-gray-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-300 hover:shadow-md focus:shadow-lg" />
                </div>
                <p class="text-red-400" v-if="
                  authStore.loginErrors.general ||
                  authStore.loginErrors.invalidCredentials
                ">
                  <span class="flex gap-2 items-center">
                    <CircleAlert class="shrink-0 size-4" />
                    {{
                      authStore.loginErrors.general ||
                      authStore.loginErrors.invalidCredentials
                    }}
                  </span>
                </p>
              </div>

              <div class="grid gap-2">
                <label for="password" class="text-xs font-semibold text-gray-700 md:text-sm">Password</label>
                <div class="relative">
                  <LockKeyhole
                    class="absolute transform -translate-y-1/2 pointer-events-none top-1/2 size-4 left-2 stroke-gray-400" />
                  <input @input="authStore.clearLoginErrors()" v-model="passwordInput" type="password" id="password"
                    required autocomplete="current-password" placeholder="Enter your password"
                    class="w-full h-12 px-4 py-3 pl-10 text-gray-800 placeholder-gray-400 transition-all duration-300 ease-out bg-white border border-gray-200 shadow-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-gray-300 hover:shadow-md focus:shadow-lg" />
                </div>
              </div>

              <button type="submit" :disabled="isSigningIn" :class="ACTION_STYLES.PRIMARYBTN">
                <span class="flex items-center justify-center gap-3">
                  <template v-if="isSigningIn">
                    <LoaderCircle class="animate-spin size-5" />
                    <span>Signing in...</span>
                  </template>
                  <template v-else>
                    <span>Sign In</span>
                    <LogIn class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </template>
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
  import authBg from "../../../assets/images/background.png";
  import {
    AtSign,
    LoaderCircle,
    LockKeyhole,
    LogIn,
    CircleAlert,
  } from "lucide-vue-next";
  import { ref } from "vue";
  import { useAuthStore } from "../store/authStore";
  import { useRouter } from "vue-router";
  import { ACTION_STYLES } from "../../shared/constants/formStyles";

  const router = useRouter();
  const authStore = useAuthStore();

  const usernameInput = ref("");
  const passwordInput = ref("");
  const isSigningIn = ref(false);

  const handleSubmit = async () => {
    const cachedPassword = passwordInput.value.trim();
    passwordInput.value = "";

    isSigningIn.value = true;
    try {
      const { success } = await authStore.loginUser({
        username: usernameInput.value.trim(),
        password: cachedPassword,
      });

      if (success && authStore.getUserMetaData?.role === "judge") {
        return router.push({ name: "judge" });
      }
      if (success && authStore.getUserMetaData?.role === "admin") {
        return router.push({ name: "scoreboard-vocal" });
      }
    } finally {
      isSigningIn.value = false;
    }
  };
</script>
