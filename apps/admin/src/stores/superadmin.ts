import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useSuperAdminStore = defineStore('superadmin', () => {
  const restaurants = ref<any[]>([])
  const users = ref<any[]>([])
  const stats = ref<any>(null)
  const loading = ref(false)

  async function fetchRestaurants() {
    loading.value = true
    try {
      const response = await axios.get(`${API_URL}/superadmin/restaurants`)
      if (response.data.success) {
        restaurants.value = response.data.data
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch restaurants', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchRestaurant(id: string) {
    try {
      const response = await axios.get(`${API_URL}/superadmin/restaurants/${id}`)
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch restaurant', error)
      throw error
    }
  }

  async function createRestaurant(restaurantData: any) {
    try {
      const response = await axios.post(`${API_URL}/superadmin/restaurants`, restaurantData)
      if (response.data.success) {
        await fetchRestaurants()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create restaurant', error)
      throw error
    }
  }

  async function updateRestaurant(id: string, restaurantData: any) {
    try {
      const response = await axios.put(`${API_URL}/superadmin/restaurants/${id}`, restaurantData)
      if (response.data.success) {
        await fetchRestaurants()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to update restaurant', error)
      throw error
    }
  }

  async function fetchUsers() {
    loading.value = true
    try {
      const response = await axios.get(`${API_URL}/superadmin/users`)
      if (response.data.success) {
        users.value = response.data.data
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch users', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createUser(userData: any) {
    try {
      const response = await axios.post(`${API_URL}/superadmin/users`, userData)
      if (response.data.success) {
        await fetchUsers()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create user', error)
      throw error
    }
  }

  async function updateUser(id: string, userData: any) {
    try {
      const response = await axios.put(`${API_URL}/superadmin/users/${id}`, userData)
      if (response.data.success) {
        await fetchUsers()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to update user', error)
      throw error
    }
  }

  async function deleteUser(id: string) {
    try {
      const response = await axios.delete(`${API_URL}/superadmin/users/${id}`)
      if (response.data.success) {
        await fetchUsers()
        return true
      }
    } catch (error) {
      console.error('Failed to delete user', error)
      throw error
    }
  }

  async function fetchStats() {
    try {
      const response = await axios.get(`${API_URL}/superadmin/stats`)
      if (response.data.success) {
        stats.value = response.data.data
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch stats', error)
      throw error
    }
  }

  return {
    restaurants,
    users,
    stats,
    loading,
    fetchRestaurants,
    fetchRestaurant,
    createRestaurant,
    updateRestaurant,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchStats
  }
})
