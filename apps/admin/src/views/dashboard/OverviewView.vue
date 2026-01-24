<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { useOrdersStore } from '@/stores/orders'
import { useTablesStore } from '@/stores/tables'
import { 
  DollarSign, 
  Table, 
  Menu as MenuIcon, 
  QrCode,
  TrendingUp,
  Clock
} from 'lucide-vue-next'

const auth = useAuthStore()
const menuStore = useMenuStore()
const ordersStore = useOrdersStore()
const tablesStore = useTablesStore()

onMounted(async () => {
  await Promise.all([
    menuStore.fetchCategories(),
    ordersStore.fetchOrders(),
    tablesStore.fetchTables()
  ])
})

const stats = computed(() => {
  const totalProducts = menuStore.categories.reduce((sum, cat) => sum + (cat.products?.length || 0), 0)
  const totalCategories = menuStore.categories.length
  const totalOrders = ordersStore.orders.length
  const activeOrders = ordersStore.orders.filter(o => ['RECEIVED', 'PREPARING', 'READY'].includes(o.status)).length
  const totalRevenue = ordersStore.orders.reduce((sum, o) => sum + o.total, 0)
  const totalTables = tablesStore.tables.length
  const tablesWithQR = tablesStore.tables.filter(t => t.sessions?.length > 0).length

  return {
    totalProducts,
    totalCategories,
    totalOrders,
    activeOrders,
    totalRevenue,
    totalTables,
    tablesWithQR
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Overview</h2>
      <p class="text-muted-foreground">Welcome back, {{ auth.user?.email }}</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">${{ stats.totalRevenue.toFixed(2) }}</div>
          <p class="text-xs text-muted-foreground">All time revenue</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Orders</CardTitle>
          <Table class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.activeOrders }}</div>
          <p class="text-xs text-muted-foreground">Out of {{ stats.totalOrders }} total orders</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Menu Items</CardTitle>
          <MenuIcon class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalProducts }}</div>
          <p class="text-xs text-muted-foreground">Across {{ stats.totalCategories }} categories</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Tables</CardTitle>
          <QrCode class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.tablesWithQR }}</div>
          <p class="text-xs text-muted-foreground">Active QR codes out of {{ stats.totalTables }} tables</p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="ordersStore.orders.length === 0" class="text-center py-8 text-muted-foreground">
            <p>No recent orders</p>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="order in ordersStore.orders.slice(0, 5)" 
              :key="order.id"
              class="flex justify-between items-center p-2 rounded-lg hover:bg-accent"
            >
              <div>
                <p class="text-sm font-medium">Order #{{ order.id.slice(0, 8) }}</p>
                <p class="text-xs text-muted-foreground">{{ order.table?.name || 'N/A' }} • ${{ order.total.toFixed(2) }}</p>
              </div>
              <div class="text-xs text-muted-foreground">
                <Clock class="inline w-3 h-3 mr-1" />
                {{ new Date(order.createdAt).toLocaleTimeString() }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">Total Orders Today</span>
            <span class="text-lg font-semibold">{{ stats.totalOrders }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">Average Order Value</span>
            <span class="text-lg font-semibold">
              ${{ stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00' }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-muted-foreground">Menu Completion</span>
            <span class="text-lg font-semibold">
              {{ stats.totalCategories > 0 ? Math.round((stats.totalProducts / (stats.totalCategories * 10)) * 100) : 0 }}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
