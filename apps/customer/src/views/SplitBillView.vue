<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBillsStore } from '@/stores/bills'
import { useCartStore } from '@/stores/cart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Receipt, DollarSign, ArrowLeft, CheckCircle2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const router = useRouter()
const billsStore = useBillsStore()
const cart = useCartStore()
const selectedOrders = ref<string[]>([])
const tipType = ref<'PERCENTAGE' | 'AMOUNT' | null>(null)
const tipValue = ref<number>(0)
const customTipAmount = ref<number>(0)
const processing = ref(false)

const tipOptions = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: '25%', value: 25 },
  { label: 'Custom %', value: 'custom_percent' },
  { label: 'Custom Amount', value: 'custom_amount' }
]

onMounted(async () => {
  if (!cart.tableToken) {
    router.push({ name: 'scan' })
    return
  }
  await billsStore.fetchTableBill()
  
  // Auto-select current device's orders
  if (billsStore.tableBill) {
    const myOrders = billsStore.tableBill.orders.filter((o: any) => o.deviceId === cart.deviceId)
    selectedOrders.value = myOrders.map((o: any) => o.id)
  }
})

const myOrders = computed(() => {
  if (!billsStore.tableBill) return []
  return billsStore.tableBill.orders.filter((o: any) => o.deviceId === cart.deviceId)
})

const otherOrders = computed(() => {
  if (!billsStore.tableBill) return []
  return billsStore.tableBill.orders.filter((o: any) => o.deviceId !== cart.deviceId)
})

const selectedOrdersTotal = computed(() => {
  if (!billsStore.tableBill) return 0
  
  return billsStore.tableBill.orders
    .filter((o: any) => selectedOrders.value.includes(o.id))
    .reduce((sum: number, order: any) => {
      const paid = order.payments?.reduce((pSum: number, p: any) => pSum + p.total, 0) || 0
      return sum + (order.total - paid)
    }, 0)
})

const tipAmount = computed(() => {
  if (!tipType.value || tipValue.value === 0) return 0
  
  if (tipType.value === 'PERCENTAGE') {
    return (selectedOrdersTotal.value * tipValue.value) / 100
  } else if (tipType.value === 'AMOUNT') {
    return tipValue.value
  }
  return 0
})

const totalWithTip = computed(() => {
  return selectedOrdersTotal.value + tipAmount.value
})

function toggleOrder(orderId: string) {
  const index = selectedOrders.value.indexOf(orderId)
  if (index > -1) {
    selectedOrders.value.splice(index, 1)
  } else {
    selectedOrders.value.push(orderId)
  }
}

function selectMyOrders() {
  selectedOrders.value = myOrders.value.map((o: any) => o.id)
}

function selectAllOrders() {
  if (!billsStore.tableBill) return
  selectedOrders.value = billsStore.tableBill.orders
    .filter((o: any) => {
      const paid = o.payments?.reduce((sum: number, p: any) => sum + p.total, 0) || 0
      return paid < o.total
    })
    .map((o: any) => o.id)
}

function handleTipSelection(value: string | number) {
  if (value === 'custom_percent') {
    tipType.value = 'PERCENTAGE'
    tipValue.value = 0
  } else if (value === 'custom_amount') {
    tipType.value = 'AMOUNT'
    tipValue.value = 0
    customTipAmount.value = 0
  } else {
    tipType.value = 'PERCENTAGE'
    tipValue.value = Number(value)
  }
}

