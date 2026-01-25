<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Receipt } from 'lucide-vue-next'
import { useOrderStore } from '@/stores/order'
import CheckBillView from './CheckBillView.vue'

const props = defineProps<{
  open: boolean
  items: any[]
  total: number
  placingOrder: boolean
  tableId?: string | null
  tableName?: string | null
  hasTableToken: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'place-order': [note: string]
  'remove-item': [productId: string]
  'add-item': [product: any]
}>()

const router = useRouter()
const orderStore = useOrderStore()
const orderNote = ref('')

const statusLabels: Record<string, string> = {
  'RECEIVED': 'Primită',
  'SERVER_REVIEW': 'În revizuire',
  'PREPARING': 'Se pregătește',
  'READY': 'Gata',
  'SERVED': 'Servită',
  'CANCELLED': 'Anulată'
}

const statusColors: Record<string, string> = {
  'RECEIVED': 'bg-blue-100 text-blue-800',
  'SERVER_REVIEW': 'bg-purple-100 text-purple-800',
  'PREPARING': 'bg-yellow-100 text-yellow-800',
  'READY': 'bg-green-100 text-green-800',
  'SERVED': 'bg-gray-100 text-gray-800',
  'CANCELLED': 'bg-red-100 text-red-800'
}

const showCheckBill = ref(false)
const hasServedOrders = computed(() => {
  return orderStore.orders.some((o: any) => o.status === 'SERVED')
})

async function loadData() {
  // Always fetch orders when drawer opens
  await orderStore.fetchOrders()
  // Show check bill if there are served orders and cart is empty
  if (props.items.length === 0 && hasServedOrders.value) {
    showCheckBill.value = true
  }
}

onMounted(async () => {
  if (props.open) {
    await loadData()
  }
})

// Watch for drawer open to fetch data
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await loadData()
  }
})

// Watch for order changes to update served orders status
watch(() => orderStore.orders, () => {
  if (hasServedOrders.value && !showCheckBill.value && props.items.length === 0) {
    showCheckBill.value = true
  }
}, { deep: true })

function placeOrder() {
  emit('place-order', orderNote.value)
  orderNote.value = ''
}

function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function viewOrder(orderId: string) {
  router.push({ name: 'order-status', params: { orderId } })
  emit('update:open', false)
}
</script>

<template>
  <Drawer :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="mx-auto max-w-md flex flex-col max-h-[99vh] min-h-[90vh]">
      <DrawerHeader class="shrink-0">
        <DrawerTitle>Comanda Ta</DrawerTitle>
      </DrawerHeader>
      <div class="overflow-y-auto flex-1 px-4 pb-4 min-h-full">
        <div v-if="items.length === 0" class="space-y-4">
          <!-- Check Bill Section (only when served orders exist) -->
          <div v-if="hasServedOrders" class="space-y-3">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <Receipt class="w-5 h-5 text-green-600" />
                Notă de Plată
              </h3>
              <Button
                variant="outline"
                size="sm"
                @click="showCheckBill = !showCheckBill"
              >
                {{ showCheckBill ? 'Ascunde' : 'Vezi Nota' }}
              </Button>
            </div>
            <div v-if="showCheckBill">
              <CheckBillView :open="showCheckBill" />
            </div>
          </div>

          <!-- Orders History -->
          <div v-if="orderStore.orders.length > 0" class="space-y-3">
            <h3 class="text-lg font-semibold">Istoric Comenzi</h3>
            <Card
              v-for="order in orderStore.orders"
              :key="order.id"
              class="hover:shadow-md transition-shadow cursor-pointer"
              @click="viewOrder(order.id)"
            >
              <CardHeader class="pb-3">
                <div class="flex justify-between items-start">
                  <div>
                    <CardTitle class="text-base">Comandă #{{ order.id.slice(0, 8) }}</CardTitle>
                    <p class="text-xs text-gray-500 mt-1">{{ formatDate(order.createdAt) }}</p>
                  </div>
                  <Badge :class="statusColors[order.status] || 'bg-gray-100 text-gray-800'">
                    {{ statusLabels[order.status] || order.status }}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent class="pt-0 space-y-2">
                <div
                  v-for="item in order.items.slice(0, 3)"
                  :key="item.id"
                  class="flex justify-between text-sm"
                >
                  <span>{{ item.quantity }}x {{ item.product.name }}</span>
                  <span class="text-gray-600">{{ (item.priceSnapshot * item.quantity).toFixed(2) }} RON</span>
                </div>
                <div v-if="order.items.length > 3" class="text-xs text-gray-500 pt-1">
                  +{{ order.items.length - 3 }} {{ order.items.length - 3 === 1 ? 'produs' : 'produse' }} mai mult
                </div>
                <div class="flex justify-between pt-2 border-t font-semibold">
                  <span>Total:</span>
                  <span>{{ order.total.toFixed(2) }} RON</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div v-else class="py-20 text-center text-gray-500">
            <p>Comanda ta este goală.</p>
            <p class="text-sm mt-2">Nu ai comenzi anterioare.</p>
          </div>
        </div>
        <div v-else class="space-y-4">
          <!-- Items -->
          <div v-for="item in items" :key="item.productId" class="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
            <div>
              <h3 class="font-medium">{{ item.name }}</h3>
              <p class="text-sm text-gray-500">{{ item.price.toFixed(2) }} RON x {{ item.quantity }}</p>
            </div>
            <div class="flex gap-3 items-center">
              <Button 
                variant="outline"
                size="icon"
                aria-label="Elimină produs"
                @click="$emit('remove-item', item.productId)" 
                class="w-8 h-8 rounded-full"
              >
                <Minus class="w-4 h-4" />
              </Button>
              <span class="w-4 text-center">{{ item.quantity }}</span>
              <Button 
                variant="outline"
                size="icon"
                aria-label="Adaugă produs"
                @click="$emit('add-item', { id: item.productId, name: item.name, price: item.price })" 
                class="w-8 h-8 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 hover:text-blue-700"
              >
                <Plus class="w-4 h-4" />
              </Button>
            </div>
          </div>

          <!-- Total -->
          <div class="pt-4 border-t">
            <div class="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{{ total.toFixed(2) }} RON</span>
            </div>
          </div>

          <!-- Checkout Form -->
          <div class="pt-4 space-y-4 border-t">
            <div v-if="tableName || tableId" class="p-3 bg-blue-50 rounded-md">
              <p class="text-sm text-blue-800">Masă: {{ tableName || tableId }}</p>
            </div>
            <div>
              <label class="block mb-1 text-sm font-medium text-gray-700">Note (Opțional)</label>
              <textarea 
                v-model="orderNote" 
                class="p-2 w-full rounded-md border" 
                placeholder="Alergii, sosuri extra..."
                rows="3"
              />
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter class="shrink-0">
        <Button 
          v-if="items.length > 0"
          @click="placeOrder" 
          :disabled="placingOrder || !hasTableToken"
          class="py-3 w-full font-bold text-white bg-green-600 transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          <span v-if="placingOrder">Se plasează comanda...</span>
          <span v-else>Plasează Comanda - {{ total.toFixed(2) }} RON</span>
        </Button>
        <DrawerClose as-child>
          <Button class="w-full text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200">Închide</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>

