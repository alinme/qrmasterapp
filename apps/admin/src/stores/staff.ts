import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useStaffStore = defineStore('staff', () => {
  const staff = ref<any[]>([])
  const loading = ref(false)
  const isSaving = ref(false)

  async function fetchStaff() {
    loading.value = true
    try {
      const response = await axios.get(`${API_URL}/users/staff`)
      if (response.data.success) {
        staff.value = response.data.data
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch staff', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createStaff(staffData: any) {
    isSaving.value = true
    try {
      const response = await axios.post(`${API_URL}/users/staff`, staffData)
      if (response.data.success) {
        await fetchStaff()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create staff', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateStaff(id: string, staffData: any) {
    isSaving.value = true
    try {
      const response = await axios.put(`${API_URL}/users/staff/${id}`, staffData)
      if (response.data.success) {
        await fetchStaff()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to update staff', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function deleteStaff(id: string) {
    isSaving.value = true
    try {
      const response = await axios.delete(`${API_URL}/users/staff/${id}`)
      if (response.data.success) {
        await fetchStaff()
        return true
      }
    } catch (error) {
      console.error('Failed to delete staff', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  return {
    staff,
    loading,
    isSaving,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff
  }
})
