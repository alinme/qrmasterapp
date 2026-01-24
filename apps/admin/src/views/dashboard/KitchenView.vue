<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useRouter } from 'vue-router'

const ordersStore = useOrdersStore()
const router = useRouter()
const previousOrderCount = ref(0)
const newOrderIds = ref<Set<string>>(new Set())
const flashOrderId = ref<string | null>(null)

const activeOrders = computed(() => {
  return ordersStore.orders.filter(o => 
    o.status === 'PREPARING' || o.status === 'READY'
  ).sort((a, b) => {
    // Sort by status (PREPARING first) then by time
    if (a.status !== b.status) {
      return a.status === 'PREPARING' ? -1 : 1
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
})

// Watch for new orders and trigger alerts
watch(() => activeOrders.value.length, (newCount, oldCount) => {
  if (newCount > oldCount && oldCount > 0) {
    // New order detected
    const newOrders = activeOrders.value.filter(o => 
      !Array.from(newOrderIds.value).includes(o.id)
    )
    
    if (newOrders.length > 0) {
      // Play sound
      playNotificationSound()
      
      // Flash animation
      newOrders.forEach(order => {
        newOrderIds.value.add(order.id)
        flashOrderId.value = order.id
        setTimeout(() => {
          flashOrderId.value = null
        }, 2000)
      })
    }
  }
  
  // Update previous count
  previousOrderCount.value = newCount
  
  // Update tracked order IDs
  activeOrders.value.forEach(order => {
    newOrderIds.value.add(order.id)
  })
})

function playNotificationSound() {
  try {
    // Create audio context for beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800 // Higher pitch for attention
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
    
    // Play second beep after short delay
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()
      
      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)
      
      oscillator2.frequency.value = 600
      oscillator2.type = 'sine'
      
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator2.start(audioContext.currentTime)
      oscillator2.stop(audioContext.currentTime + 0.3)
    }, 200)
  } catch (e) {
    console.log('Audio not available:', e)
  }
}

onMounted(async () => {
  // Request fullscreen
  if (document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen()
    } catch (e) {
      console.log('Fullscreen not available')
    }
  }

  ordersStore.connectSocket()
  await ordersStore.fetchOrders()
  
  // Initialize tracked orders
  activeOrders.value.forEach(order => {
    newOrderIds.value.add(order.id)
  })
  previousOrderCount.value = activeOrders.value.length
})

onUnmounted(() => {
  // Exit fullscreen
  if (document.exitFullscreen) {
    document.exitFullscreen()
  }
})

async function updateStatus(orderId: string, newStatus: string) {
  try {
    await ordersStore.updateOrderStatus(orderId, newStatus)
  } catch (error) {
    console.error('Failed to update status', error)
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-8">
    <!-- Header -->
    <div class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-4xl font-bold mb-2">Kitchen Display</h1>
        <p class="text-gray-400">{{ activeOrders.length }} active orders</p>
      </div>
      <button
        @click="router.push({ name: 'orders' })"
        class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
      >
        Back to Dashboard
      </button>
    </div>

    <!-- Orders Grid -->
    <div v-if="ordersStore.loading && activeOrders.length === 0" class="text-center py-20 text-gray-400">
      Loading orders...
    </div>

    <div v-else-if="activeOrders.length === 0" class="text-center py-20 text-gray-400">
      <p class="text-2xl">No active orders</p>
      <p class="text-sm mt-2">Waiting for new orders...</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="order in activeOrders"
        :key="order.id"
        class="bg-gray-800 rounded-lg p-6 border-2 transition-all duration-500"
        :class="[
          order.status === 'PREPARING' ? 'border-yellow-500' : 'border-green-500',
          flashOrderId === order.id ? 'animate-pulse ring-4 ring-yellow-400 ring-opacity-75' : ''
        ]"
      >
        <!-- Order Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-2xl font-bold">Order #{{ order.id.slice(0, 8) }}</h2>
            <p class="text-gray-400 text-sm mt-1">
              Table {{ order.table?.name || 'N/A' }} • {{ formatTime(order.createdAt) }}
            </p>
            <div v-if="order.customerName" class="flex items-center gap-2 mt-2">
              <span class="text-xl">{{ order.customerGender === 'female' ? '👩' : '👨' }}</span>
              <span class="font-semibold text-base">{{ order.customerName }}</span>
            </div>
          </div>
          <span
            class="px-3 py-1 rounded text-sm font-bold"
            :class="order.status === 'PREPARING' ? 'bg-yellow-500 text-yellow-900' : 'bg-green-500 text-green-900'"
          >
            {{ order.status }}
          </span>
        </div>

        <!-- Order Items -->
        <div class="space-y-3 mb-4">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="text-lg"
          >
            <div class="flex justify-between items-center">
              <span class="font-semibold">
                {{ item.quantity }}x {{ item.product.name }}
              </span>
            </div>
            <div v-if="item.notes" class="mt-1 text-sm text-yellow-300 italic">
              Note: {{ item.notes }}
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="order.notes" class="mb-4 p-3 bg-gray-700 rounded text-sm">
          <strong>Note:</strong> {{ order.notes }}
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            v-if="order.status === 'RECEIVED'"
            @click="updateStatus(order.id, 'PREPARING')"
            class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-3 px-4 rounded-lg text-lg transition"
          >
            Start Preparing
          </button>
          <button
            v-if="order.status === 'PREPARING'"
            @click="updateStatus(order.id, 'READY')"
            class="flex-1 bg-green-500 hover:bg-green-600 text-green-900 font-bold py-3 px-4 rounded-lg text-lg transition"
          >
            Mark Ready
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Large typography for kitchen display */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
