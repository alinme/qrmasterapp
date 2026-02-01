<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useBillsStore } from '@/stores/bills'
import { useOrdersStore } from '@/stores/orders'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Receipt, DollarSign, Users, RefreshCw, CheckCircle, Eye, Bell, UserPlus, UserMinus, X, AlertCircle, Settings, Circle, Clock, CreditCard, Package, User, UserX } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ServerReviewDialog from '@/components/orders/ServerReviewDialog.vue'
import { useAuthStore } from '@/stores/auth'

const billsStore = useBillsStore()
const ordersStore = useOrdersStore()
const authStore = useAuthStore()
const selectedTable = ref<any>(null)
const billDialogOpen = ref(false)
const paymentDialogOpen = ref(false)
const selectedOrders = ref<string[]>([])
const tipType = ref<'PERCENTAGE' | 'AMOUNT' | null>(null)
const tipValue = ref<number>(0)
const customTipAmount = ref<number>(0)
const paymentType = ref<'CASH' | 'POS' | null>(null)
const currentBillRequest = ref<any>(null)
const readyOrderIds = ref<Set<string>>(new Set())
const flashingTableIds = ref<Set<string>>(new Set())
const reviewDialogOpen = ref(false)
const selectedOrderForReview = ref<any>(null)
const pendingReviewOrderIds = ref<Set<string>>(new Set())
const flashingReviewTableIds = ref<Set<string>>(new Set())
const billRequests = ref<any[]>([])
const notificationsPanelOpen = ref(false)
const showTableActions = ref(false)

// New Order Popup
const newOrderPopupOpen = ref(false)
const newOrderPopupOrder = ref<any>(null)

function showNewOrderPopup(order: any) {
  newOrderPopupOrder.value = order
  newOrderPopupOpen.value = true
}

function closeNewOrderPopup() {
  newOrderPopupOpen.value = false
  newOrderPopupOrder.value = null
}

function handleReviewFromPopup() {
  if (!newOrderPopupOrder.value) return
  
  // Open the review dialog with the order
  openReviewDialog(newOrderPopupOrder.value)
  closeNewOrderPopup()
}

// NOTIFICATION POPUP - Shows for ALL notifications regardless of location
const notificationPopupOpen = ref(false)
const notificationPopupData = ref<{
  type: 'order' | 'bill' | 'waiter',
  title: string,
  message: string,
  tableName: string,
  data?: any
} | null>(null)
const notificationSoundPlayed = ref(false)

function showNotificationPopup(type: 'order' | 'bill' | 'waiter', data: any) {
  let title = ''
  let message = ''
  let tableName = data.tableName || data.table?.name || 'N/A'
  
  switch (type) {
    case 'order':
      title = 'Comandă Nouă!'
      message = `Masă ${tableName} - Total: ${data.total?.toFixed(2) || 0} RON`
      break
    case 'bill':
      title = 'Cerere Notă de Plată!'
      message = `Masă ${tableName} - Total: ${data.totalWithTip?.toFixed(2) || 0} RON (${data.paymentType === 'CASH' ? 'Numerar' : 'POS'})`
      break
    case 'waiter':
      title = 'Chelner Chemat!'
      message = data.message || `Clientul de la masă ${tableName} te cheamă!`
      break
  }
  
  notificationPopupData.value = { type, title, message, tableName, data }
  notificationPopupOpen.value = true
  notificationSoundPlayed.value = false
  playNotificationSound()
}

function closeNotificationPopup() {
  notificationPopupOpen.value = false
  notificationPopupData.value = null
}

function handleNotificationAction() {
  if (!notificationPopupData.value) return
  
  const { type, data } = notificationPopupData.value
  
  switch (type) {
    case 'order':
      // Open review dialog for the order
      if (data) {
        openReviewDialog(data)
      }
      break
    case 'bill':
      // Open bill dialog for the table
      if (data?.tableId) {
        const table = billsStore.tables.find((t: any) => t.id === data.tableId)
        if (table) openBillDialog(table)
      }
      break
    case 'waiter':
      // Could navigate to table or just close
      if (data?.tableId) {
        const table = billsStore.tables.find((t: any) => t.id === data.tableId)
        if (table) openBillDialog(table)
      }
      break
  }
  
  closeNotificationPopup()
}

// Base tip options
const baseTipOptions = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: '25%', value: 25 },
  { label: 'Custom %', value: 'custom' },
  { label: 'Sumă fixă (RON)', value: 'amount' }
]

// Computed tip options that includes custom percentage from client request
const tipOptions = computed(() => {
  const options = [...baseTipOptions]
  
  // If there's a current bill request with a custom tip percentage, add it to the options
  if (currentBillRequest.value?.tipType === 'PERCENTAGE' && currentBillRequest.value?.tipValue) {
    const customPercentage = currentBillRequest.value.tipValue
    
    // Check if this percentage is already in the base options
    const existsInBase = baseTipOptions.some(opt => opt.value === customPercentage)
    
    // If it's not in the base options and it's a valid percentage, add it
    if (!existsInBase && customPercentage > 0 && customPercentage <= 100) {
      // Insert before "Custom" option, sorted by value
      const customIndex = options.findIndex(opt => opt.value === 'custom')
      if (customIndex > -1) {
        options.splice(customIndex, 0, { 
          label: `${customPercentage}% (Client)`, 
          value: customPercentage 
        })
      } else {
        options.push({ 
          label: `${customPercentage}% (Client)`, 
          value: customPercentage 
        })
      }
    }
  }
  
  return options
})

async function loadBillRequests() {
  try {
    const requests = await billsStore.fetchBillRequests()
    billRequests.value = requests || []
  } catch (error) {
    console.error('Failed to load bill requests', error)
  }
}

// Auto-refresh bill requests periodically
let billRequestsInterval: any = null

// Named handlers so we can remove only ours on unmount (store keeps its own listeners)
let handleNewOrder: ((order: any) => void) | null = null
let handleOrderUpdated: (() => void) | null = null
let handleBillRequested: ((data: any) => void) | null = null
let handleWaiterCalled: ((data: any) => void) | null = null
let handleTableStatusChanged: (() => void) | null = null
let handleConnect: (() => void) | null = null
let listenersSetup = false

function teardownSocketListeners() {
  const socket = ordersStore.socket
  if (!socket) return
  if (handleNewOrder) socket.off('new_order', handleNewOrder)
  if (handleOrderUpdated) socket.off('order_updated', handleOrderUpdated)
  if (handleBillRequested) socket.off('bill_requested', handleBillRequested)
  if (handleWaiterCalled) socket.off('waiter_called', handleWaiterCalled)
  if (handleTableStatusChanged) socket.off('table_status_changed', handleTableStatusChanged)
  if (handleConnect) socket.off('connect', handleConnect)
  handleNewOrder = null
  handleOrderUpdated = null
  handleBillRequested = null
  handleWaiterCalled = null
  handleTableStatusChanged = null
  handleConnect = null
  listenersSetup = false
}

