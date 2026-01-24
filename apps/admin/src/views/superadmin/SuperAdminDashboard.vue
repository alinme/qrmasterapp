<script setup lang="ts">
import { onMounted } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useSuperAdminStore } from '@/stores/superadmin'
import { Building2, Users, ShoppingCart, Package } from 'lucide-vue-next'

const superAdminStore = useSuperAdminStore()

onMounted(async () => {
  await superAdminStore.fetchStats()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Platform Overview</h2>
      <p class="text-muted-foreground">Monitor all restaurants and users</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Restaurants</CardTitle>
          <Building2 class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ superAdminStore.stats?.restaurants || 0 }}</div>
          <p class="text-xs text-muted-foreground">Total restaurants</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Users</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ superAdminStore.stats?.users || 0 }}</div>
          <p class="text-xs text-muted-foreground">Total users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Orders</CardTitle>
          <ShoppingCart class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ superAdminStore.stats?.orders || 0 }}</div>
          <p class="text-xs text-muted-foreground">Total orders</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Products</CardTitle>
          <Package class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ superAdminStore.stats?.products || 0 }}</div>
          <p class="text-xs text-muted-foreground">Total products</p>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Orders -->
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="!superAdminStore.stats?.recentOrders?.length" class="text-center py-8 text-muted-foreground">
          <p>No recent orders</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="order in superAdminStore.stats.recentOrders"
            :key="order.id"
            class="flex justify-between items-center p-3 rounded-lg hover:bg-accent"
          >
            <div>
              <p class="text-sm font-medium">Order #{{ order.id.slice(0, 8) }}</p>
              <p class="text-xs text-muted-foreground">
                {{ order.restaurant.name }} • Table {{ order.table.name }} • ${{ order.total.toFixed(2) }}
              </p>
            </div>
            <div class="text-xs text-muted-foreground">
              {{ new Date(order.createdAt).toLocaleString() }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
