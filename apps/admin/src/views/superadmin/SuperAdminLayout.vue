<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { LogOut, Shield } from 'lucide-vue-next'

const auth = useAuthStore()

function handleLogout() {
  auth.logout()
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <Shield class="w-6 h-6 text-primary" />
          <h1 class="text-xl font-bold">Super Admin</h1>
        </div>
        <Button variant="ghost" @click="handleLogout">
          <LogOut class="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="border-b bg-muted/40">
      <div class="container mx-auto px-4">
        <div class="flex gap-1">
          <router-link
            to="/superadmin"
            class="px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
            active-class="border-primary"
          >
            Dashboard
          </router-link>
          <router-link
            to="/superadmin/restaurants"
            class="px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
            active-class="border-primary"
          >
            Restaurants
          </router-link>
          <router-link
            to="/superadmin/users"
            class="px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
            active-class="border-primary"
          >
            Users
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <main class="container mx-auto px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