function setupSocketListeners() {
  const socket = ordersStore.socket
  if (!socket?.connected || listenersSetup) return
  listenersSetup = true

  handleNewOrder = (order: any) => {
    const isMyTable = order.tableServerId === null || order.tableServerId === authStore.user?.id
    if (isMyTable && order.status === 'SERVER_REVIEW') {
      // Show BIG notification popup regardless of location
      showNotificationPopup('order', order)
      
      // Also show the review popup for immediate action
      showNewOrderPopup(order)
      
      // Also show toast
      toast.info('Comandă nouă de revizuit', {
        description: `Masă: ${order.table?.name || 'N/A'}, Total: ${order.total.toFixed(2)} RON`,
        duration: 5000
      })
      
      if (order.tableId) {
        flashingReviewTableIds.value.add(order.tableId)
        setTimeout(() => flashingReviewTableIds.value.delete(order.tableId), 3000)
      }
    }
    billsStore.fetchTables()
  }
  socket.on('new_order', handleNewOrder)

  handleOrderUpdated = () => { billsStore.fetchTables() }
  socket.on('order_updated', handleOrderUpdated)

  handleBillRequested = async (data: any) => {
    await loadBillRequests()
    // Show BIG notification popup regardless of location
    showNotificationPopup('bill', data)
    toast.info(data.message || 'Cerere de notă de plată', {
      description: `Masă: ${data.tableName}, Total: ${data.totalWithTip?.toFixed(2)} RON, Tip: ${data.tipAmount?.toFixed(2) || 0} RON, Metodă: ${data.paymentType === 'CASH' ? 'Numerar' : 'POS'}`,
      duration: Infinity,
      action: {
        label: 'Vezi',
        onClick: () => {
          const table = billsStore.tables.find((t: any) => t.id === data.tableId)
          if (table) openBillDialog(table)
        }
      }
    })
    billsStore.fetchTables()
    if (selectedTable.value?.id === data.tableId) {
      billsStore.fetchTableBill(data.tableId)
    }
  }
  socket.on('bill_requested', handleBillRequested)

  handleWaiterCalled = (data: any) => {
    // Show BIG notification popup regardless of location
    showNotificationPopup('waiter', data)
    toast.info(data.message || 'Chelner chemat', {
      description: `Masă: ${data.tableName || 'N/A'}`,
      duration: 5000
    })
  }
  socket.on('waiter_called', handleWaiterCalled)

  handleTableStatusChanged = () => { billsStore.fetchTables() }
  socket.on('table_status_changed', handleTableStatusChanged)
}

// Watch socket reference only (no deep). Deep-watching caused infinite loop: setupSocketListeners
// mutates socket (off/on), which retriggered the watch -> CPU spike, freeze.
watch(() => ordersStore.socket, (newSocket) => {
  if (!newSocket) {
    teardownSocketListeners()
    return
  }
  if (newSocket.connected) {
    setupSocketListeners()
  } else {
    handleConnect = () => setupSocketListeners()
    newSocket.on('connect', handleConnect)
  }
}, { immediate: true })

onMounted(async () => {
  await billsStore.fetchTables()
  ordersStore.connectSocket()
  await ordersStore.fetchOrders()
  await loadBillRequests()
  
  // Initialize ready orders and pending reviews tracking
  updateReadyOrders()
  updatePendingReviews()
  
  // Initialize signature
  previousOrdersSignature.value = ordersStore.orders.map(o => `${o.id}:${o.status}`).join('|')
  
  // Auto-refresh bill requests every 5 seconds
  billRequestsInterval = setInterval(() => {
    loadBillRequests()
  }, 5000)
  
  // Try to set up listeners immediately
  setupSocketListeners()
})

onUnmounted(() => {
  if (billRequestsInterval) clearInterval(billRequestsInterval)
  teardownSocketListeners()
})

// Track previous signature to detect actual changes
const previousOrdersSignature = ref<string>('')
let isUpdating = false

// Watch for order changes - use a function that creates a signature
watch(() => {
  // Create signature from orders
  return ordersStore.orders.map(o => `${o.id}:${o.status}`).join('|')
}, (newSignature) => {
  // Prevent recursive updates
  if (isUpdating || newSignature === previousOrdersSignature.value) {
    return
  }
  
  previousOrdersSignature.value = newSignature
  isUpdating = true
  
  // Use nextTick to defer updates
  setTimeout(() => {
    try {
      const previousReadyCount = readyOrderIds.value.size
      const previousReviewCount = pendingReviewOrderIds.value.size
      
      updateReadyOrders()
      updatePendingReviews()
      
      // Check if new orders became READY
      const currentReadyCount = readyOrderIds.value.size
      if (currentReadyCount > previousReadyCount && previousReadyCount > 0) {
        playNotificationSound()
        // Flash tables with new READY orders
        const newReadyOrders = ordersStore.orders.filter(o => 
          o.status === 'READY' && !readyOrderIds.value.has(o.id)
        )
        newReadyOrders.forEach(order => {
          flashingTableIds.value.add(order.tableId)
          setTimeout(() => {
            flashingTableIds.value.delete(order.tableId)
          }, 3000)
        })
      }
      
      // Check if new orders need review
      const currentReviewCount = pendingReviewOrderIds.value.size
      if (currentReviewCount > previousReviewCount && previousReviewCount > 0) {
        // Flash tables with new pending reviews
        const newReviewOrders = ordersStore.orders.filter(o => 
          o.status === 'SERVER_REVIEW' && !pendingReviewOrderIds.value.has(o.id)
        )
        newReviewOrders.forEach(order => {
          flashingReviewTableIds.value.add(order.tableId)
          setTimeout(() => {
            flashingReviewTableIds.value.delete(order.tableId)
          }, 3000)
        })
      }
    } finally {
      isUpdating = false
    }
  }, 0)
}, { flush: 'post' })

function updateReadyOrders() {
  // Only update if actually changed to prevent unnecessary reactivity
  const readyOrders = ordersStore.orders.filter(o => o.status === 'READY')
  const newIds = new Set(readyOrders.map(o => o.id))
  const currentIds = readyOrderIds.value
  
  // Only update if different
  if (currentIds.size !== newIds.size || 
      [...currentIds].some(id => !newIds.has(id)) ||
      [...newIds].some(id => !currentIds.has(id))) {
    readyOrderIds.value = newIds
  }
}

