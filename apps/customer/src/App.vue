<script setup lang="ts">
import { RouterView } from 'vue-router'
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'

</script>

<template>
  <div class="w-full min-h-screen text-gray-900">
    <RouterView class="w-full"/>
    <Toaster position="top-center" />
  </div>
</template>
