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

  async function impersonate(targetUserId: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/impersonate`, { targetUserId })
      if (response.data.success) {
        // Store original user info before impersonating
        const originalUser = { ...user.value }
        localStorage.setItem('originalUser', JSON.stringify(originalUser))
        localStorage.setItem('originalToken', token.value as string)
        
        // Update to impersonated user
        token.value = response.data.data.token
        user.value = response.data.data.user
        
        localStorage.setItem('token', token.value as string)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        // Set new auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        
        return true
      }
    } catch (error) {
      console.error('Impersonation failed', error)
      throw error
    }
    return false
  }

  async function stopImpersonation() {
    try {
      const response = await axios.post(`${API_URL}/auth/stop-impersonation`)
      if (response.data.success) {
        // Restore original user
        token.value = response.data.data.token
        user.value = response.data.data.user
        
        localStorage.setItem('token', token.value as string)
        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.removeItem('originalUser')
        localStorage.removeItem('originalToken')
        
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        
        return true
      }
    } catch (error) {
      console.error('Stop impersonation failed', error)
      throw error
    }
    return false
  }

  const isImpersonating = computed(() => {
    return user.value?.impersonatedBy != null
  })

  const originalUser = computed(() => {
    const stored = localStorage.getItem('originalUser')
    return stored ? JSON.parse(stored) : null
  })

  return { 
    token, 
    user, 
    isAuthenticated, 
    isImpersonating,
    originalUser,
    login, 
    register, 
    logout,
    impersonate,
    stopImpersonation
  }
})
