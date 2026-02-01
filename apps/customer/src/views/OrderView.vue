<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useOrderStore } from '../stores/order'
import { useCartStore } from '../stores/cart'
import { Inbox, Search, ChefHat, CircleCheck, UtensilsCrossed } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const cart = useCartStore()
const orderId = route.params.orderId as string
const loading = ref(true)

const status = computed(() => orderStore.orderStatus)
const order = computed(() => orderStore.currentOrder)

const stepOrder = ['RECEIVED', 'SERVER_REVIEW', 'PREPARING', 'READY', 'SERVED']
const stepIcons = [
  { icon: Inbox, label: 'Primită' },
  { icon: Search, label: 'Revizuire' },
  { icon: ChefHat, label: 'Pregătire' },
  { icon: CircleCheck, label: 'Gata' },
  { icon: UtensilsCrossed, label: 'Servită' }
]

function getStepIndex(s: string) {
  const index = stepOrder.indexOf(s)
  return index >= 0 ? index : 0
}

async function loadOrderData() {
  loading.value = true
  // Load cart session
  cart.loadSession()
  
  try {
    await orderStore.fetchOrder(orderId)
    // Also fetch all orders to ensure we have latest data
    await orderStore.fetchOrders()
    // Connect socket for real-time updates
    if (cart.tableId) {
      orderStore.connectSocket(cart.tableId)
    }
  } catch (error) {
    console.error('Failed to load order', error)
    alert('Comanda nu a fost găsită')
    router.push({ name: 'scan' })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadOrderData()
})

// Watch for route changes to reload
watch(() => route.params.orderId, async (newOrderId) => {
  if (newOrderId) {
    await loadOrderData()
  }
})

onUnmounted(() => {
  // Don't disconnect socket - keep listening for updates
  // orderStore.disconnectSocket()
})
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-8">
      <div v-if="loading" class="text-gray-500">Se încarcă comanda...</div>
    
    <div v-else>
      <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Comandă Plasată!</h1>
      <p class="text-gray-500">Comanda #{{ orderId.slice(0, 8) }}</p>
      <p v-if="order?.table" class="text-sm text-gray-400 mt-1">Masă: {{ order.table.name }}</p>
      <p v-if="order?.table?.server" class="text-sm text-gray-400 mt-1">Server: {{ order.table.server.email.split('@')[0] }}</p>
    </div>

    <div v-if="!loading" class="w-full max-w-sm space-y-8">
      <div class="relative">
        <!-- Progress Bar Background -->
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
        
        <div class="flex justify-between">
           <div v-for="(step, index) in stepIcons" :key="index" class="flex flex-col items-center bg-white flex-1 min-w-0">
             <div 
               class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-500 shrink-0"
               :class="getStepIndex(status) >= index ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'"
             >
               <component :is="step.icon" class="w-4 h-4" />
             </div>
             <span class="text-[10px] mt-1.5 font-medium truncate w-full px-0.5" :class="getStepIndex(status) >= index ? 'text-green-600' : 'text-gray-400'" :title="step.label">{{ step.label }}</span>
           </div>
        </div>
      </div>
      
      <div class="flex items-center gap-3 p-3 rounded-lg text-sm min-w-0" :class="{
        'bg-blue-50 text-blue-800': status === 'RECEIVED',
        'bg-purple-50 text-purple-800': status === 'SERVER_REVIEW',
        'bg-yellow-50 text-yellow-800': status === 'PREPARING',
        'bg-green-50 text-green-800': status === 'READY',
        'bg-gray-50 text-gray-800': status === 'SERVED'
      }">
        <component :is="stepIcons[Math.min(getStepIndex(status), stepIcons.length - 1)]?.icon ?? Inbox" class="w-5 h-5 shrink-0 flex-shrink-0" />
        <p class="truncate min-w-0">
          <span v-if="status === 'RECEIVED'">Am primit comanda ta.</span>
          <span v-if="status === 'SERVER_REVIEW'">Serverul verifică comanda ta.</span>
          <span v-if="status === 'PREPARING'">Bucătăria pregătește mâncarea ta.</span>
          <span v-if="status === 'READY'">Comanda ta este gata!</span>
          <span v-if="status === 'SERVED'">Poftă bună!</span>
        </p>
      </div>

      <!-- Order Items -->
      <div v-if="order?.items" class="text-left space-y-2">
        <h3 class="font-semibold mb-2">Produse comandate:</h3>
        <div v-for="item in order.items" :key="item.id" class="flex justify-between text-sm">
          <span>{{ item.quantity }}x {{ item.product.name }}</span>
          <span>{{ (item.priceSnapshot * item.quantity).toFixed(2) }} RON</span>
        </div>
        <div class="border-t pt-2 mt-2 flex justify-between font-bold">
          <span>Total:</span>
          <span>{{ order.total.toFixed(2) }} RON</span>
        </div>
      </div>
    </div>

    <router-link 
      v-if="cart.restaurantSlug && !loading" 
      :to="{ name: 'restaurant-menu', params: { slug: cart.restaurantSlug } }" 
      class="text-blue-600 hover:underline"
    >
      Înapoi la Meniu
    </router-link>
  </div>
</template>
