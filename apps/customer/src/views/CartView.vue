<script setup lang="ts">
import { useCartStore } from '../stores/cart'
import { useOrderStore } from '../stores/order'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const cart = useCartStore()
const orderStore = useOrderStore()
const router = useRouter()
const note = ref('')
const loading = ref(false)

onMounted(() => {
  // Ensure cart has session loaded
  cart.loadSession()
  
  // Check if we have table session
  if (!cart.tableToken) {
    router.push({ name: 'scan' })
  }
})

async function placeOrder() {
  if (cart.items.length === 0) return
  if (!cart.tableToken) {
    alert('Te rugăm să scanezi mai întâi codul QR de pe masă')
    router.push({ name: 'scan' })
    return
  }

  loading.value = true
  try {
    const order = await orderStore.placeOrder(note.value)
    if (order) {
      router.push({ name: 'order-status', params: { orderId: order.id } })
    }
  } catch (error: any) {
    const errorMessage = error.message || error.response?.data?.error || 'Nu s-a putut plasa comanda. Te rugăm să încerci din nou.'
    alert(errorMessage)
    console.error('Order placement error:', error)
    
    // If token expired, redirect after delay
    if (error.isTokenExpired || errorMessage.includes('Sesiunea a expirat')) {
      setTimeout(() => {
        router.push({ name: 'scan' })
      }, 2000) // 2 second delay to show the message
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <header class="flex sticky top-0 z-10 gap-4 items-center p-4 bg-white shadow-sm">
      <button @click="router.back()" class="font-medium">← Înapoi</button>
      <h1 class="text-lg font-bold">Comanda Ta</h1>
    </header>

    <main class="flex-1 p-4 space-y-6 maxappw">
      <div v-if="cart.items.length === 0" class="py-20 text-center text-gray-500">
        Comanda ta este goală.
      </div>

      <div v-else class="space-y-4">
        <!-- Items -->
        <div v-for="(item, index) in cart.items" :key="`${item.productId}-${index}`" class="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1">
              <h3 class="font-medium">{{ item.name }}</h3>
              <p class="text-sm text-gray-500">${{ item.price }} x {{ item.quantity }}</p>
            </div>
            <div class="flex gap-3 items-center">
              <button @click="cart.removeFromCart(item.productId)" class="flex justify-center items-center w-8 h-8 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200">-</button>
              <span class="w-4 text-center">{{ item.quantity }}</span>
              <button @click="cart.addToCart({ id: item.productId, name: item.name, price: item.price }, item.notes)" class="flex justify-center items-center w-8 h-8 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100">+</button>
            </div>
          </div>
          <!-- Item Notes -->
          <div class="mt-2">
            <input
              :value="item.notes || ''"
              @input="cart.updateItemNotes(item.productId, ($event.target as HTMLInputElement).value)"
              type="text"
              class="p-2 w-full text-sm rounded-md border border-gray-300"
              placeholder="Note pentru acest produs (opțional)"
            />
          </div>
        </div>

        <!-- Total -->
        <div class="pt-4 border-t">
          <div class="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${{ cart.total.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Checkout Form -->
        <div class="pt-4 space-y-4 border-t">
          <div v-if="cart.tableName || cart.tableId" class="p-3 bg-blue-50 rounded-md">
            <p class="text-sm text-blue-800">Masă: {{ cart.tableName || cart.tableId }}</p>
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Note (Opțional)</label>
            <textarea v-model="note" class="p-2 w-full rounded-md border" placeholder="Alergii, sosuri extra..."></textarea>
          </div>
        </div>
      </div>
    </main>

    <footer v-if="cart.items.length > 0" class="sticky bottom-0 p-4 bg-white border-t">
      <button 
        @click="placeOrder" 
        :disabled="loading || !cart.tableToken"
        class="py-3 w-full font-bold text-white bg-green-600 rounded-lg shadow transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading">Se plasează comanda...</span>
        <span v-else>Plasează Comanda - {{ cart.total.toFixed(2) }} RON</span>
      </button>
    </footer>
  </div>
</template>