function updatePendingReviews() {
  // Only update if actually changed to prevent unnecessary reactivity
  const pendingReviews = ordersStore.orders.filter(o => o.status === 'SERVER_REVIEW')
  const newIds = new Set(pendingReviews.map(o => o.id))
  const currentIds = pendingReviewOrderIds.value
  
  // Only update if different
  if (currentIds.size !== newIds.size || 
      [...currentIds].some(id => !newIds.has(id)) ||
      [...newIds].some(id => !currentIds.has(id))) {
    pendingReviewOrderIds.value = newIds
  }
}

async function openReviewDialog(order: any) {
  // If order doesn't have full details, fetch it
  if (!order.items || !order.table) {
    try {
      const fullOrder = await ordersStore.fetchOrder(order.id)
      selectedOrderForReview.value = fullOrder
    } catch (error) {
      toast.error('Nu s-a putut încărca comanda')
      return
    }
  } else {
    selectedOrderForReview.value = order
  }
  reviewDialogOpen.value = true
}

async function handleReview(serverNotes: string, sendToKitchen: boolean) {
  if (!selectedOrderForReview.value) return
  
  try {
    await ordersStore.reviewOrder(selectedOrderForReview.value.id, serverNotes, sendToKitchen)
    toast.success(sendToKitchen ? 'Comandă trimisă la bucătărie' : 'Comandă salvată')
    reviewDialogOpen.value = false
    selectedOrderForReview.value = null
    // Don't call fetchOrders here - the socket will handle the update
    // Just refresh tables and let the watcher handle pending reviews
    await billsStore.fetchTables()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Nu s-a putut revizui comanda')
  }
}

function playNotificationSound() {
  try {
    // Check if AudioContext is supported
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) {
      return
    }
    
    const audioContext = new AudioContextClass()
    
    // Handle AudioContext errors gracefully - don't let errors propagate
    const handleError = () => {
      // Silently ignore - don't log to avoid console spam
    }
    
    // First beep
    try {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.onended = handleError
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 1000
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
      
      // Play second beep
      setTimeout(() => {
        try {
          const oscillator2 = audioContext.createOscillator()
          const gainNode2 = audioContext.createGain()
          
          oscillator2.onended = handleError
          
          oscillator2.connect(gainNode2)
          gainNode2.connect(audioContext.destination)
          
          oscillator2.frequency.value = 1200
          oscillator2.type = 'sine'
          
          gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
          
          oscillator2.start(audioContext.currentTime)
          oscillator2.stop(audioContext.currentTime + 0.4)
        } catch (e) {
          // Silently ignore audio errors
        }
      }, 300)
    } catch (e) {
      // Silently ignore audio errors
    }
  } catch (e) {
    // Silently ignore audio errors - don't log to avoid console spam
  }
}

async function markAsServed(orderId: string) {
  try {
    await ordersStore.updateOrderStatus(orderId, 'SERVED')
    toast.success('Order marked as served')
    await billsStore.fetchTableBill(selectedTable.value!.id)
    await billsStore.fetchTables()
    updateReadyOrders()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to mark order as served')
  }
}

// BUGFIX #5: Mark all ready orders as served for a table
async function markAllReadyAsServed(table: any) {
  try {
    const readyOrders = ordersStore.orders.filter(o => 
      o.tableId === table.id && o.status === 'READY'
    )
    
    if (readyOrders.length === 0) {
      toast.error('Nu există comenzi gata de servit')
      return
    }
    
    // Mark all ready orders as served
    for (const order of readyOrders) {
      await ordersStore.updateOrderStatus(order.id, 'SERVED')
    }
    
    toast.success(`${readyOrders.length} comenzi marcate ca servite`)
    await billsStore.fetchTables()
    updateReadyOrders()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to mark orders as served')
  }
}

const tablesWithBills = computed(() => {
  // Use a stable reference to orders to avoid recomputation loops
  const orders = ordersStore.orders
  const currentUserId = authStore.user?.id
  
  return billsStore.tables.map(table => {
    const readyOrders = orders.filter(o => 
      o.tableId === table.id && o.status === 'READY'
    )
    const pendingReviewOrders = orders.filter(o => 
      o.tableId === table.id && o.status === 'SERVER_REVIEW'
    )
    
    const isOwnedByMe = table.serverId === currentUserId
    const isFree = !table.serverId
    const isOwnedByOther = table.serverId && table.serverId !== currentUserId
    
    return {
      ...table,
      readyOrderCount: readyOrders.length,
      hasReadyOrders: readyOrders.length > 0,
      pendingReviewCount: pendingReviewOrders.length,
      hasPendingReviews: pendingReviewOrders.length > 0,
      pendingReviewOrders: pendingReviewOrders,
      status: table.status || 'AVAILABLE',
      isOwnedByMe,
      isFree,
      isOwnedByOther,
      serverEmail: table.server?.email || null,
      categoryId: table.category?.id || null,
      categoryName: table.category?.name || 'Uncategorized'
    }
  })
})

