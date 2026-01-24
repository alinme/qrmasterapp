<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Eye } from 'lucide-vue-next'
import ServerReviewDialog from '@/components/orders/ServerReviewDialog.vue'
import { toast } from 'vue-sonner'

const ordersStore = useOrdersStore()
const selectedStatus = ref<string | null>(null)
const reviewDialogOpen = ref(false)
const selectedOrder = ref<any>(null)

const statusConfig: Record<string, { variant: string; label: string }> = {
  RECEIVED: { variant: 'default', label: 'Received' },
  SERVER_REVIEW: { variant: 'secondary', label: 'Server Review' },
  PREPARING: { variant: 'secondary', label: 'Preparing' },
  READY: { variant: 'default', label: 'Ready' },
  SERVED: { variant: 'secondary', label: 'Served' },
  CANCELLED: { variant: 'destructive', label: 'Cancelled' }
}

const filteredOrders = computed(() => {
  if (!selectedStatus.value) return ordersStore.orders
  return ordersStore.orders.filter(o => o.status === selectedStatus.value)
})

const stats = computed(() => {
  const total = ordersStore.orders.length
  const received = ordersStore.orders.filter(o => o.status === 'RECEIVED').length
  const serverReview = ordersStore.orders.filter(o => o.status === 'SERVER_REVIEW').length
  const preparing = ordersStore.orders.filter(o => o.status === 'PREPARING').length
  const ready = ordersStore.orders.filter(o => o.status === 'READY').length
  const totalRevenue = ordersStore.orders.reduce((sum, o) => sum + o.total, 0)
  
  return { total, received, serverReview, preparing, ready, totalRevenue }
})

onMounted(async () => {
  ordersStore.connectSocket()
  await ordersStore.fetchOrders()
})

async function updateStatus(orderId: string, newStatus: string) {
  try {
    await ordersStore.updateOrderStatus(orderId, newStatus)
    toast.success('Status actualizat')
  } catch (error) {
    console.error('Failed to update status', error)
    toast.error('Eroare la actualizarea statusului')
  }
}

function openReviewDialog(order: any) {
  selectedOrder.value = order
  reviewDialogOpen.value = true
}

async function handleReview(serverNotes: string, sendToKitchen: boolean) {
  if (!selectedOrder.value) return
  try {
    await ordersStore.reviewOrder(selectedOrder.value.id, serverNotes, sendToKitchen)
    toast.success(sendToKitchen ? 'Comandă trimisă la bucătărie' : 'Comandă salvată')
    reviewDialogOpen.value = false
    selectedOrder.value = null
  } catch (error) {
    console.error('Failed to review order', error)
    toast.error('Eroare la revizuirea comenzii')
  }
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Live Orders</h2>
        <p class="mt-1 text-muted-foreground">Manage and track all orders in real-time</p>
      </div>
      <Button @click="ordersStore.fetchOrders()" variant="outline" :disabled="ordersStore.loading">
        <RefreshCw class="mr-2 w-4 h-4" />
        Refresh
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row justify-between items-center pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.total }}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row justify-between items-center pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Received</CardTitle>
          <Badge variant="default">{{ stats.received }}</Badge>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-blue-600">{{ stats.received }}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row justify-between items-center pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Server Review</CardTitle>
          <Badge variant="secondary">{{ stats.serverReview }}</Badge>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-purple-600">{{ stats.serverReview }}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row justify-between items-center pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Preparing</CardTitle>
          <Badge variant="secondary">{{ stats.preparing }}</Badge>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-yellow-600">{{ stats.preparing }}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row justify-between items-center pb-2 space-y-0">
          <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">${{ stats.totalRevenue.toFixed(2) }}</div>
        </CardContent>
      </Card>
    </div>

    <!-- Status Filter -->
    <div class="flex flex-wrap gap-2">
      <Button
        v-for="status in ['RECEIVED', 'SERVER_REVIEW', 'PREPARING', 'READY', 'SERVED']"
        :key="status"
        :variant="selectedStatus === status ? 'default' : 'outline'"
        size="sm"
        @click="selectedStatus = selectedStatus === status ? null : status"
      >
        {{ statusConfig[status]?.label || status || 'Unknown' }}
      </Button>
      <Button
        v-if="selectedStatus"
        variant="ghost"
        size="sm"
        @click="selectedStatus = null"
      >
        Clear Filter
      </Button>
    </div>

    <!-- Orders Table -->
    <Card>
      <CardContent class="p-0">
        <div v-if="ordersStore.loading && ordersStore.orders.length === 0" class="py-20 text-center">
          <div class="inline-block w-8 h-8 rounded-full border-b-2 animate-spin border-primary"></div>
          <p class="mt-4 text-muted-foreground">Loading orders...</p>
        </div>

        <div v-else-if="filteredOrders.length === 0" class="py-20 text-center">
          <p class="text-lg text-muted-foreground">No orders found</p>
          <p class="mt-2 text-sm text-muted-foreground">Orders will appear here when customers place them</p>
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="order in filteredOrders" :key="order.id">
              <TableCell class="font-medium">
                <div>#{{ order.id.slice(0, 8) }}</div>
                <div v-if="order.customerName" class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span v-if="order.customerAvatar" class="text-lg">{{ order.customerAvatar }}</span>
                  <span v-else class="text-lg">{{ order.customerGender === 'female' ? '👩' : '👨' }}</span>
                  <span class="font-medium">{{ order.customerName }}</span>
                </div>
              </TableCell>
              <TableCell>{{ order.table?.name || 'N/A' }}</TableCell>
              <TableCell>
                <div class="space-y-1">
                  <div v-for="item in order.items" :key="item.id" class="text-sm">
                    {{ item.quantity }}x {{ item.product.name }}
                    <span v-if="item.notes" class="ml-2 text-xs italic text-muted-foreground">
                      ({{ item.notes }})
                    </span>
                  </div>
                </div>
                <div v-if="order.notes" class="mt-2 text-xs italic text-muted-foreground">
                  Order Note: {{ order.notes }}
                </div>
              </TableCell>
              <TableCell class="font-semibold">${{ order.total.toFixed(2) }}</TableCell>
              <TableCell>
                <Badge :variant="statusConfig[order.status]?.variant as any">
                  {{ statusConfig[order.status]?.label }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ formatDate(order.createdAt) }}<br>
                {{ formatTime(order.createdAt) }}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex gap-2 justify-end">
                  <Button
                    v-if="order.status === 'SERVER_REVIEW'"
                    size="sm"
                    @click="openReviewDialog(order)"
                    class="bg-purple-600 hover:bg-purple-700"
                  >
                    <Eye class="mr-1 w-4 h-4" />
                    Revizuiește
                  </Button>
                  <Button
                    v-if="order.status === 'PREPARING'"
                    size="sm"
                    variant="secondary"
                    @click="updateStatus(order.id, 'READY')"
                  >
                    Mark Ready
                  </Button>
                  <Button
                    v-if="order.status === 'READY'"
                    size="sm"
                    @click="updateStatus(order.id, 'SERVED')"
                  >
                    Mark Served
                  </Button>
                  <Button
                    v-if="order.status !== 'CANCELLED' && order.status !== 'SERVED'"
                    size="sm"
                    variant="destructive"
                    @click="updateStatus(order.id, 'CANCELLED')"
                  >
                    Cancel
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Server Review Dialog -->
    <ServerReviewDialog
      :open="reviewDialogOpen"
      :order="selectedOrder"
      @update:open="reviewDialogOpen = $event"
      @review="handleReview"
    />
  </div>
</template>
