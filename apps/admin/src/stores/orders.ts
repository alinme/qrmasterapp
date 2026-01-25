import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<any[]>([])
  const loading = ref(false)
  const socket = ref<Socket | null>(null)
  const authStore = useAuthStore()

  function connectSocket() {
    if (!authStore.user?.restaurantId) return
    if (socket.value?.connected) return

    socket.value = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      console.log('Admin socket connected')
      socket.value?.emit('join_restaurant', authStore.user.restaurantId)
    })

    socket.value.on('new_order', (order: any) => {
      // Add new order to the list
      const existingIndex = orders.value.findIndex(o => o.id === order.id)
      if (existingIndex === -1) {
        orders.value.unshift(order)
      } else {
        orders.value[existingIndex] = order
      }
    })

    socket.value.on('order_updated', (order: any) => {
      // Update existing order
      const index = orders.value.findIndex(o => o.id === order.id)
      if (index !== -1) {
        orders.value[index] = order
      }
    })

    socket.value.on('disconnect', () => {
      console.log('Admin socket disconnected')
    })
  }

  function disconnectSocket() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  async function fetchOrders(status?: string) {
    loading.value = true
    try {
      const params = status ? { status } : {}
      const response = await axios.get(`${API_URL}/orders`, { params })
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

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const response = await axios.put(`${API_URL}/orders/${orderId}/status`, { status })
      if (response.data.success) {
        // Socket will handle the update via order_updated event
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to update order status', error)
      throw error
    }
  }

  async function fetchOrder(orderId: string) {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`)
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch order', error)
      throw error
    }
  }

  async function reviewOrder(orderId: string, serverNotes?: string, sendToKitchen: boolean = true) {
    try {
      const response = await axios.post(`${API_URL}/orders/${orderId}/review`, {
        serverNotes,
        sendToKitchen
      })
      if (response.data.success) {
        // Socket will handle the update via order_updated event
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to review order', error)
      throw error
    }
  }

  return {
    orders,
    loading,
    socket,
    fetchOrders,
    updateOrderStatus,
    fetchOrder,
    reviewOrder,
    connectSocket,
    disconnectSocket
  }
})
