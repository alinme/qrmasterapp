import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'
import { useCartStore } from './cart'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const useOrderStore = defineStore('order', () => {
  const currentOrder = ref<any>(null)
  const orderStatus = ref<string>('RECEIVED')
  const socket = ref<Socket | null>(null)
  const loading = ref(false)

  function connectSocket(tableId: string) {
    if (socket.value?.connected) {
      return
    }

    socket.value = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      console.log('Socket connected')
      socket.value?.emit('join_table', tableId)
    })

    socket.value.on('order_status_updated', (data: any) => {
      const previousStatus = currentOrder.value?.status
      
      if (data.orderId === currentOrder.value?.id) {
        orderStatus.value = data.status
        if (data.order) {
          currentOrder.value = data.order
        }
        
        // Play notification sound for status changes
        if (previousStatus && previousStatus !== data.status) {
          playOrderNotificationSound(data.status)
        }
      }
      // Update orders list if order exists there
      const orderIndex = orders.value.findIndex(o => o.id === data.orderId)
      if (orderIndex !== -1 && data.order) {
        const oldStatus = orders.value[orderIndex].status
        orders.value[orderIndex] = data.order
        // Play sound if status changed to READY
        if (oldStatus !== 'READY' && data.order.status === 'READY') {
          playOrderNotificationSound('READY')
        }
      }
    })

    socket.value.on('order_created', (order: any) => {
      if (order.id === currentOrder.value?.id) {
        currentOrder.value = order
      }
      // Add to orders list if not already there
      const existingIndex = orders.value.findIndex(o => o.id === order.id)
      if (existingIndex === -1) {
        orders.value.unshift(order)
      } else {
        orders.value[existingIndex] = order
      }
    })

    socket.value.on('table_session_revoked', (data: any) => {
      console.log('Table session revoked:', data)
      // Clear session
      const cart = useCartStore()
      
      // Clear favorites for this restaurant before clearing session
      if (cart.restaurantSlug) {
        try {
          localStorage.removeItem(`favorites_${cart.restaurantSlug}`)
        } catch (e) {
          console.error('Failed to clear favorites', e)
        }
      }
      
      // Clear customer profile
      try {
        localStorage.removeItem('customer_profile')
      } catch (e) {
        console.error('Failed to clear customer profile', e)
      }
      
      cart.clearSession()
      
      // Clear orders - remove old orders from previous customers
      orders.value = []
      currentOrder.value = null
      
      // Disconnect socket
      disconnectSocket()
      
      // Redirect to thank you page immediately
      window.location.href = '/thank-you'
    })

    socket.value.on('payment_processed', () => {
      // Refresh orders when payment is processed
      fetchOrders()
    })

    socket.value.on('disconnect', () => {
      console.log('Socket disconnected')
    })
  }

  function disconnectSocket() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  function playOrderNotificationSound(status: string) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (status === 'READY') {
        // Special sound for READY status - more celebratory
        const frequencies = [523.25, 659.25, 783.99] // C, E, G chord
        frequencies.forEach((freq, index) => {
          setTimeout(() => {
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.value = freq
            oscillator.type = 'sine'
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.3)
          }, index * 100)
        })
      } else {
        // Standard notification for other status changes
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 600
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      }
    } catch (e) {
      console.log('Audio not available:', e)
    }
  }

  async function validateToken(): Promise<boolean> {
    const cart = useCartStore()
    if (!cart.tableToken) {
      return false
    }

    try {
      const response = await axios.post(`${API_URL}/public/validate-token`, {
        token: cart.tableToken
      })
      return response.data.success === true
    } catch (error) {
      console.error('Token validation failed', error)
      return false
    }
  }

  async function placeOrder(notes?: string) {
    const cart = useCartStore()
    loading.value = true

    try {
      if (!cart.tableToken || !cart.items.length) {
        throw new Error('Missing table token or cart is empty')
      }

      // Validate token before placing order
      const isValid = await validateToken()
      if (!isValid) {
        // Clear invalid session
        cart.clearSession()
        disconnectSocket()
        
        // Throw error with message - the UI will handle showing it and redirecting
        const error = new Error('Sesiunea a expirat. Te rugăm să scanezi din nou codul QR.')
        // Add a flag to indicate this is a token expiration
        ;(error as any).isTokenExpired = true
        throw error
      }

      const response = await axios.post(`${API_URL}/public/orders`, {
        tableToken: cart.tableToken,
        deviceId: cart.deviceId,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || null
        })),
        notes: notes || null,
        customerName: cart.customerProfile?.name || null,
        customerAvatar: cart.customerProfile?.avatar || null
      })

      if (response.data.success) {
        currentOrder.value = response.data.data
        orderStatus.value = response.data.data.status

        // Connect socket for real-time updates
        if (cart.tableId) {
          connectSocket(cart.tableId)
        }

        // Clear cart
        cart.clearCart()

        // Refresh orders list
        await fetchOrders()

        return response.data.data
      }
    } catch (error: any) {
      console.error('Failed to place order', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchOrder(orderId: string) {
    loading.value = true
    try {
      const response = await axios.get(`${API_URL}/public/orders/${orderId}`)
      if (response.data.success) {
        currentOrder.value = response.data.data
        orderStatus.value = response.data.data.status

        // Connect socket for real-time updates
        const cart = useCartStore()
        if (cart.tableId) {
          connectSocket(cart.tableId)
        }

        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch order', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const orders = ref<any[]>([])

  async function fetchOrders() {
    loading.value = true
    try {
      const cart = useCartStore()
      const params: any = {}
      
      if (cart.deviceId) {
        params.deviceId = cart.deviceId
      }
      if (cart.tableToken) {
        params.tableToken = cart.tableToken
      }

      if (!params.deviceId && !params.tableToken) {
        return []
      }

      const response = await axios.get(`${API_URL}/public/orders`, { params })
      if (response.data.success) {
        orders.value = response.data.data
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch orders', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    currentOrder,
    orderStatus,
    orders,
    loading,
    placeOrder,
    fetchOrder,
    fetchOrders,
    validateToken,
    connectSocket,
    disconnectSocket
  }
})
