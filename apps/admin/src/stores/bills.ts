import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useBillsStore = defineStore('bills', () => {
  const tables = ref<any[]>([])
  const tableBill = ref<any>(null)
  const loading = ref(false)

  async function fetchTables() {
    loading.value = true
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/bills/tables`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        tables.value = response.data.data
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch tables', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchTableBill(tableId: string) {
    loading.value = true
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/bills/tables/${tableId}/bill`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/bills/payments`, paymentData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create payment', error)
      throw error
    }
  }

  async function updateTableStatus(tableId: string, status: string) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(`${API_URL}/tables/${tableId}/status`, { status }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        // Update the table status in the local state immediately for instant UI update
        const tableIndex = tables.value.findIndex((t: any) => t.id === tableId)
        if (tableIndex !== -1) {
          tables.value[tableIndex].status = status
        }
        // Then refresh from server to get all updated data
        await fetchTables()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to update table status', error)
      throw error
    }
  }

  async function assignTable(tableId: string) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(`${API_URL}/tables/${tableId}/assign`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        await fetchTables()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to assign table', error)
      throw error
    }
  }

  async function releaseTable(tableId: string) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(`${API_URL}/tables/${tableId}/release`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        await fetchTables()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to release table', error)
      throw error
    }
  }

  async function fetchBillRequests() {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/bills/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch bill requests', error)
      return []
    }
  }

  async function fetchServerStats() {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/bills/server-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch server stats', error)
      throw error
    }
  }

  function clearTableBill() {
    tableBill.value = null
  }

  return {
    tables,
    tableBill,
    loading,
    fetchTables,
    fetchTableBill,
    createPayment,
    updateTableStatus,
    assignTable,
    releaseTable,
    fetchBillRequests,
    fetchServerStats,
    clearTableBill
  }
})
