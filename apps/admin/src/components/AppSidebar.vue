<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  LayoutDashboard, 
  Menu, 
  Table, 
  ChefHat, 
  QrCode,
  LogOut,
  User,
  Users,
  Receipt
} from 'lucide-vue-next'

const auth = useAuthStore()
const route = useRoute()

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Menu', path: '/menu', icon: Menu },
  { name: 'Orders', path: '/orders', icon: Table },
  { name: 'Kitchen', path: '/kitchen', icon: ChefHat, external: true },
  { name: 'Server', path: '/server', icon: Receipt },
  { name: 'Tables', path: '/tables', icon: QrCode },
  { name: 'Staff', path: '/staff', icon: Users }
]
</script>

<template>
  <aside class="flex flex-col w-64 border-r bg-background">
    <div class="flex gap-2 items-center px-6 h-16 border-b">
      <div class="flex gap-2 items-center">
        <div class="flex justify-center items-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <QrCode class="w-4 h-4" />
        </div>
        <span class="text-lg font-semibold">QR Menu</span>
      </div>
    </div>
    
    <nav class="flex-1 p-4 space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex gap-3 items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="route.path === item.path 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
      >
        <component :is="item.icon" class="w-4 h-4" />
        {{ item.name }}
      </RouterLink>
    </nav>

    <div class="p-4 border-t">
      <div class="flex gap-3 items-center px-3 py-2">
        <div class="flex justify-center items-center w-8 h-8 rounded-full bg-muted">
          <User class="w-4 h-4" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ auth.user?.email || 'User' }}</p>
          <p class="text-xs truncate text-muted-foreground">Restaurant Admin</p>
        </div>
      </div>
      <Separator class="my-2" />
      <Button variant="ghost" class="justify-start w-full" @click="auth.logout()">
        <LogOut class="mr-2 w-4 h-4" />
        Logout
      </Button>
    </div>
  </aside>
</template>
