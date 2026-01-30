<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrderStore } from '@/stores/order'
import { useCartStore } from '@/stores/cart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, UtensilsCrossed } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()
const cart = useCartStore()
const loading = ref(false)

const statusLabels: Record<string, string> = {
  'RECEIVED': 'Primită',
  'SERVER_REVIEW': 'În revizuire',
  'PREPARING': 'Se pregătește',
  'READY': 'Gata',
  'SERVED': 'Servită',
  'CANCELLED': 'Anulată'
}

const statusDescriptions: Record<string, string> = {
  'RECEIVED': 'Am primit comanda ta.',
  'SERVER_REVIEW': 'Serverul verifică comanda ta.',
  'PREPARING': 'Bucătăria pregătește mâncarea ta.',
  'READY': 'Comanda ta este gata!',
  'SERVED': 'Poftă bună!',
  'CANCELLED': 'Comanda a fost anulată.'
}

const stepOrder = ['RECEIVED', 'SERVER_REVIEW', 'PREPARING', 'READY', 'SERVED']
const steps = ['Primită', 'Revizuire', 'Se pregătește', 'Gata', 'Servită']

// Map SERVER_REVIEW to index 1 in stepOrder
function getStepIndex(status: string) {
  const index = stepOrder.indexOf(status)
  return index >= 0 ? index : 0
}

const currentOrder = computed(() => {
  // Get the most recent active order
  const activeOrders = orderStore.orders
    .filter(o => o.status !== 'SERVED' && o.status !== 'CANCELLED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return activeOrders.length > 0 ? activeOrders[0] : null
})

const status = computed(() => currentOrder.value?.status || 'RECEIVED')
const isReady = computed(() => status.value === 'READY')
const isPreparing = computed(() => status.value === 'PREPARING')
const notificationFlash = ref(false)

// Watch for status changes to trigger visual notifications
watch(() => status.value, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus && (newStatus === 'READY' || newStatus === 'PREPARING')) {
    notificationFlash.value = true
    setTimeout(() => {
      notificationFlash.value = false
    }, 2000)
  }
})

