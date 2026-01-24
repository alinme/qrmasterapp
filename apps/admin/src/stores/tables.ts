import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useTablesStore = defineStore('tables', () => {
  const tables = ref<any[]>([])
  const loading = ref(false)

  async function fetchTables() {
    loading.value = true
    try {
      const response = await axios.get(`${API_URL}/tables`)
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

  async function createTable(name: string, chairs?: number, form?: string) {
    try {
      const response = await axios.post(`${API_URL}/tables`, { name, chairs, form })
      if (response.data.success) {
        await fetchTables()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create table', error)
      throw error
    }
  }

  async function updateTable(tableId: string, name: string, chairs?: number, form?: string) {
    try {
      const response = await axios.put(`${API_URL}/tables/${tableId}`, { name, chairs, form })
      if (response.data.success) {
        await fetchTables()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to update table', error)
      throw error
    }
  }

  async function deleteTable(tableId: string) {
    try {
      const response = await axios.delete(`${API_URL}/tables/${tableId}`)
      if (response.data.success) {
        await fetchTables()
        return true
      }
    } catch (error) {
      console.error('Failed to delete table', error)
      throw error
    }
  }

  async function generateToken(tableId: string, expiresInHours?: number) {
    try {
      const response = await axios.post(`${API_URL}/tables/${tableId}/generate-token`, {
        expiresInHours
      })
      if (response.data.success) {
        await fetchTables()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to generate token', error)
      throw error
    }
  }

  async function revokeToken(tableId: string) {
    try {
      const response = await axios.post(`${API_URL}/tables/${tableId}/revoke-token`)
      if (response.data.success) {
        await fetchTables()
        return true
      }
    } catch (error) {
      console.error('Failed to revoke token', error)
      throw error
    }
  }

  async function viewQR(tableId: string) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/tables/${tableId}/qr`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to view QR', error)
      throw error
    }
  }

  return {
    tables,
    loading,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    generateToken,
    revokeToken,
    viewQR
  }
})
