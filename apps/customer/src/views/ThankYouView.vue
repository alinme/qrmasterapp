<template>
  <div class="flex flex-col justify-center items-center p-8 min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div class="space-y-8 w-full max-w-md text-center animate-fade-in">
      <!-- Success Icon with Animation -->
      <div class="flex justify-center">
        <div class="relative">
          <div class="flex justify-center items-center w-24 h-24 bg-green-500 rounded-full shadow-2xl animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <!-- Animated rings -->
          <div class="absolute inset-0 rounded-full border-4 border-green-400 opacity-75 animate-ping"></div>
          <div class="absolute inset-0 rounded-full border-4 border-green-300 animate-pulse"></div>
        </div>
      </div>

      <!-- Thank You Message -->
      <div class="space-y-4">
        <h1 class="text-5xl font-bold text-gray-900 dark:text-white">Mulțumim!</h1>
        <h2 class="text-3xl font-semibold text-gray-700 dark:text-gray-200">Vă așteptăm din nou!</h2>
        <p class="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
          Sesiunea mesei a fost închisă. Vă mulțumim că ați ales restaurantul nostru și sperăm să vă vedem din nou curând!
        </p>
      </div>

      <!-- Decorative Elements -->
      <div class="flex gap-4 justify-center text-5xl animate-bounce-slow">
        <span class="animate-bounce" style="animation-delay: 0s">🍽️</span>
        <span class="animate-bounce" style="animation-delay: 0.2s">👋</span>
        <span class="animate-bounce" style="animation-delay: 0.4s">❤️</span>
      </div>

      <!-- Action Button -->
      <div class="pt-8">
        <button
          @click="goToScan"
          class="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg transition-all duration-200 transform hover:from-green-700 hover:to-green-800 hover:scale-105 active:scale-95"
        >
          Scanează din nou pentru o nouă comandă
        </button>
      </div>

      <!-- Additional Info -->
      <p class="pt-4 text-sm text-gray-500 dark:text-gray-400">
        Pentru a plasa o nouă comandă, vă rugăm să scanați din nou codul QR de pe masă.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

const router = useRouter()

function goToScan() {
  router.push({ name: 'scan' })
}
let redirectTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  // Auto-redirect after 10 seconds if user doesn't click
  redirectTimer = setTimeout(() => {
    goToScan()
  }, 10000)
})

onUnmounted(() => {
  // Cleanup on unmount
  if (redirectTimer) {
    clearTimeout(redirectTimer)
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
</style>
