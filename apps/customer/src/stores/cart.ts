import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

// Generate or retrieve device ID
function getDeviceId(): string {
  let deviceId = localStorage.getItem('device_id')
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('device_id', deviceId)
  }
  return deviceId
}

export interface CustomerProfile {
  name: string
  gender: 'male' | 'female'
  avatar: string | null
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const restaurantId = ref<string | null>(null)
  const tableId = ref<string | null>(null)
  const tableName = ref<string | null>(null)
  const tableToken = ref<string | null>(null)
  const restaurantSlug = ref<string | null>(null)
  const deviceId = ref<string>(getDeviceId())
  const customerProfile = ref<CustomerProfile | null>(null)

  // Load session from localStorage on init
  function loadSession() {
    try {
      const sessionStr = localStorage.getItem('table_session')
      if (sessionStr) {
        const session = JSON.parse(sessionStr)
        restaurantId.value = session.restaurantId || null
        tableId.value = session.tableId || null
        tableName.value = session.tableName || null
        tableToken.value = session.token || null
        restaurantSlug.value = session.restaurantSlug || null
      }
      
      // Load customer profile
      const profileStr = localStorage.getItem('customer_profile')
      if (profileStr) {
        customerProfile.value = JSON.parse(profileStr)
      }
    } catch (e) {
      console.error('Failed to load table session', e)
    }
  }

  function saveCustomerProfile(profile: CustomerProfile) {
    customerProfile.value = profile
    localStorage.setItem('customer_profile', JSON.stringify(profile))
  }

  loadSession()

  const total = computed(() => {
    return items.value.reduce((acc, item) => acc + item.price * item.quantity, 0)
  })

  const count = computed(() => {
    return items.value.reduce((acc, item) => acc + item.quantity, 0)
  })

  function addToCart(product: any, notes?: string) {
    const existingItem = items.value.find(i => i.productId === product.id && i.notes === notes)
    if (existingItem) {
      existingItem.quantity++
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        notes: notes || undefined
      })
    }
  }

  function updateItemNotes(productId: string, notes: string) {
    const item = items.value.find(i => i.productId === productId)
    if (item) {
      item.notes = notes || undefined
    }
  }

  function removeFromCart(productId: string) {
    const index = items.value.findIndex(i => i.productId === productId)
    if (index > -1 && items.value[index]) {
      if (items.value[index].quantity > 1) {
        items.value[index].quantity--
      } else {
        items.value.splice(index, 1)
      }
    }
  }

  function clearCart() {
    items.value = []
  }

  function clearSession() {
    items.value = []
    restaurantId.value = null
    tableId.value = null
    tableName.value = null
    tableToken.value = null
    restaurantSlug.value = null
    localStorage.removeItem('table_session')
  }

  return { 
    items, 
    total, 
    count, 
    restaurantId, 
    tableId,
    tableName,
    tableToken,
    restaurantSlug,
    deviceId,
    customerProfile,
    addToCart, 
    removeFromCart, 
    clearCart,
    loadSession,
    updateItemNotes,
    saveCustomerProfile,
    clearSession
  }
})
