<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useBillsStore } from '@/stores/bills'
import { useCartStore } from '@/stores/cart'
import { useOrderStore } from '@/stores/order'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NumberField, NumberFieldContent, NumberFieldInput, NumberFieldIncrement, NumberFieldDecrement } from '@/components/ui/number-field'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Receipt, DollarSign, CheckCircle2, User, CreditCard, Banknote } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const props = withDefaults(defineProps<{
  open?: boolean
}>(), {
  open: true
})

const billsStore = useBillsStore()
const cart = useCartStore()
const orderStore = useOrderStore()
const selectedOrders = ref<string[]>([])
const tipPercentage = ref<number>(0) // 0 = no tip, 10 = 10%, 20 = 20%, etc.
const customTipAmount = ref<number>(0) // For custom tip drawer input (always starts at 0)
const customTipDrawerOpen = ref(false)
const currentTipTab = ref<string>('0') // Track which tab is selected
const justAppliedCustomTip = ref(false) // Flag to prevent watcher from resetting
const lastCustomTipPercentage = ref<number | null>(null) // Store the last custom tip percentage
const processing = ref(false)
const paymentType = ref<'CASH' | 'POS'>('CASH')
const serverInfo = ref<{ id: string; email: string } | null>(null)

// Show ALL SERVED orders (including paid ones) - we need to see the full bill
const servedOrders = computed(() => {
  if (!billsStore.tableBill) return []
  return billsStore.tableBill.orders.filter((o: any) => o.status === 'SERVED')
})

// Orders that can be selected for payment (only unpaid or partially paid)
const selectableOrders = computed(() => {
  return servedOrders.value.filter((o: any) => {
    const paid = o.payments?.reduce((sum: number, p: any) => sum + p.total, 0) || 0
    return paid < o.total // Only orders with remaining balance can be selected
  })
})

const hasServedOrders = computed(() => servedOrders.value.length > 0)

const myServedOrders = computed(() => {
  return servedOrders.value.filter((o: any) => o.deviceId === cart.deviceId)
})

const otherServedOrders = computed(() => {
  return servedOrders.value.filter((o: any) => o.deviceId !== cart.deviceId)
})

// Helper to check if order is fully paid
const isOrderFullyPaid = (order: any) => {
  const paid = order.payments?.reduce((sum: number, p: any) => sum + p.total, 0) || 0
  return paid >= order.total
}