async function loadData() {
  loading.value = true
  try {
    cart.loadSession()
    await orderStore.fetchOrders()
    // Connect socket for real-time updates
    if (cart.tableId) {
      orderStore.connectSocket(cart.tableId)
    }
  } catch (error) {
    console.error('Failed to load orders', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
})

// Watch for order store changes to ensure we have latest data
watch(() => orderStore.orders, async (newOrders, oldOrders) => {
  // Reload if orders list changes significantly
  if (newOrders.length !== (oldOrders?.length || 0)) {
    await loadData()
  }
}, { deep: true })

function orderMore() {
  // Try to get slug from multiple sources
  let slug = cart.restaurantSlug
  
  // If no slug in cart, try to get from current order's restaurant
  if (!slug && currentOrder.value?.restaurant?.slug) {
    slug = currentOrder.value.restaurant.slug
  }
  
  // If still no slug, try from route params
  if (!slug) {
    slug = route.params.slug as string
  }
  
  if (slug) {
    router.push({ name: 'restaurant-menu', params: { slug } })
  } else {
    // Last resort - redirect to scan page
    router.push({ name: 'scan' })
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen pb-20">
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <div v-if="loading" class="py-20 text-center text-gray-500">
        Se încarcă statusul comenzii...
      </div>

      <div v-else-if="!currentOrder" class="py-20 text-center space-y-4">
        <div class="text-gray-400">
          <UtensilsCrossed class="w-16 h-16 mx-auto mb-4 opacity-50" />
        </div>
        <p class="text-lg text-gray-500">Nu ai comenzi active</p>
        <p class="text-sm text-gray-400">Plasează o comandă pentru a vedea statusul</p>
        <Button @click="orderMore">
          Comandă acum
        </Button>
      </div>

      <div v-else class="space-y-6">
        <!-- Order Header -->
        <Card 
          class="relative overflow-visible"
          :class="{
            'ring-4 ring-green-500 ring-opacity-75 animate-pulse': notificationFlash && isReady,
            'ring-4 ring-yellow-500 ring-opacity-50': notificationFlash && isPreparing
          }"
        >
          <!-- Animated notification ring -->
          <div 
            v-if="notificationFlash && (isReady || isPreparing)"
            class="absolute -inset-2 rounded-lg pointer-events-none z-0"
          >
            <div 
              class="absolute inset-0 rounded-lg animate-ping"
              :style="{
                boxShadow: isReady
                  ? '0 0 0 4px rgba(34, 197, 94, 0.5), 0 0 0 8px rgba(34, 197, 94, 0.3), 0 0 0 12px rgba(34, 197, 94, 0.1)'
                  : '0 0 0 4px rgba(234, 179, 8, 0.4), 0 0 0 8px rgba(234, 179, 8, 0.2), 0 0 0 12px rgba(234, 179, 8, 0.1)'
              }"
            ></div>
          </div>
          
          <CardHeader>
            <div class="flex justify-between items-start">
              <div>
                <CardTitle>Comandă #{{ currentOrder.id.slice(0, 8) }}</CardTitle>
                <p class="text-sm text-gray-500 mt-1">
                  {{ new Date(currentOrder.createdAt).toLocaleString('ro-RO') }}
                </p>
              </div>
              <Badge :class="{
                'bg-blue-100 text-blue-800': status === 'RECEIVED',
                'bg-purple-100 text-purple-800': status === 'SERVER_REVIEW',
                'bg-yellow-100 text-yellow-800': status === 'PREPARING',
                'bg-green-100 text-green-800': status === 'READY',
                'bg-gray-100 text-gray-800': status === 'SERVED',
                'bg-red-100 text-red-800': status === 'CANCELLED'
              }">
                {{ statusLabels[status] }}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <!-- Progress Steps -->
        <Card>
          <CardContent class="pt-6">
            <div class="relative">
              <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
              <div class="flex justify-between">
                <div
                  v-for="(step, index) in steps"
                  :key="step"
                  class="flex flex-col items-center bg-white"
                >
                  <div
                    class="w-4 h-4 rounded-full border-2 transition-colors duration-500"
                    :class="getStepIndex(status) >= index ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'"
                  ></div>
                  <span
                    class="text-xs mt-2 font-medium text-center max-w-[60px]"
                    :class="getStepIndex(status) >= index ? 'text-green-600' : 'text-gray-400'"
                  >
                    {{ step }}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Status Message -->
        <Card 
          :class="{
            'ring-4 ring-green-500 ring-opacity-75': isReady && !notificationFlash,
            'ring-4 ring-yellow-500 ring-opacity-50': isPreparing && !notificationFlash
          }"
        >
          <CardContent class="pt-6">
            <div 
              v-if="isReady"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 animate-bounce mb-4 mx-auto block"
            >
              <CheckCircle class="w-5 h-5" />
              <span class="font-bold">Comanda ta este gata!</span>
            </div>
            <div class="p-4 rounded-lg" :class="{
              'bg-blue-50 text-blue-800': status === 'RECEIVED',
              'bg-purple-50 text-purple-800': status === 'SERVER_REVIEW',
              'bg-yellow-50 text-yellow-800': status === 'PREPARING',
              'bg-green-50 text-green-800': status === 'READY',
              'bg-gray-50 text-gray-800': status === 'SERVED',
              'bg-red-50 text-red-800': status === 'CANCELLED'
            }">
              <p>{{ statusDescriptions[status] || 'Comanda ta este în procesare.' }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Order Items -->
        <Card>
          <CardHeader>
            <CardTitle>Produse comandate</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="item in currentOrder.items"
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
            <div v-if="currentOrder.notes" class="pt-2 border-t">
              <p class="text-xs text-gray-600">
                <span class="font-medium">Note:</span> {{ currentOrder.notes }}
              </p>
            </div>
            <div class="flex justify-between pt-2 border-t font-bold">
              <span>Total:</span>
              <span>{{ currentOrder.total.toFixed(2) }} RON</span>
            </div>
          </CardContent>
        </Card>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button variant="outline" @click="orderMore" class="flex-1">
            Comandă mai mult
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
