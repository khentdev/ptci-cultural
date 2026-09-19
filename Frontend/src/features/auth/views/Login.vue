<template>
  <main class="relative w-full min-h-screen bg-center bg-no-repeat bg-cover">
    <div class="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-60"
      :style="{ backgroundImage: `url(${authBg})` }"></div>

    <div
      class="grid items-center min-h-screen grid-cols-1 gap-8 px-3 p-10 overflow-hidden justify-items-center xl:flex xl:flex-row xl:gap-5">
      <div class="flex items-center justify-center w-full px-3 mt-8 sm:px-6 md:px-10 xl:order-2">
        <div class="relative flex justify-center w-full h-48 sm:h-64 md:h-80 lg:h-96">
          <div :ref="(el) => (cardRefs[0] = el as HTMLDivElement)"
            class="absolute w-40 h-40 sm:w-52 sm:h-52 md:w-68 md:h-68 lg:w-44 xl:w-94 xl:h-94">
            <div
              class="relative w-full h-full overflow-hidden bg-white border border-gray-200 shadow-xl shadow-black/20 rounded-full">
              <Transition name="fade" mode="out-in">
                <img loading="lazy" :key="leftCardSrc" :src="leftCardSrc" alt="Left carousel image"
                  class="object-cover object-center w-full h-full" />
              </Transition>
            </div>
          </div>

          <div :ref="(el) => (cardRefs[1] = el as HTMLDivElement)"
            class="absolute w-40 h-40 sm:w-52 sm:h-52 md:w-68 md:h-68 lg:w-44 xl:w-94 xl:h-94">
            <div
              class="relative w-full h-full overflow-hidden bg-white border border-gray-200 shadow-xl shadow-black/20 rounded-full">
              <Transition name="fade" mode="out-in">
                <img loading="lazy" :key="rightCardSrc" :src="rightCardSrc" alt="Right carousel image"
                  class="object-cover object-center w-full h-full" />
              </Transition>
            </div>
          </div>

          <div :ref="(el) => (cardRefs[2] = el as HTMLDivElement)"
            class="absolute w-40 h-40 sm:w-52 sm:h-52 md:w-68 md:h-68 lg:w-44 xl:w-94 xl:h-94">
            <div
              class="relative w-full h-full overflow-hidden bg-white border border-gray-200 shadow-xl shadow-black/20 rounded-full">
              <Transition name="fade" mode="out-in">
                <img loading="lazy" :key="centerCardSrc" :src="centerCardSrc" alt="Center carousel image"
                  class="object-cover object-center w-full h-full" />
              </Transition>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center w-full h-full px-3 sm:px-6 md:px-10 lg:order-1 z-50">
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

              <span
                class="mt-2 text-gray-700 underline transition-colors duration-300 cursor-pointer hover:text-gray-800 w-fit">
                Forgot password?
              </span>
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
  import { ref, onMounted, onUnmounted, reactive } from "vue";
  import { useAuthStore } from "../store/authStore";
  import { useRouter } from "vue-router";
  import { ACTION_STYLES } from "../../shared/constants/formStyles";
  import { gsap } from "gsap";
  import { useDeviceDetection } from "../../shared/composables/useDeviceDetection";

  import M1 from "../../../assets/images/TeamLogo/blue team.png";
  import M2 from "../../../assets/images/TeamLogo/green team.png";
  import M3 from "../../../assets/images/TeamLogo/purple team.png";
  import M4 from "../../../assets/images/TeamLogo/red team.png";
  import M5 from "../../../assets/images/TeamLogo/yellow team.png";

  const router = useRouter();
  const authStore = useAuthStore();
  const { isMobile } = useDeviceDetection();

  const usernameInput = ref("");
  const passwordInput = ref("");
  const isSigningIn = ref(false);

  const cardRefs = ref<HTMLDivElement[]>([]);

  const allImages = [M1, M2, M3, M4, M5];
  let availableImages = [...allImages];

  function shuffle<T>(array: T[]): T[] {
    return array
      .map((item) => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);
  }

  function getUniqueImage(exclude: string[]): string {
    const remaining = availableImages.filter((img) => !exclude.includes(img));
    if (remaining.length === 0) {
      availableImages = shuffle([...allImages]);
      return getUniqueImage(exclude);
    }
    const randomIndex = Math.floor(Math.random() * remaining.length);
    const selected = remaining[randomIndex];
    if (typeof selected !== "string") {
      throw new Error("No image could be selected");
    }
    availableImages = availableImages.filter((img) => img !== selected);
    return selected;
  }

  const leftCardSrc = ref<string>("");
  const centerCardSrc = ref<string>("");
  const rightCardSrc = ref<string>("");

  leftCardSrc.value = getUniqueImage([]);
  centerCardSrc.value = getUniqueImage([leftCardSrc.value]);
  rightCardSrc.value = getUniqueImage([leftCardSrc.value, centerCardSrc.value]);

  function updateCardSrc(refToUpdate: typeof leftCardSrc) {
    refToUpdate.value = getUniqueImage([
      leftCardSrc.value,
      centerCardSrc.value,
      rightCardSrc.value,
    ]);
  }

  const getPositions = () => {
    return isMobile.value
      ? [
        { x: -100, y: -40, scale: 0.85, zIndex: 1 },
        { x: 100, y: -40, scale: 0.85, zIndex: 1 },
        { x: 0, y: 0, scale: 1, zIndex: 2 },
      ]
      : [
        { x: -200, y: -40, scale: 0.85, zIndex: 1 },
        { x: 200, y: -40, scale: 0.85, zIndex: 1 },
        { x: 0, y: 0, scale: 1, zIndex: 2 },
      ];
  };

  const positions = reactive(getPositions());

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
        return router.push({ name: "dashboard" });
      }
    } finally {
      isSigningIn.value = false;
    }
  };

  onMounted(() => {
    cardRefs.value.forEach((card, i) => {
      const pos = positions[i];
      if (pos && card) {
        gsap.set(card, {
          x: pos.x,
          y: pos.y,
          scale: pos.scale,
          zIndex: pos.zIndex,
        });
      }
    });

    const carouselIntervalId = setInterval(() => {
      const lastPos = positions.pop()!;
      positions.unshift(lastPos);

      cardRefs.value.forEach((card, i) => {
        if (card && positions[i]) {
          gsap.to(card, {
            x: positions[i].x,
            y: positions[i].y,
            scale: positions[i].scale,
            zIndex: positions[i].zIndex,
            duration: 0.8,
            ease: "power2.inOut",
          });
        }
      });
    }, 4000);

    const leftInterval = setInterval(() => updateCardSrc(leftCardSrc), 6000);
    const centerInterval = setInterval(() => updateCardSrc(centerCardSrc), 5500);
    const rightInterval = setInterval(() => updateCardSrc(rightCardSrc), 6500);

    const handleResize = () => {
      const newPositions = getPositions();
      Object.assign(positions, newPositions);
      cardRefs.value.forEach((card, i) => {
        if (card && positions[i]) {
          gsap.to(card, {
            x: positions[i].x,
            y: positions[i].y,
            scale: positions[i].scale,
            zIndex: positions[i].zIndex,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      });
    };

    window.addEventListener("resize", handleResize);

    onUnmounted(() => {
      clearInterval(carouselIntervalId);
      clearInterval(leftInterval);
      clearInterval(centerInterval);
      clearInterval(rightInterval);
      window.removeEventListener("resize", handleResize);
    });
  });
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 500ms ease-in-out;
  position: absolute;
  inset: 0;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
