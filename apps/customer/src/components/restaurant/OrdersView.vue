<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order'
import { useCartStore } from '@/stores/cart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, ChefHat, UtensilsCrossed, Plus } from 'lucide-vue-next'

const router = useRouter()
const orderStore = useOrderStore()
const cart = useCartStore()
const loading = ref(false)

const statusLabels: Record<string, string> = {
  'RECEIVED': 'Primită',
  'PREPARING': 'Se pregătește',
  'READY': 'Gata',
  'SERVED': 'Servită',
  'CANCELLED': 'Anulată'
}

const statusColors: Record<string, string> = {
  'RECEIVED': 'bg-blue-100 text-blue-800',
  'PREPARING': 'bg-yellow-100 text-yellow-800',
  'READY': 'bg-green-100 text-green-800',
  'SERVED': 'bg-gray-100 text-gray-800',
  'CANCELLED': 'bg-red-100 text-red-800'
}

const statusIcons: Record<string, any> = {
  'RECEIVED': Clock,
  'PREPARING': ChefHat,
  'READY': CheckCircle,
  'SERVED': UtensilsCrossed,
  'CANCELLED': Clock
}

onMounted(async () => {
  loading.value = true
  try {
    await orderStore.fetchOrders()
  } catch (error) {
    console.error('Failed to load orders', error)
  } finally {
    loading.value = false
  }
})

function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function viewOrder(orderId: string) {
  router.push({ name: 'order-status', params: { orderId } })
}

function orderMore() {
  // Navigate back to menu
  if (cart.restaurantSlug) {
    router.push({ name: 'restaurant-menu', params: { slug: cart.restaurantSlug } })
  }
}
</script>

<template>
  <div class="flex flex-col h-full pb-20">
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="loading" class="py-20 text-center text-gray-500">
        Se încarcă comenzile...
      </div>

      <div v-else-if="orderStore.orders.length === 0" class="py-20 text-center space-y-4">
        <div class="text-gray-400">
          <UtensilsCrossed class="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <p class="text-lg text-gray-500">Nu ai comenzi</p>
        <p class="text-sm text-gray-400">Plasează prima ta comandă din meniu</p>
        <Button @click="orderMore" class="mt-4">
          <Plus class="mr-2 w-4 h-4" />
          Comandă acum
        </Button>
      </div>

      <div v-else class="space-y-4">
        <Card
          v-for="order in orderStore.orders"
          :key="order.id"
          class="hover:shadow-md transition-shadow"
        >
          <CardHeader>
            <div class="flex justify-between items-start">
              <div>
                <CardTitle class="text-lg">Comandă #{{ order.id.slice(0, 8) }}</CardTitle>
                <p class="text-sm text-gray-500 mt-1">{{ formatDate(order.createdAt) }}</p>
              </div>
              <Badge :class="statusColors[order.status] || 'bg-gray-100 text-gray-800'">
                <component
                  :is="statusIcons[order.status] || Clock"
                  class="mr-1 w-3 h-3"
                />
                {{ statusLabels[order.status] || order.status }}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <!-- Order Items -->
            <div class="space-y-2">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex justify-between text-sm"
              >
                <div class="flex-1">
                  <span class="font-medium">{{ item.quantity }}x {{ item.product.name }}</span>
                  <p v-if="item.notes" class="text-xs text-gray-500 mt-0.5">{{ item.notes }}</p>
                </div>
                <span class="text-gray-700 ml-4">
                  {{ (item.priceSnapshot * item.quantity).toFixed(2) }} RON
                </span>
              </div>
            </div>

            <!-- Order Notes -->
            <div v-if="order.notes" class="pt-2 border-t">
              <p class="text-xs text-gray-600">
                <span class="font-medium">Note:</span> {{ order.notes }}
              </p>
            </div>

            <!-- Total -->
            <div class="flex justify-between pt-2 border-t font-bold">
              <span>Total:</span>
              <span>{{ order.total.toFixed(2) }} RON</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                @click="viewOrder(order.id)"
                class="flex-1"
              >
                Vezi detalii
              </Button>
              <Button
                v-if="order.status !== 'SERVED' && order.status !== 'CANCELLED'"
                size="sm"
                @click="orderMore"
                class="flex-1"
              >
                <Plus class="mr-1 w-4 h-4" />
                Comandă mai mult
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
