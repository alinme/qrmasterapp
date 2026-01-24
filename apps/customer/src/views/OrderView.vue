<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useOrderStore } from '../stores/order'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const cart = useCartStore()
const orderId = route.params.orderId as string
const loading = ref(true)

const status = computed(() => orderStore.orderStatus)
const order = computed(() => orderStore.currentOrder)

const stepLabels: Record<string, string> = {
  'RECEIVED': 'PRIMITĂ',
  'SERVER_REVIEW': 'REVIZUIRE',
  'PREPARING': 'SE PREGĂTEȘTE',
  'READY': 'GATA',
  'SERVED': 'SERVITĂ'
}

const stepOrder = ['RECEIVED', 'SERVER_REVIEW', 'PREPARING', 'READY', 'SERVED']
const steps = ['PRIMITĂ', 'REVIZUIRE', 'SE PREGĂTEȘTE', 'GATA', 'SERVITĂ']

function getStepIndex(status: string) {
  const index = stepOrder.indexOf(status)
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
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
        
        <div class="flex justify-between">
           <div v-for="(step, index) in steps" :key="step" class="flex flex-col items-center bg-white">
             <div 
               class="w-4 h-4 rounded-full border-2 transition-colors duration-500"
               :class="getStepIndex(status) >= index ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'"
             ></div>
             <span class="text-xs mt-2 font-medium" :class="getStepIndex(status) >= index ? 'text-green-600' : 'text-gray-400'">{{ step }}</span>
           </div>
        </div>
      </div>
      
      <div class="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
        <p v-if="status === 'RECEIVED'">Am primit comanda ta.</p>
        <p v-if="status === 'SERVER_REVIEW'">Serverul verifică comanda ta.</p>
        <p v-if="status === 'PREPARING'">Bucătăria pregătește mâncarea ta.</p>
        <p v-if="status === 'READY'">Comanda ta este gata!</p>
        <p v-if="status === 'SERVED'">Poftă bună!</p>
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
