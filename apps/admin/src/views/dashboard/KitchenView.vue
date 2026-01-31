<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ChefHat, CheckCircle, Play, ArrowLeft } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const ordersStore = useOrdersStore()
const router = useRouter()
const previousOrderCount = ref(0)
const newOrderIds = ref<Set<string>>(new Set())
const flashOrderId = ref<string | null>(null)
const currentTime = ref(Date.now())

// Orders that need to be claimed (PENDING)
const pendingOrders = computed(() => {
  return ordersStore.orders
    .filter(o => o.status === 'PENDING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})

// Orders being prepared with timer
const preparingOrders = computed(() => {
  return ordersStore.orders
    .filter(o => o.status === 'PREPARING')
    .sort((a, b) => {
      // Sort by claimed time if available
      const aTime = a.claimedAt ? new Date(a.claimedAt).getTime() : new Date(a.createdAt).getTime()
      const bTime = b.claimedAt ? new Date(b.claimedAt).getTime() : new Date(b.createdAt).getTime()
      return aTime - bTime
    })
})

// Ready orders
const readyOrders = computed(() => {
  return ordersStore.orders
    .filter(o => o.status === 'READY')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

// All active orders for kitchen
const activeOrders = computed(() => {
  return [...pendingOrders.value, ...preparingOrders.value]
})

// Update timer every second
let timerInterval: number | null = null

function startTimer() {
  timerInterval = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// Format elapsed time
function formatElapsedTime(startTime: string | Date): string {
  const start = new Date(startTime).getTime()
  const elapsed = currentTime.value - start
  const minutes = Math.floor(elapsed / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Get timer color based on elapsed time
function getTimerColor(startTime: string | Date): string {
  const start = new Date(startTime).getTime()
  const elapsed = currentTime.value - start
  const minutes = Math.floor(elapsed / 60000)
  
  if (minutes < 5) return 'text-green-400'
  if (minutes < 10) return 'text-yellow-400'
  if (minutes < 15) return 'text-orange-400'
  return 'text-red-400 animate-pulse'
}

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
      
      // Show toast notification
      toast.info('Comandă nouă în așteptare!', {
        description: `Masă: ${newOrders[0].table?.name || 'N/A'}`,
        duration: 5000
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
  ordersStore.connectSocket()
  await ordersStore.fetchOrders()
  
  // Initialize tracked orders
  activeOrders.value.forEach(order => {
    newOrderIds.value.add(order.id)
  })
  previousOrderCount.value = activeOrders.value.length
  
  // Start the timer
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

async function claimOrder(orderId: string) {
  try {
    await ordersStore.claimOrder(orderId)
    toast.success('Comandă preluată! Începe prepararea.')
  } catch (error) {
    console.error('Failed to claim order', error)
    toast.error('Nu s-a putut prelua comanda')
  }
}

async function markReady(orderId: string) {
  try {
    await ordersStore.updateOrderStatus(orderId, 'READY')
    toast.success('Comandă marcată ca gata!')
  } catch (error) {
    console.error('Failed to mark ready', error)
    toast.error('Nu s-a putut marca comanda ca gata')
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Chiar acum'
  if (diffMins < 60) return `${diffMins}m în urmă`
  return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-4 md:p-8">
    <!-- Header -->
    <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <ChefHat class="w-8 h-8 md:w-10 md:h-10" />
          Bucătărie
        </h1>
        <p class="text-gray-400">
          {{ pendingOrders.length }} în așteptare | 
          {{ preparingOrders.length }} în preparare | 
          {{ readyOrders.length }} gata
        </p>
      </div>
      <div class="flex gap-2">
        <Button
          @click="ordersStore.fetchOrders()"
          variant="outline"
          class="bg-gray-800 hover:bg-gray-700"
          :loading="ordersStore.loading"
        >
          <RefreshCw v-if="!ordersStore.loading" class="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button
          @click="router.push({ name: 'orders' })"
          variant="outline"
          class="bg-gray-800 hover:bg-gray-700"
        >
          <ArrowLeft class="w-4 h-4 mr-2" />
          Înapoi
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="ordersStore.loading && activeOrders.length === 0" class="text-center py-20 text-gray-400">
      <p class="text-2xl">Se încarcă comenzile...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="activeOrders.length === 0 && readyOrders.length === 0" class="text-center py-20 text-gray-400">
      <p class="text-2xl">Nu sunt comenzi active</p>
      <p class="text-sm mt-2">Se așteaptă comenzi noi...</p>
    </div>

    <!-- PENDING Orders Section -->
    <div v-if="pendingOrders.length > 0" class="mb-8">
      <h2 class="text-2xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
        <Clock class="w-6 h-6" />
        În Așteptare ({{ pendingOrders.length }})
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="order in pendingOrders"
          :key="order.id"
          class="bg-gray-800 border-2 border-yellow-500 transition-all duration-300"
          :class="{
            'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse': flashOrderId === order.id
          }"
        >
          <CardHeader class="pb-2">
            <div class="flex justify-between items-start">
              <div>
                <CardTitle class="text-xl">Comandă #{{ order.id.slice(0, 8) }}</CardTitle>
                <p class="text-gray-400 text-sm mt-1">
                  Masă {{ order.table?.name || 'N/A' }} • {{ formatTime(order.createdAt) }}
                </p>
                <div v-if="order.customerName" class="flex items-center gap-2 mt-2">
                  <span class="text-xl">👤</span>
                  <span class="font-semibold text-base">{{ order.customerName }}</span>
                </div>
              </div>
              <Badge class="bg-yellow-500 text-yellow-900 font-bold">
                <Clock class="w-3 h-3 mr-1" />
                AȘTEPTARE
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <!-- Order Items -->
            <div class="space-y-2 mb-4">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="text-lg flex justify-between"
              >
                <span class="font-semibold">
                  {{ item.quantity }}x {{ item.product.name }}
                </span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="order.notes || order.serverNotes" class="mb-4 p-3 bg-gray-700 rounded text-sm">
              <div v-if="order.notes" class="mb-1">
                <strong>Notă client:</strong> {{ order.notes }}
              </div>
              <div v-if="order.serverNotes">
                <strong>Notă server:</strong> {{ order.serverNotes }}
              </div>
            </div>

            <!-- Action -->
            <Button
              @click="claimOrder(order.id)"
              class="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-3 text-lg"
              :loading="ordersStore.isSaving"
            >
              <Play class="w-5 h-5 mr-2" />
              Preia Comanda
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- PREPARING Orders Section -->
    <div v-if="preparingOrders.length > 0" class="mb-8">
      <h2 class="text-2xl font-bold mb-4 text-orange-400 flex items-center gap-2">
        <ChefHat class="w-6 h-6" />
        În Preparare ({{ preparingOrders.length }})
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="order in preparingOrders"
          :key="order.id"
          class="bg-gray-800 border-2 border-orange-500 transition-all duration-300"
        >
          <CardHeader class="pb-2">
            <div class="flex justify-between items-start">
              <div>
                <CardTitle class="text-xl">Comandă #{{ order.id.slice(0, 8) }}</CardTitle>
                <p class="text-gray-400 text-sm mt-1">
                  Masă {{ order.table?.name || 'N/A' }} • {{ formatTime(order.createdAt) }}
                </p>
                <div v-if="order.customerName" class="flex items-center gap-2 mt-2">
                  <span class="text-xl">👤</span>
                  <span class="font-semibold text-base">{{ order.customerName }}</span>
                </div>
              </div>
              <div class="text-right">
                <Badge class="bg-orange-500 text-orange-900 font-bold mb-2">
                  <ChefHat class="w-3 h-3 mr-1" />
                  PREPARARE
                </Badge>
                <!-- Timer -->
                <div 
                  class="text-2xl font-mono font-bold"
                  :class="getTimerColor(order.claimedAt || order.updatedAt)"
                >
                  <Clock class="w-4 h-4 inline mr-1" />
                  {{ formatElapsedTime(order.claimedAt || order.updatedAt) }}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <!-- Order Items -->
            <div class="space-y-2 mb-4">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="text-lg flex justify-between"
              >
                <span class="font-semibold">
                  {{ item.quantity }}x {{ item.product.name }}
                </span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="order.notes || order.serverNotes" class="mb-4 p-3 bg-gray-700 rounded text-sm">
              <div v-if="order.notes" class="mb-1">
                <strong>Notă client:</strong> {{ order.notes }}
              </div>
              <div v-if="order.serverNotes">
                <strong>Notă server:</strong> {{ order.serverNotes }}
              </div>
            </div>

            <!-- Action -->
            <Button
              @click="markReady(order.id)"
              class="w-full bg-green-500 hover:bg-green-600 text-green-900 font-bold py-3 text-lg"
              :loading="ordersStore.isSaving"
            >
              <CheckCircle class="w-5 h-5 mr-2" />
              Marchează Gata
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- READY Orders Section -->
    <div v-if="readyOrders.length > 0">
      <h2 class="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
        <CheckCircle class="w-6 h-6" />
        Gata de Servit ({{ readyOrders.length }})
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="order in readyOrders"
          :key="order.id"
          class="bg-gray-800 border-2 border-green-500 opacity-75"
        >
          <CardHeader class="pb-2">
            <div class="flex justify-between items-start">
              <div>
                <CardTitle class="text-xl">Comandă #{{ order.id.slice(0, 8) }}</CardTitle>
                <p class="text-gray-400 text-sm mt-1">
                  Masă {{ order.table?.name || 'N/A' }} • {{ formatTime(order.createdAt) }}
                </p>
              </div>
              <Badge class="bg-green-500 text-green-900 font-bold">
                <CheckCircle class="w-3 h-3 mr-1" />
                GATA
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <!-- Order Items -->
            <div class="space-y-2">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="text-lg flex justify-between"
              >
                <span class="font-semibold">
                  {{ item.quantity }}x {{ item.product.name }}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
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