// Group tables by category
const tablesByCategory = computed(() => {
  const grouped: Record<string, { name: string; sortOrder: number; tables: any[] }> = {}
  
  tablesWithBills.value.forEach(table => {
    const categoryId = table.categoryId || 'uncategorized'
    const categoryName = table.categoryName || 'Uncategorized'
    const sortOrder = table.category?.sortOrder ?? 999
    
    if (!grouped[categoryId]) {
      grouped[categoryId] = {
        name: categoryName,
        sortOrder: sortOrder,
        tables: []
      }
    }
    grouped[categoryId].tables.push(table)
  })
  
  // Convert to array and sort by sortOrder
  return Object.entries(grouped)
    .map(([id, data]) => ({
      id,
      name: data.name,
      sortOrder: data.sortOrder,
      tables: data.tables
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

function getTableStatusColor(status: string) {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-gray-100 dark:bg-gray-800'
    case 'BUSY':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    case 'BILL_REQUESTED':
      return 'bg-orange-100 dark:bg-orange-900/30'
    case 'READY':
      return 'bg-green-100 dark:bg-green-900/30'
    default:
      return 'bg-gray-100 dark:bg-gray-800'
  }
}

function getTableStatusBorderColor(status: string) {
  switch (status) {
    case 'AVAILABLE':
      return 'border-gray-300 dark:border-gray-600'
    case 'BUSY':
      return 'border-yellow-400 dark:border-yellow-600'
    case 'BILL_REQUESTED':
      return 'border-orange-500 dark:border-orange-600'
    case 'READY':
      return 'border-green-500 dark:border-green-600'
    default:
      return 'border-gray-300 dark:border-gray-600'
  }
}


async function setTableReady(tableId: string) {
  try {
    await billsStore.updateTableStatus(tableId, 'READY')
    toast.success('Masă setată ca gata')
    await billsStore.fetchTables()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Nu s-a putut seta masa ca gata')
  }
}

async function resetTable(tableId: string) {
  try {
    await billsStore.updateTableStatus(tableId, 'AVAILABLE')
    toast.success('Masă resetată cu succes')
    // Force refresh - updateTableStatus already calls fetchTables, but we ensure it happens
    await billsStore.fetchTables()
    // Clear bill data if this table's bill is currently loaded (removes old bill data)
    if (selectedTable.value?.id === tableId) {
      billsStore.clearTableBill()
      closeBillDialog()
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Nu s-a putut reseta masa')
  }
}

async function openBillDialog(table: any) {
  selectedTable.value = table
  billDialogOpen.value = true
  // Always fetch fresh bill data when opening dialog (clears any cached old data)
  await billsStore.fetchTableBill(table.id)
  // BUGFIX #9: Check for pending bill requests and auto-populate payment info
  if (billsStore.tableBill?.billRequests && billsStore.tableBill.billRequests.length > 0) {
    const latestRequest = billsStore.tableBill.billRequests[0]
    currentBillRequest.value = latestRequest
    // Auto-select the orders from the request
    try {
      const orderIds = JSON.parse(latestRequest.orderIds)
      selectedOrders.value = orderIds
      // Set payment type and tip from request
      paymentType.value = latestRequest.paymentType
      if (latestRequest.tipAmount > 0 && latestRequest.tipType) {
        tipType.value = latestRequest.tipType as 'PERCENTAGE' | 'AMOUNT'
        if (latestRequest.tipType === 'PERCENTAGE') {
          tipValue.value = latestRequest.tipValue || 0
          customTipAmount.value = 0
        } else if (latestRequest.tipType === 'AMOUNT') {
          customTipAmount.value = latestRequest.tipAmount
          tipValue.value = 0
        }
      } else {
        // Reset tip values if no tip in request
        tipType.value = null
        tipValue.value = 0
        customTipAmount.value = 0
      }
    } catch (e) {
      console.error('Failed to parse orderIds from bill request', e)
    }
  }
}

function closeBillDialog() {
  billDialogOpen.value = false
  selectedTable.value = null
  selectedOrders.value = []
  currentBillRequest.value = null
  paymentType.value = null
  tipType.value = null
  tipValue.value = 0
  customTipAmount.value = 0
}

function processBillRequest(request: any) {
  try {
    const orderIds = JSON.parse(request.orderIds) as string[]
    selectedOrders.value = orderIds
    paymentType.value = request.paymentType
    if (request.tipAmount > 0 && request.tipType) {
      tipType.value = request.tipType as 'PERCENTAGE' | 'AMOUNT'
      if (request.tipType === 'PERCENTAGE') {
        tipValue.value = request.tipValue || 0
        customTipAmount.value = 0
      } else if (request.tipType === 'AMOUNT') {
        customTipAmount.value = request.tipAmount
        tipValue.value = 0
      }
    } else {
      tipType.value = null
      tipValue.value = 0
      customTipAmount.value = 0
    }
    currentBillRequest.value = request
    openPaymentDialog(false) // Don't reset tip values - keep them from bill request
  } catch (e) {
    console.error('Failed to parse orderIds', e)
  }
}

function openPaymentDialog(resetTipValues: boolean = true) {
  if (!selectedTable.value) return
  
  paymentDialogOpen.value = true
  
  // Only select all unpaid orders when resetTipValues is true (i.e., not coming from processBillRequest)
  // When coming from processBillRequest, selectedOrders is already set from the bill request
  if (resetTipValues) {
    const unpaidOrders = billsStore.tableBill?.orders?.filter((o: any) => {
      const paid = o.payments?.reduce((sum: number, p: any) => sum + p.total, 0) || 0
      return paid < o.total
    }) || []
    selectedOrders.value = unpaidOrders.map((o: any) => o.id)
    tipType.value = null
    tipValue.value = 0
    customTipAmount.value = 0
  }
}

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
  if (!tipType.value) return 0
  
  if (tipType.value === 'PERCENTAGE') {
    if (tipValue.value === 0) return 0
    return (selectedOrdersTotal.value * tipValue.value) / 100
  } else if (tipType.value === 'AMOUNT') {
    return customTipAmount.value || 0
  }
  return 0
})

const totalWithTip = computed(() => {
  return selectedOrdersTotal.value + tipAmount.value
})

async function processPayment() {
  if (selectedOrders.value.length === 0) {
    toast.error('Please select at least one order')
    return
  }

  if (selectedOrdersTotal.value <= 0) {
    toast.error('Selected orders are already paid')
    return
  }

  if (!paymentType.value) {
    toast.error('Te rugăm să selectezi tipul de plată (Numerar sau POS)')
    return
  }

  try {
    await billsStore.createPayment({
      orderIds: selectedOrders.value,
      amount: selectedOrdersTotal.value,
      tipType: tipType.value,
      tipValue: tipType.value === 'PERCENTAGE' ? tipValue.value : (tipType.value === 'AMOUNT' ? customTipAmount.value : null),
      paymentType: paymentType.value,
      billRequestId: currentBillRequest.value?.id || null
    })
    
    toast.success('Payment processed successfully')
    
    // Reload bill requests to remove processed one
    await loadBillRequests()
    
    paymentDialogOpen.value = false
    currentBillRequest.value = null
    await billsStore.fetchTableBill(selectedTable.value!.id)
    await billsStore.fetchTables()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to process payment')
  }
}

const tipSelectValue = computed(() => {
  if (!tipType.value) return undefined
  if (tipType.value === 'PERCENTAGE' && tipValue.value > 0) {
    // Check if it matches one of the options (including custom client percentage)
    const matchingOption = tipOptions.value.find(opt => opt.value === tipValue.value)
    if (matchingOption) {
      return String(matchingOption.value)
    }
    // If it's a custom percentage, return 'custom'
    return 'custom'
  }
  if (tipType.value === 'PERCENTAGE' && tipValue.value === 0) {
    return 'custom'
  }
  if (tipType.value === 'AMOUNT') {
    return 'amount'
  }
  return undefined
})

const showCustomPercentageInput = computed(() => {
  if (tipType.value !== 'PERCENTAGE') return false
  // Show if tipValue is 0 (user selected "Custom") or if it's a custom value not in options list
  if (tipValue.value === 0) return true
  const matchingOption = tipOptions.value.find((opt: any) => opt.value === tipValue.value)
  return !matchingOption // Show if not in options list
})

function handleTipSelection(value: any) {
  if (value === 'amount') {
    // BUGFIX #11: Select AMOUNT type for fixed tip
    tipType.value = 'AMOUNT'
    tipValue.value = 0
    // NU resetăm customTipAmount - lăsăm valoarea anterioară sau 0 dacă nu există
    // Acesta este fixul pentru problema: bacșișul custom era resetat la selecție
  } else if (!value || value === 'custom') {
    tipType.value = 'PERCENTAGE'
    tipValue.value = 0
    customTipAmount.value = 0
  } else {
    tipType.value = 'PERCENTAGE'
    tipValue.value = Number(value)
    customTipAmount.value = 0
  }
}

async function handleAssignTable(tableId: string) {
  try {
    await billsStore.assignTable(tableId)
    toast.success('Masă preluată cu succes')
    await billsStore.fetchTables()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Nu s-a putut prelua masa')
  }
}

async function handleReleaseTable(tableId: string) {
  try {
    await billsStore.releaseTable(tableId)
    toast.success('Masă eliberată cu succes')
    await billsStore.fetchTables()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Nu s-a putut elibera masa')
  }
}

function handleProcessBillRequest(request: any) {
  // Find the table
  const table = billsStore.tables.find((t: any) => t.id === request.tableId)
  if (!table) {
    toast.error('Masă nu a fost găsită')
    return
  }
  
  // Set current bill request
  currentBillRequest.value = request
  
  // Open bill dialog
  openBillDialog(table)
}

async function handleViewBillRequest(request: any) {
  // Find the table
  const table = billsStore.tables.find((t: any) => t.id === request.tableId)
  if (!table) {
    toast.error('Masă nu a fost găsită')
    return
  }
  
  // Set current bill request
  currentBillRequest.value = request
  
  // Open bill dialog
  openBillDialog(table)
}

</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Server View</h2>
        <p class="text-muted-foreground">View tables, orders, and process payments</p>
      </div>
      <div class="flex gap-2">
        <Button 
          @click="notificationsPanelOpen = !notificationsPanelOpen" 
          variant="outline"
          :class="{ 
            'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700': billRequests.length > 0 
          }"
        > 
          <Bell class="mr-2 w-4 h-4" />
          Notificări
          <Badge v-if="billRequests.length > 0" class="ml-2 bg-orange-600 dark:bg-orange-500">
            {{ billRequests.length }}
          </Badge>
        </Button>
        <Button 
          @click="showTableActions = !showTableActions" 
          variant="outline"
          size="icon"
          :class="{ 'bg-muted': showTableActions }"
          title="Arată/Ascunde acțiuni mese"
        >
          <Settings class="w-4 h-4" />
        </Button>
        <Button @click="billsStore.fetchTables()" variant="outline">
          <RefreshCw class="mr-2 w-4 h-4" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Persistent Notifications Panel -->
    <Card v-if="notificationsPanelOpen" class="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/20">
      <CardHeader>
        <CardTitle class="flex justify-between items-center">
          <div class="flex gap-2 items-center">
            <Bell class="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span>Cereri de Plată Necesitate</span>
            <Badge v-if="billRequests.length > 0" class="bg-orange-600 dark:bg-orange-500">
              {{ billRequests.length }}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" @click="notificationsPanelOpen = false">
            <X class="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="billRequests.length === 0" class="py-8 text-center text-muted-foreground">
          <p>Nu există cereri de plată în așteptare</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="request in billRequests"
            :key="request.id"
            class="p-4 bg-white rounded-lg border-2 border-orange-200 shadow-sm transition-shadow dark:bg-gray-800 dark:border-orange-800 hover:shadow-md"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex gap-2 items-center mb-2">
                  <AlertCircle class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h3 class="text-lg font-semibold">
                    Masă: {{ request.table?.name || 'N/A' }}
                  </h3>
                  <Badge :class="request.paymentType === 'CASH' ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-500'" class="flex gap-1 items-center" :title="request.paymentType === 'CASH' ? 'Numerar' : 'POS'">
                    <DollarSign v-if="request.paymentType === 'CASH'" class="w-3 h-3" />
                    <CreditCard v-else class="w-3 h-3" />
                  </Badge>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <span class="text-muted-foreground">Total:</span>
                    <span class="ml-2 text-lg font-bold">{{ request.totalWithTip.toFixed(2) }} RON</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Bacșiș:</span>
                    <span class="ml-2 font-semibold">{{ request.tipAmount.toFixed(2) }} RON</span>
                    <span v-if="request.tipType === 'PERCENTAGE'" class="ml-1 text-xs text-muted-foreground">
                      ({{ request.tipValue }}%)
                    </span>
                  </div>
                </div>
                <p class="mt-2 text-xs text-muted-foreground">
                  {{ new Date(request.createdAt).toLocaleString('ro-RO') }}
                </p>
              </div>
              <div class="flex flex-col gap-2 ml-4">
                <Button
                  size="sm"
                  @click="handleProcessBillRequest(request)"
                  class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  <DollarSign class="mr-1 w-4 h-4" />
                  Procesează
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  @click="handleViewBillRequest(request)"
                >
                  <Eye class="mr-1 w-4 h-4" />
                  Vezi Detalii
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="billsStore.loading && tablesWithBills.length === 0" class="py-8 text-center">
      <p class="text-muted-foreground">Loading tables...</p>
    </div>

    <div v-else-if="tablesWithBills.length === 0" class="py-8 text-center text-muted-foreground">
      <p>No tables available</p>
    </div>

    <!-- Tables Grouped by Category -->
    <div v-else class="space-y-4">
      <div v-for="category in tablesByCategory" :key="category.id">
        <!-- Category Header -->
        <div class="mb-2">
          <h3 class="text-base font-bold text-foreground border-b border-primary pb-1 flex items-center gap-2">
            {{ category.name }}
            <Badge variant="secondary" class="text-xs">{{ category.tables.length }}</Badge>
          </h3>
        </div>
        
        <!-- Tables Grid - Compact -->
        <div class="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          <Card
            v-for="table in category.tables"
            :key="table.id"
            class="overflow-visible relative border transition-shadow cursor-pointer hover:shadow-md p-0"
            :class="[
              getTableStatusColor(table.status),
              getTableStatusBorderColor(table.status),
              {
                'ring-2 ring-green-500 ring-opacity-75 animate-pulse': flashingTableIds.has(table.id),
                'ring-2 ring-yellow-500 ring-opacity-50': table.hasReadyOrders && !flashingTableIds.has(table.id),
                'ring-2 ring-purple-500 ring-opacity-75 animate-pulse': flashingReviewTableIds.has(table.id),
                'ring-2 ring-purple-500 ring-opacity-50': table.hasPendingReviews && !flashingReviewTableIds.has(table.id) && !flashingTableIds.has(table.id),
                'opacity-60': table.isOwnedByOther
              }
            ]"
            @click="table.isOwnedByOther ? null : openBillDialog(table)"
          >
            <div class="p-2">
              <!-- Header Row: Table Name + Status -->
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm font-bold truncate">{{ table.name }}</span>
                <div class="flex gap-1 items-center">
                  <!-- Status icon -->
                  <Circle v-if="table.status === 'AVAILABLE'" class="w-3 h-3 text-gray-500" />
                  <Clock v-else-if="table.status === 'BUSY'" class="w-3 h-3 text-yellow-500" />
                  <Receipt v-else-if="table.status === 'BILL_REQUESTED'" class="w-3 h-3 text-orange-500" />
                  <CheckCircle v-else-if="table.status === 'READY'" class="w-3 h-3 text-green-500" />
                  <!-- Ownership icon -->
                  <User v-if="table.isOwnedByMe" class="w-3 h-3 text-blue-600" />
                  <UserX v-else-if="table.isFree" class="w-3 h-3 text-gray-400" />
                  <Users v-else-if="table.isOwnedByOther" class="w-3 h-3 text-orange-500" />
                </div>
              </div>
              
              <!-- Badges Row -->
              <div class="flex gap-1 mb-1 flex-wrap" v-if="table.pendingReviewCount > 0 || table.readyOrderCount > 0 || table.orderCount > 0">
                <Badge v-if="table.pendingReviewCount > 0" class="text-[10px] px-1 py-0 bg-purple-600">
                  <Bell class="w-2 h-2 mr-0.5" />{{ table.pendingReviewCount }}
                </Badge>
                <Badge v-if="table.readyOrderCount > 0" class="text-[10px] px-1 py-0 bg-green-600">
                  <CheckCircle class="w-2 h-2 mr-0.5" />{{ table.readyOrderCount }}
                </Badge>
                <Badge v-if="table.orderCount > 0" class="text-[10px] px-1 py-0">
                  <Package class="w-2 h-2 mr-0.5" />{{ table.orderCount }}
                </Badge>
              </div>
              
              <!-- Bill Summary - Compact -->
              <div class="text-[11px] space-y-0.5 border-t pt-1">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Total:</span>
                  <span class="font-semibold">{{ table.totalBill.toFixed(0) }}</span>
                </div>
                <div class="flex justify-between font-bold">
                  <span>Rest:</span>
                  <span :class="table.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'">
                    {{ table.remainingAmount.toFixed(0) }}
                  </span>
                </div>
              </div>
              
              <!-- Quick Action Buttons - Minimal -->
              <div class="flex flex-wrap gap-1 mt-1" v-if="(table.isOwnedByMe || table.isFree || table.isOwnedByOther) && (table.hasPendingReviews || table.hasReadyOrders || table.isFree || table.isOwnedByOther || showTableActions)">
                <Button
                  v-if="table.hasPendingReviews"
                  size="sm"
                  @click.stop="openReviewDialog(table.pendingReviewOrders[0])"
                  class="text-[10px] h-6 px-1 text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Eye class="w-3 h-3" />
                </Button>
                <Button
                  v-if="table.hasReadyOrders"
                  size="sm"
                  @click.stop="markAllReadyAsServed(table)"
                  class="text-[10px] h-6 px-1 text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle class="w-3 h-3" />
                </Button>
                <Button
                  v-if="table.isFree || table.isOwnedByOther"
                  size="sm"
                  @click.stop="handleAssignTable(table.id)"
                  class="text-[10px] h-6 px-1 text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus class="w-3 h-3" />
                </Button>
                <!-- Extended actions when toggle is on -->
                <template v-if="showTableActions && (table.isOwnedByMe || table.isFree)">
                  <Button
                    v-if="table.status === 'BUSY' || table.status === 'BILL_REQUESTED'"
                    size="sm"
                    @click.stop="setTableReady(table.id)"
                    class="text-[10px] h-6 px-1 bg-green-100 hover:bg-green-200 text-green-700"
                  >
                    <CheckCircle class="w-3 h-3" />
                  </Button>
                  <Button
                    v-if="table.status !== 'AVAILABLE'"
                    size="sm"
                    @click.stop="resetTable(table.id)"
                    class="text-[10px] h-6 px-1"
                    variant="outline"
                  >
                    <RefreshCw class="w-3 h-3" />
                  </Button>
                  <Button
                    v-if="table.isOwnedByMe"
                    size="sm"
                    @click.stop="handleReleaseTable(table.id)"
                    class="text-[10px] h-6 px-1 text-blue-600"
                    variant="outline"
                  >
                    <UserMinus class="w-3 h-3" />
                  </Button>
                </template>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>

    <!-- Bill Details Dialog -->
    <Dialog :open="billDialogOpen" @update:open="closeBillDialog">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Table Bill - {{ selectedTable?.name }}</DialogTitle>
        </DialogHeader>
        
        <div v-if="billsStore.tableBill" class="space-y-4">
          <!-- Pending Bill Requests -->
          <Card v-if="billsStore.tableBill.billRequests && billsStore.tableBill.billRequests.length > 0" class="bg-orange-50 border-orange-500 dark:bg-orange-900/20">
            <CardHeader>
              <CardTitle class="text-orange-700 dark:text-orange-300">Cereri de Plată Necesitate</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-for="request in billsStore.tableBill.billRequests.filter((r: any) => !r.processed)" :key="request.id" class="p-3 bg-white rounded-lg border border-orange-300 dark:bg-gray-800">
                <div class="flex justify-between items-center mb-2">
                  <div class="flex gap-2 items-center">
                    <Badge :class="request.paymentType === 'CASH' ? 'bg-green-600' : 'bg-blue-600'" class="flex gap-1 items-center" :title="request.paymentType === 'CASH' ? 'Numerar' : 'POS'">
                      <DollarSign v-if="request.paymentType === 'CASH'" class="w-3 h-3" />
                      <CreditCard v-else class="w-3 h-3" />
                    </Badge>
                    <span class="text-sm text-muted-foreground">{{ new Date(request.createdAt).toLocaleTimeString('ro-RO') }}</span>
                  </div>
                </div>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">
                    <span>Sumă:</span>
                    <span class="font-semibold">{{ request.amount.toFixed(2) }} RON</span>
                  </div>
                  <div v-if="request.tipAmount > 0" class="flex justify-between text-blue-600">
                    <span>Bacșiș:</span>
                    <span class="font-semibold">+{{ request.tipAmount.toFixed(2) }} RON</span>
                  </div>
                  <div class="flex justify-between pt-1 font-bold border-t">
                    <span>Total:</span>
                    <span class="text-lg">{{ request.totalWithTip.toFixed(2) }} RON</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  class="mt-2 w-full"
                  @click="processBillRequest(request)"
                >
                  Procesează Această Cerere
                </Button>
              </div>
            </CardContent>
          </Card>

          <!-- Summary -->
          <Card>
            <CardContent class="pt-6">
              <div class="grid grid-cols-4 gap-4">
                <div>
                  <p class="text-sm text-muted-foreground">Total Bill</p>
                  <p class="text-2xl font-bold">{{ billsStore.tableBill.totalBill.toFixed(2) }} RON</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">Paid</p>
                  <p class="text-2xl font-bold text-green-600">{{ billsStore.tableBill.totalPaid.toFixed(2) }} RON</p>
                </div>
                <div v-if="billsStore.tableBill.totalTips > 0">
                  <p class="text-sm text-muted-foreground">Tips</p>
                  <p class="text-2xl font-bold text-blue-600">+{{ billsStore.tableBill.totalTips.toFixed(2) }} RON</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">Remaining</p>
                  <p class="text-2xl font-bold text-orange-600">{{ billsStore.tableBill.remainingAmount.toFixed(2) }} RON</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Orders by Device -->
          <div v-for="(orders, deviceId) in billsStore.tableBill.ordersByDevice" :key="deviceId" class="space-y-2">
            <h3 class="font-semibold">
              <span v-if="orders[0]?.customerName" class="flex gap-2 items-center">
                <span class="text-lg">👤</span>
                <span>{{ orders[0].customerName }}</span>
              </span>
              <span v-else>Device: {{ deviceId === 'unknown' ? 'Unknown' : (deviceId as string).slice(0, 8) }}</span>
            </h3>
            <Card>
              <CardContent class="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Payment Details</TableHead>
                      <TableHead>Order Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Select</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="order in orders" :key="order.id">
                      <TableCell class="font-mono text-xs">{{ order.id.slice(0, 8) }}</TableCell>
                      <TableCell>
                        <div class="text-sm">
                          {{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }}
                        </div>
                      </TableCell>
                      <TableCell>{{ order.total.toFixed(2) }} RON</TableCell>
                      <TableCell>
                        <div>
                          {{ (order.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0).toFixed(2) }} RON
                        </div>
                        <div v-if="(order.payments?.reduce((sum: number, p: any) => sum + (p.tipAmount || 0), 0) || 0) > 0" class="text-xs text-blue-600">
                          +{{ (order.payments?.reduce((sum: number, p: any) => sum + (p.tipAmount || 0), 0) || 0).toFixed(2) }} tip
                        </div>
                      </TableCell>
                      <TableCell>
                        <div v-if="order.payments && order.payments.length > 0" class="space-y-1">
                          <div v-for="payment in order.payments" :key="payment.id" class="text-xs">
                            <div class="flex gap-2 items-center">
                              <Badge 
                                :variant="payment.paymentType === 'CASH' ? 'default' : 'secondary'"
                                :class="payment.paymentType === 'CASH' ? 'bg-green-600' : 'bg-blue-600'"
                                class="flex gap-1 items-center"
                                :title="payment.paymentType === 'CASH' ? 'Numerar' : payment.paymentType === 'POS' ? 'POS' : 'N/A'"
                              >
                                <DollarSign v-if="payment.paymentType === 'CASH'" class="w-3 h-3" />
                                <CreditCard v-else-if="payment.paymentType === 'POS'" class="w-3 h-3" />
                                <X v-else class="w-3 h-3" />
                              </Badge>
                              <span v-if="payment.tipAmount > 0" class="text-blue-600">
                                +{{ payment.tipAmount.toFixed(2) }} tip
                              </span>
                            </div>
                            <div class="mt-1 text-muted-foreground">
                              {{ payment.amount.toFixed(2) }} RON
                              <span v-if="payment.tipAmount > 0"> + {{ payment.tipAmount.toFixed(2) }} = {{ payment.total.toFixed(2) }} RON</span>
                            </div>
                          </div>
                        </div>
                        <span v-else class="text-xs text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          :variant="order.status === 'READY' ? 'default' : order.status === 'SERVED' ? 'secondary' : 'outline'"
                          :class="order.status === 'READY' ? 'bg-green-600' : ''"
                          class="flex gap-1 items-center"
                          :title="order.status"
                        >
                          <CheckCircle v-if="order.status === 'READY'" class="w-3 h-3" />
                          <Circle v-else-if="order.status === 'SERVED'" class="w-3 h-3" />
                          <Clock v-else class="w-3 h-3" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge :variant="order.paymentStatus === 'PAID' ? 'default' : 'secondary'" class="flex gap-1 items-center" :title="order.paymentStatus">
                          <CheckCircle v-if="order.paymentStatus === 'PAID'" class="w-3 h-3" />
                          <Clock v-else class="w-3 h-3" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          v-if="order.status === 'READY'"
                          size="sm"
                          @click.stop="markAsServed(order.id)"
                          class="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle class="mr-1 w-4 h-4" />
                          Mark Served
                        </Button>
                        <span v-else class="text-xs text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          :checked="selectedOrders.includes(order.id)"
                          @change="(e) => {
                            if ((e.target as HTMLInputElement).checked) {
                              selectedOrders.push(order.id)
                            } else {
                              selectedOrders = selectedOrders.filter(id => id !== order.id)
                            }
                          }"
                          :disabled="order.paymentStatus === 'PAID'"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div class="flex gap-2 justify-end">
            <Button variant="outline" @click="closeBillDialog">Close</Button>
            <Button @click="openPaymentDialog" :disabled="billsStore.tableBill.remainingAmount <= 0">
              <DollarSign class="mr-2 w-4 h-4" />
              Process Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Payment Dialog -->
    <Dialog :open="paymentDialogOpen" @update:open="paymentDialogOpen = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4">
          <div>
            <Label>Selected Orders Total</Label>
            <p class="text-2xl font-bold">{{ selectedOrdersTotal.toFixed(2) }} RON</p>
          </div>

          <div>
            <Label>Tip de Plată</Label>
            <Select @update:modelValue="(value: any) => paymentType = value" :modelValue="paymentType">
              <SelectTrigger>
                <SelectValue placeholder="Selectează tipul de plată" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Numerar</SelectItem>
                <SelectItem value="POS">POS / Card</SelectItem>
              </SelectContent>
            </Select>
            <p v-if="currentBillRequest" class="mt-1 text-xs text-muted-foreground">
              Clientul a solicitat: {{ currentBillRequest.paymentType === 'CASH' ? 'Numerar' : 'POS' }}
            </p>
          </div>

          <div>
            <Label>Bacșiș</Label>
            <Select @update:modelValue="handleTipSelection" :modelValue="tipSelectValue">
              <SelectTrigger>
                <SelectValue placeholder="Select tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="option in tipOptions" 
                  :key="String(option.value)" 
                  :value="String(option.value)"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="currentBillRequest && currentBillRequest.tipAmount > 0" class="mt-1 text-xs text-muted-foreground">
              Clientul a solicitat: {{ currentBillRequest.tipType === 'PERCENTAGE' ? `${currentBillRequest.tipValue}%` : `${currentBillRequest.tipAmount.toFixed(2)} RON` }} bacșiș
            </p>
            
            <div v-if="showCustomPercentageInput" class="mt-2 space-y-2">
              <Label>Custom Tip (Percentage)</Label>
              <Input
                type="number"
                v-model.number="tipValue"
                placeholder="Enter percentage (e.g., 18)"
                min="0"
                max="100"
              />
            </div>
            
            <!-- BUGFIX #11: Fixed custom tip amount calculation -->
            <div v-if="tipType === 'AMOUNT'" class="mt-2 space-y-2">
              <Label>Valoare Bacșiș (RON)</Label>
              <Input
                type="number"
                v-model.number="customTipAmount"
                placeholder="Ex: 10"
                min="0"
                step="0.01"
              />
              <p class="text-xs text-muted-foreground">
                Se va adăuga {{ customTipAmount || 0 }} RON fix, nu procent.
              </p>
            </div>
          </div>

          <div v-if="tipAmount > 0" class="p-3 rounded-lg bg-muted">
            <div class="flex justify-between text-sm">
              <span>Tip Amount:</span>
              <span class="font-semibold">{{ tipAmount.toFixed(2) }} RON</span>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-primary/10">
            <div class="flex justify-between text-lg font-bold">
              <span>Total to Pay:</span>
              <span>{{ totalWithTip.toFixed(2) }} RON</span>
            </div>
          </div>

          <div class="flex gap-2 justify-end">
            <Button variant="outline" @click="paymentDialogOpen = false">Cancel</Button>
            <Button @click="processPayment">
              <DollarSign class="mr-2 w-4 h-4" />
              Process Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Server Review Dialog -->
    <ServerReviewDialog
      :open="reviewDialogOpen"
      :order="selectedOrderForReview"
      @update:open="reviewDialogOpen = $event"
      @review="handleReview"
    />

    <!-- New Order Persistent Popup -->
    <Dialog :open="newOrderPopupOpen" @update:open="(val) => { if (!val) closeNewOrderPopup() }">
      <DialogContent class="max-w-md border-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-2xl text-purple-700 dark:text-purple-300">
            <Bell class="w-6 h-6 animate-bounce" />
            Comandă Nouă!
          </DialogTitle>
        </DialogHeader>
        
        <div v-if="newOrderPopupOrder" class="space-y-4">
          <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-xl font-bold">Masă: {{ newOrderPopupOrder.table?.name || 'N/A' }}</h3>
              <Badge class="bg-purple-600 text-white text-lg px-3 py-1">
                {{ newOrderPopupOrder.total.toFixed(2) }} RON
              </Badge>
            </div>
            
            <div class="space-y-2">
              <div
                v-for="item in newOrderPopupOrder.items"
                :key="item.id"
                class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <span class="font-medium">{{ item.quantity }}x {{ item.product?.name || 'Produs' }}</span>
                <span class="text-muted-foreground">{{ (item.quantity * item.priceSnapshot).toFixed(2) }} RON</span>
              </div>
            </div>
            
            <div v-if="newOrderPopupOrder.notes" class="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-sm">
              <strong>Notă:</strong> {{ newOrderPopupOrder.notes }}
            </div>
          </div>
          
          <div class="flex gap-3">
            <Button 
              @click="closeNewOrderPopup()" 
              variant="outline" 
              class="flex-1"
            >
              <X class="w-4 h-4 mr-2" />
              Închide
            </Button>
            <Button 
              @click="handleReviewFromPopup()" 
              class="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Eye class="w-4 h-4 mr-2" />
              Revizuiește
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- BIG NOTIFICATION POPUP - Shows for ALL notifications regardless of location -->
    <Dialog :open="notificationPopupOpen" @update:open="(val) => { if (!val) closeNotificationPopup() }">
      <DialogContent class="max-w-lg border-8 border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse">
        <DialogHeader>
          <DialogTitle class="flex items-center justify-center gap-3 text-3xl font-bold text-red-700 dark:text-red-300">
            <Bell class="w-10 h-10 animate-bounce" />
            {{ notificationPopupData?.title }}
          </DialogTitle>
        </DialogHeader>
        
        <div v-if="notificationPopupData" class="space-y-6 text-center">
          <div class="p-6 bg-white dark:bg-gray-800 rounded-xl border-4 border-red-300 shadow-2xl">
            <div class="mb-4">
              <span class="text-6xl">
                {{ notificationPopupData.type === 'order' ? '📋' : notificationPopupData.type === 'bill' ? '💰' : '🔔' }}
              </span>
            </div>
            <h3 class="text-2xl font-bold mb-2">{{ notificationPopupData.tableName }}</h3>
            <p class="text-xl text-gray-700 dark:text-gray-300">{{ notificationPopupData.message }}</p>
          </div>
          
          <div class="flex gap-4">
            <Button 
              @click="closeNotificationPopup()" 
              variant="outline" 
              size="lg"
              class="flex-1 text-lg"
            >
              <X class="w-5 h-5 mr-2" />
              Închide
            </Button>
            <Button 
              @click="handleNotificationAction()" 
              size="lg"
              :class="{
                'flex-1 text-lg': true,
                'bg-purple-600 hover:bg-purple-700': notificationPopupData?.type === 'order',
                'bg-green-600 hover:bg-green-700': notificationPopupData?.type === 'bill',
                'bg-blue-600 hover:bg-blue-700': notificationPopupData?.type === 'waiter'
              }"
            >
              <Eye class="w-5 h-5 mr-2" />
              {{ notificationPopupData?.type === 'order' ? 'Revizuiește' : notificationPopupData?.type === 'bill' ? 'Procesează' : 'Vezi Masă' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
