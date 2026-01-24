<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-4">Dashboard</h1>
    <p>Welcome, {{ auth.user?.name }} ({{ auth.user?.email }})</p>
    <button @click="auth.logout()" class="mt-4 px-4 py-2 bg-red-500 text-white rounded">Logout</button>
  </div>
</template>
