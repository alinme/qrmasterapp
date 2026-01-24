import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useCartStore } from './cart'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useBillsStore = defineStore('bills', () => {
  const tableBill = ref<any>(null)
  const loading = ref(false)

  async function fetchTableBill() {
    loading.value = true
    try {
      const cart = useCartStore()
      if (!cart.tableId || !cart.tableToken) {
        throw new Error('Table session required')
      }

      const response = await axios.get(`${API_URL}/public/tables/${cart.tableId}/bill`, {
        params: { tableToken: cart.tableToken }
      })
      
      if (response.data.success) {
        tableBill.value = response.data.data
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch table bill', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createPayment(paymentData: any) {
    try {
      const cart = useCartStore()
      if (!cart.tableToken) {
        throw new Error('Table token required')
      }

      const response = await axios.post(`${API_URL}/public/payments`, {
        ...paymentData,
        tableToken: cart.tableToken,
        deviceId: cart.deviceId
      })
      
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create payment', error)
      throw error
    }
  }

  async function requestBill(billData: any) {
    try {
      const cart = useCartStore()
      if (!cart.tableToken || !cart.tableId) {
        throw new Error('Table session required')
      }

      const response = await axios.post(`${API_URL}/public/tables/${cart.tableId}/request-bill`, {
        ...billData,
        tableToken: cart.tableToken,
        deviceId: cart.deviceId
      })
      
      if (response.data.success) {
        return response.data
      }
    } catch (error) {
      console.error('Failed to request bill', error)
      throw error
    }
  }

  return {
    tableBill,
    loading,
    fetchTableBill,
    createPayment,
    requestBill
  }
})