async function loadServerInfo() {
  if (!cart.tableId) return
  
  try {
    const response = await axios.get(`${API_URL}/public/tables/${cart.tableId}/server`)
    if (response.data.success) {
      serverInfo.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load server info', error)
    serverInfo.value = null
  }
}

async function loadBill() {
  if (!cart.tableToken) return
  
  // Don't reset tip if we just applied a custom tip
  if (justAppliedCustomTip.value) {
    return
  }
  
  // Preserve tip percentage and tab before loading
  const preservedTipPercentage = tipPercentage.value
  const preservedTipTab = currentTipTab.value
  
  try {
    await billsStore.fetchTableBill()
    await loadServerInfo()
    // Auto-select current device's served orders that are not fully paid
    if (hasServedOrders.value && selectedOrders.value.length === 0) {
      const myUnpaidOrders = myServedOrders.value.filter((o: any) => !isOrderFullyPaid(o))
      selectedOrders.value = myUnpaidOrders.map((o: any) => o.id)
    }
    
    // Restore tip percentage and tab (don't reset user input)
    tipPercentage.value = preservedTipPercentage
    currentTipTab.value = preservedTipTab
  } catch (error) {
    console.error('Failed to fetch table bill', error)
  }
}

onMounted(async () => {
  await loadBill()
  // Also fetch orders to ensure we have latest status
  await orderStore.fetchOrders()
  
  // Ensure socket is connected for real-time updates
  // The order store will handle payment_processed events automatically
  if (cart.tableId) {
    orderStore.connectSocket(cart.tableId)
  }
})

// Watch tipPercentage to prevent it from being reset after custom tip is applied
watch(() => tipPercentage.value, (newValue, oldValue) => {
  // If we just applied a custom tip and it's being reset to a preset value, restore it
  if (justAppliedCustomTip.value && lastCustomTipPercentage.value !== null) {
    if (newValue !== lastCustomTipPercentage.value && ['0', '10', '20', '30'].includes(String(newValue))) {
      // Something tried to reset it, restore the custom value
      tipPercentage.value = lastCustomTipPercentage.value
      currentTipTab.value = 'custom'
    }
  }
})

// Watch for order changes to refresh bill when payment is processed
watch(() => orderStore.orders, async () => {
  // Don't reset tip if we just applied a custom tip
  if (justAppliedCustomTip.value) {
    return
  }
  await loadBill()
}, { deep: true })

// Watch for open prop to refresh when component becomes visible
watch(() => props.open, async (isOpen) => {
  if (isOpen !== false) {
    await loadBill()
    await orderStore.fetchOrders()
  }
}, { immediate: true })

const selectedOrdersTotal = computed(() => {
  if (!billsStore.tableBill) return 0
  
  return servedOrders.value
    .filter((o: any) => selectedOrders.value.includes(o.id) && !isOrderFullyPaid(o))
    .reduce((sum: number, order: any) => {
      const paid = order.payments?.reduce((pSum: number, p: any) => pSum + p.total, 0) || 0
      return sum + (order.total - paid)
    }, 0)
})

// Watcher to calculate tip amount when percentage changes
const tipAmount = computed(() => {
  if (tipPercentage.value > 0 && selectedOrdersTotal.value > 0) {
    return (selectedOrdersTotal.value * tipPercentage.value) / 100
  }
  return 0
})

const totalWithTip = computed(() => {
  return selectedOrdersTotal.value + tipAmount.value
})

function toggleOrder(orderId: string) {
  const order = servedOrders.value.find((o: any) => o.id === orderId)
  if (!order) return
  
  // Don't allow selecting fully paid orders
  if (isOrderFullyPaid(order)) {
    toast.error('Această comandă este deja plătită complet')
    return
  }
  
  const index = selectedOrders.value.indexOf(orderId)
  if (index > -1) {
    selectedOrders.value.splice(index, 1)
  } else {
    selectedOrders.value.push(orderId)
  }
}

function selectMyOrders() {
  // Only select unpaid orders
  selectedOrders.value = myServedOrders.value
    .filter((o: any) => !isOrderFullyPaid(o))
    .map((o: any) => o.id)
}

function selectAllServedOrders() {
  // Only select unpaid orders
  selectedOrders.value = selectableOrders.value.map((o: any) => o.id)
}

function handleTipSelection(value: string) {
  // Don't allow changing tip if we just applied a custom one (prevent reactive resets)
  if (justAppliedCustomTip.value && value !== 'custom' && currentTipTab.value === 'custom') {
    // Restore the custom tip percentage if something tries to reset it
    if (lastCustomTipPercentage.value !== null) {
      tipPercentage.value = lastCustomTipPercentage.value
    }
    return
  }
  
  currentTipTab.value = value
  
  if (value === 'custom') {
    // Reset custom amount to 0 when opening drawer
    customTipAmount.value = 0
    customTipDrawerOpen.value = true
  } else {
    // Clear the flag when user explicitly selects a different tip
    justAppliedCustomTip.value = false
    lastCustomTipPercentage.value = null
    // Set tip percentage directly
    tipPercentage.value = Number(value)
  }
}

function applyCustomTip() {
  if (customTipAmount.value > 0 && selectedOrdersTotal.value > 0) {
    // Calculate the percentage that the custom amount represents
    const calculatedPercentage = (customTipAmount.value / selectedOrdersTotal.value) * 100
    // Round to nearest integer
    const roundedPercentage = Math.round(calculatedPercentage)
    
    // Set flag and store the custom percentage
    justAppliedCustomTip.value = true
    lastCustomTipPercentage.value = roundedPercentage
    
    // Set the tip percentage and tab
    tipPercentage.value = roundedPercentage
    currentTipTab.value = 'custom'
    
    // Close drawer and reset custom amount
    customTipDrawerOpen.value = false
    customTipAmount.value = 0
    
    // Clear flag after longer delay to prevent any resets
    setTimeout(() => {
      justAppliedCustomTip.value = false
    }, 5000)
  }
}

const hasMultipleOrders = computed(() => selectableOrders.value.length > 1)


async function processPayment() {
  if (selectedOrders.value.length === 0) {
    toast.error('Te rugăm să selectezi cel puțin o comandă')
    return
  }

  if (selectedOrdersTotal.value <= 0) {
    toast.error('Comenzile selectate sunt deja plătite')
    return
  }

  if (!paymentType.value) {
    toast.error('Te rugăm să selectezi tipul de plată (Numerar sau POS)')
    return
  }

  processing.value = true
  try {
    await billsStore.requestBill({
      orderIds: selectedOrders.value,
      amount: selectedOrdersTotal.value,
      tipType: 'PERCENTAGE',
      tipValue: tipPercentage.value > 0 ? tipPercentage.value : null,
      paymentType: paymentType.value
    })
    
    toast.success(
      paymentType.value === 'CASH' 
        ? 'Serverul a fost notificat să aducă nota de plată (Numerar)'
        : 'Serverul a fost notificat să aducă POS-ul'
    )
    
    // Refresh bill to show updated payment status
    await loadBill()
    
    // Clear selection
    selectedOrders.value = []
    tipPercentage.value = 0
    paymentType.value = 'CASH'
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Cererea nu a putut fi trimisă')
  } finally {
    processing.value = false
  }
}

function getOrderRemaining(order: any) {
  const paid = order.payments?.reduce((sum: number, p: any) => sum + p.total, 0) || 0
  return order.total - paid
}
</script>

<template>
  <div v-if="!hasServedOrders" class="py-8 text-center text-muted-foreground">
    <p>Nu există comenzi servite pentru plată.</p>
    <p class="mt-2 text-sm">Comenzile servite vor apărea aici.</p>
  </div>

  <div v-else class="space-y-4">
    <!-- Summary Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex gap-2 items-center">
          <Receipt class="w-5 h-5" />
          <span>Masă: {{ billsStore.tableBill?.table?.name || 'N/A' }}</span>
          <Badge class="ml-auto bg-green-600">
            {{ servedOrders.length }} {{ servedOrders.length === 1 ? 'comandă servită' : 'comenzi servite' }}
          </Badge>
        </CardTitle>
        <div v-if="serverInfo" class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <User class="w-4 h-4" />
          <span>Server: {{ serverInfo.email.split('@')[0] }}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-muted-foreground">Total Notă</p>
            <p class="text-2xl font-bold">{{ billsStore.tableBill?.totalBill?.toFixed(2) || '0.00' }} RON</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Selectat</p>
            <p class="text-2xl font-bold text-blue-600">{{ selectedOrdersTotal.toFixed(2) }} RON</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Quick Selection -->
    <div v-if="hasMultipleOrders" class="flex gap-2">
      <Button variant="outline" size="sm" @click="selectMyOrders">
        Selectează Comenzile Mele
      </Button>
      <Button variant="outline" size="sm" @click="selectAllServedOrders">
        Selectează Tot
      </Button>
    </div>

    <!-- My Served Orders -->
    <Card v-if="myServedOrders.length > 0">
      <CardHeader>
        <CardTitle class="flex gap-2 items-center text-lg">
          <CheckCircle2 class="w-5 h-5 text-green-600" />
          Comenzile Mele (Servite)
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        <div
          v-for="order in myServedOrders"
          :key="order.id"
          class="flex justify-between items-center p-3 rounded-lg border"
          :class="{ 
            'bg-blue-50 border-blue-300 cursor-pointer hover:bg-blue-100': !isOrderFullyPaid(order) && selectedOrders.includes(order.id),
            'cursor-pointer hover:bg-gray-50': !isOrderFullyPaid(order),
            'bg-gray-100 border-gray-300 opacity-75 cursor-not-allowed': isOrderFullyPaid(order)
          }"
          @click="!isOrderFullyPaid(order) && toggleOrder(order.id)"
        >
          <div class="flex-1">
            <div class="flex gap-2 items-center">
              <input
                type="checkbox"
                :checked="selectedOrders.includes(order.id)"
                :disabled="isOrderFullyPaid(order)"
                @change="toggleOrder(order.id)"
                @click.stop
              />
              <div>
                <p class="font-medium">Comandă #{{ order.id.slice(0, 8) }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ order.items.length }} {{ order.items.length === 1 ? 'produs' : 'produse' }}
                </p>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold">{{ order.total.toFixed(2) }} RON</p>
            <p v-if="!isOrderFullyPaid(order)" class="text-xs text-green-600">
              Rămas: {{ getOrderRemaining(order).toFixed(2) }} RON
            </p>
            <Badge v-if="isOrderFullyPaid(order)" variant="default" class="mt-1 bg-green-600">
              Plătit Complet
            </Badge>
            <Badge v-else-if="order.paymentStatus === 'PARTIALLY_PAID'" variant="secondary" class="mt-1">
              Parțial Plătit
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Other Served Orders -->
    <Card v-if="otherServedOrders.length > 0">
      <CardHeader>
        <CardTitle class="text-lg">Alte Comenzi Servite la Masă</CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        <div
          v-for="order in otherServedOrders"
          :key="order.id"
          class="flex justify-between items-center p-3 rounded-lg border"
          :class="{ 
            'bg-blue-50 border-blue-300 cursor-pointer hover:bg-blue-100': !isOrderFullyPaid(order) && selectedOrders.includes(order.id),
            'cursor-pointer hover:bg-gray-50': !isOrderFullyPaid(order),
            'bg-gray-100 border-gray-300 opacity-75 cursor-not-allowed': isOrderFullyPaid(order)
          }"
          @click="!isOrderFullyPaid(order) && toggleOrder(order.id)"
        >
          <div class="flex-1">
            <div class="flex gap-2 items-center">
              <input
                type="checkbox"
                :checked="selectedOrders.includes(order.id)"
                :disabled="isOrderFullyPaid(order)"
                @change="toggleOrder(order.id)"
                @click.stop
              />
              <div>
                <p class="font-medium">Comandă #{{ order.id.slice(0, 8) }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ order.items.length }} {{ order.items.length === 1 ? 'produs' : 'produse' }}
                </p>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold">{{ order.total.toFixed(2) }} RON</p>
            <p v-if="!isOrderFullyPaid(order)" class="text-xs text-green-600">
              Rămas: {{ getOrderRemaining(order).toFixed(2) }} RON
            </p>
            <Badge v-if="isOrderFullyPaid(order)" variant="default" class="mt-1 bg-green-600">
              Plătit Complet
            </Badge>
            <Badge v-else-if="order.paymentStatus === 'PARTIALLY_PAID'" variant="secondary" class="mt-1">
              Parțial Plătit
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Payment Section -->
    <Card v-if="selectedOrders.length > 0 && selectedOrdersTotal > 0">
      <CardHeader>
        <CardTitle>Plată</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label>Subtotal</Label>
          <p class="text-xl font-bold">{{ selectedOrdersTotal.toFixed(2) }} RON</p>
        </div>

        <div>
          <Label class="mb-2 block">Tip de Plată</Label>
          <Tabs :model-value="paymentType || undefined" @update:model-value="(value: string | number) => paymentType = String(value) as 'CASH' | 'POS'">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="CASH" class="flex items-center gap-2">
                <DollarSign class="w-4 h-4" />
                Numerar
              </TabsTrigger>
              <TabsTrigger value="POS" class="flex items-center gap-2">
                <CreditCard class="w-4 h-4" />
                Card
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <Label class="mb-2 block">Bacșiș</Label>
          <Tabs 
            :model-value="currentTipTab"
            @update:model-value="(value: string | number) => handleTipSelection(String(value))"
          >
            <TabsList class="grid w-full grid-cols-5">
              <TabsTrigger value="0" class="flex items-center justify-center gap-1">
                0%
              </TabsTrigger>
              <TabsTrigger value="10" class="flex items-center justify-center gap-1">
                10%
              </TabsTrigger>
              <TabsTrigger value="20" class="flex items-center justify-center gap-1">
                20%
              </TabsTrigger>
              <TabsTrigger value="30" class="flex items-center justify-center gap-1">
                30%
              </TabsTrigger>
              <TabsTrigger value="custom" class="flex items-center justify-center gap-1">
                <Banknote class="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div v-if="tipAmount > 0" class="p-3 bg-blue-50 rounded-lg">
          <div class="flex justify-between text-sm">
            <span>Bacșiș:</span>
            <span class="font-semibold">{{ tipAmount.toFixed(2) }} RON</span>
          </div>
        </div>

        <div class="p-3 bg-green-50 rounded-lg">
          <div class="flex justify-between text-lg font-bold">
            <span>Total de Plată:</span>
            <span>{{ totalWithTip.toFixed(2) }} RON</span>
          </div>
        </div>

        <Button
          @click="processPayment"
          :disabled="processing || selectedOrdersTotal <= 0 || !paymentType"
          class="w-full text-white bg-green-600 hover:bg-green-700"
          size="lg"
        >
          <DollarSign class="mr-2 w-4 h-4" />
          {{ processing ? 'Se trimite cererea...' : paymentType === 'CASH' ? 'Solicită Nota (Numerar)' : 'Solicită POS' }}
        </Button>
      </CardContent>
    </Card>

    <!-- Custom Tip Drawer -->
    <Drawer v-model:open="customTipDrawerOpen">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Bacșiș Personalizat</DrawerTitle>
          <DrawerDescription>
            Introduceți suma dorită pentru bacșiș (incrementare de 5 RON)
          </DrawerDescription>
        </DrawerHeader>
        <div class="p-4 space-y-4">
          <div>
            <Label>Sumă (RON)</Label>
            <NumberField
              :model-value="customTipAmount"
              @update:model-value="(value: number) => customTipAmount = value"
              :min="0"
              :step="5"
              class="mt-2"
            >
              <NumberFieldContent class="relative">
                <NumberFieldDecrement />
                <NumberFieldInput placeholder="0.00" />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <p class="mt-2 text-xs text-muted-foreground">
              Incrementare: 5 RON
            </p>
          </div>
        </div>
        <DrawerFooter>
          <Button @click="applyCustomTip" :disabled="customTipAmount <= 0">
            Aplică
          </Button>
          <DrawerClose as-child>
            <Button variant="outline">Anulează</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </div>
</template>
