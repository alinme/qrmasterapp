import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// Ensure we point to server API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'))
  const router = useRouter()

  // Initialize axios header if token exists (for page refresh)
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      if (response.data.success) {
        token.value = response.data.data.token
        user.value = response.data.data.user
        
        localStorage.setItem('token', token.value as string)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        // Set default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        
        return true
      }
    } catch (e) {
      console.error(e)
      return false
    }
    return false
  }

  async function register(data: any) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data)
      if (response.data.success) {
         token.value = response.data.data.token
         user.value = response.data.data.user
         
         localStorage.setItem('token', token.value as string)
         localStorage.setItem('user', JSON.stringify(user.value))
         
         axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
         
         return true
      }
    } catch (error) {
       console.error('Registration failed', error)
       throw error
    }
    return false
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    router.push('/login')
  }

  return { token, user, isAuthenticated, login, register, logout }
})
