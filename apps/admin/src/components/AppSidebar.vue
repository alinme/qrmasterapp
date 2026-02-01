<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { computed, onMounted } from 'vue'

const auth = useAuthStore()
const ordersStore = useOrdersStore()
const route = useRoute()

const pendingReviewOrdersCount = computed(() => {
  return ordersStore.orders.filter(o => o.status === 'SERVER_REVIEW').length
})

// Role-based visibility
const userRole = computed(() => auth.user?.role || '')

const allNavItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'SERVER', 'KITCHEN', 'STAFF'] },
  { name: 'Menu', path: '/menu', icon: Menu, roles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN'] },
  { name: 'Orders', path: '/orders', icon: Table, roles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN'] },
  { name: 'Kitchen', path: '/kitchen', icon: ChefHat, external: true, roles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN'] },
  { name: 'Server', path: '/server', icon: Receipt, badge: pendingReviewOrdersCount, roles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'SERVER'] },
  { name: 'Tables', path: '/tables', icon: QrCode, roles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'SERVER'] },
  { name: 'Staff', path: '/staff', icon: Users, roles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN'] }
]

// Filter nav items based on user role
const navItems = computed(() => {
  return allNavItems.filter(item => item.roles.includes(userRole.value))
})

// Get display role name
const displayRole = computed(() => {
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'RESTAURANT_ADMIN': 'Restaurant Admin',
    'SERVER': 'Waiter',
    'KITCHEN': 'Kitchen',
    'STAFF': 'Staff'
  }
  return roleMap[userRole.value] || userRole.value
})

onMounted(() => {
  // Connect to socket and fetch orders for badge
  ordersStore.connectSocket()
  ordersStore.fetchOrders()
})
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
        <span class="flex-1">{{ item.name }}</span>
        <Badge 
          v-if="item.badge && item.badge.value > 0" 
          variant="destructive"
          class="ml-auto text-xs"
        >
          {{ item.badge.value }}
        </Badge>
      </RouterLink>
    </nav>

    <div class="p-4 border-t">
      <div class="flex gap-3 items-center px-3 py-2">
        <div class="flex justify-center items-center w-8 h-8 rounded-full bg-muted">
          <User class="w-4 h-4" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ auth.user?.email || 'User' }}</p>
          <p class="text-xs truncate text-muted-foreground">{{ displayRole }}</p>
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