async function processPayment() {
  if (selectedOrders.value.length === 0) {
    toast.error('Please select at least one order')
    return
  }

  if (selectedOrdersTotal.value <= 0) {
    toast.error('Selected orders are already paid')
    return
  }

  processing.value = true
  try {
    await billsStore.createPayment({
      orderIds: selectedOrders.value,
      amount: selectedOrdersTotal.value,
      tipType: tipType.value,
      tipValue: tipType.value === 'PERCENTAGE' ? tipValue.value : (tipType.value === 'AMOUNT' ? customTipAmount.value : null)
    })
    
    toast.success('Payment processed successfully!')
    await billsStore.fetchTableBill()
    
    // Clear selection
    selectedOrders.value = []
    tipType.value = null
    tipValue.value = 0
    customTipAmount.value = 0
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to process payment')
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
  <div class="flex flex-col min-h-screen bg-gray-50">
    <header class="flex sticky top-0 z-10 gap-4 items-center p-4 bg-white shadow-sm">
      <button @click="router.back()" class="font-medium">← Înapoi</button>
      <h1 class="text-lg font-bold">Notă de Plată</h1>
    </header>

    <main class="flex-1 p-4 space-y-4">
      <div v-if="billsStore.loading" class="text-center py-8">
        <p class="text-muted-foreground">Se încarcă...</p>
      </div>

      <div v-else-if="!billsStore.tableBill" class="text-center py-8 text-muted-foreground">
        <p>Nu s-au găsit comenzi pentru această masă</p>
      </div>

      <div v-else class="space-y-4">
        <!-- Summary Card -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Receipt class="w-5 h-5" />
              Masă: {{ billsStore.tableBill.table.name }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">Total Notă</p>
                <p class="text-2xl font-bold">{{ billsStore.tableBill.totalBill.toFixed(2) }} RON</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Selectat</p>
                <p class="text-2xl font-bold text-blue-600">{{ selectedOrdersTotal.toFixed(2) }} RON</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Selection -->
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="selectMyOrders">
            Selectează Comenzile Mele
          </Button>
          <Button variant="outline" size="sm" @click="selectAllOrders">
            Selectează Tot
          </Button>
        </div>

        <!-- My Orders -->
        <Card v-if="myOrders.length > 0">
          <CardHeader>
            <CardTitle class="text-lg">Comenzile Mele</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div
              v-for="order in myOrders"
              :key="order.id"
              class="flex justify-between items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
              :class="{ 'bg-blue-50 border-blue-300': selectedOrders.includes(order.id) }"
              @click="toggleOrder(order.id)"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="selectedOrders.includes(order.id)"
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
                <p v-if="getOrderRemaining(order) < order.total" class="text-xs text-green-600">
                  Rămas: {{ getOrderRemaining(order).toFixed(2) }} RON
                </p>
                <Badge v-if="order.paymentStatus === 'PAID'" variant="default" class="mt-1">
                  Plătit
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Other Orders -->
        <Card v-if="otherOrders.length > 0">
          <CardHeader>
            <CardTitle class="text-lg">Alte Comenzi la Masă</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div
              v-for="order in otherOrders"
              :key="order.id"
              class="flex justify-between items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
              :class="{ 'bg-blue-50 border-blue-300': selectedOrders.includes(order.id) }"
              @click="toggleOrder(order.id)"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="selectedOrders.includes(order.id)"
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
                <p v-if="getOrderRemaining(order) < order.total" class="text-xs text-green-600">
                  Rămas: {{ getOrderRemaining(order).toFixed(2) }} RON
                </p>
                <Badge v-if="order.paymentStatus === 'PAID'" variant="default" class="mt-1">
                  Plătit
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
              <Label>Bacșiș</Label>
              <Select @update:model-value="handleTipSelection">
                <SelectTrigger>
                  <SelectValue placeholder="Selectează bacșiș" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in tipOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <div v-if="tipValue === 0 && tipType === 'PERCENTAGE'" class="mt-2">
                <Input
                  type="number"
                  v-model.number="tipValue"
                  placeholder="Procent (ex: 18)"
                  min="0"
                  max="100"
                />
              </div>

              <div v-if="tipType === 'AMOUNT'" class="mt-2">
                <Input
                  type="number"
                  v-model.number="customTipAmount"
                  placeholder="Sumă (ex: 10.50)"
                  min="0"
                  step="0.01"
                />
                <Button
                  size="sm"
                  variant="outline"
                  class="mt-2"
                  @click="tipValue = customTipAmount"
                >
                  Aplică Suma
                </Button>
              </div>
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
              :disabled="processing || selectedOrdersTotal <= 0"
              class="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <DollarSign class="w-4 h-4 mr-2" />
              {{ processing ? 'Se procesează...' : 'Plătește' }}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
