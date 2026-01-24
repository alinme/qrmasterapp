import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import './assets/index.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize theme store
useThemeStore()

// Setup axios interceptor to handle 401 responses (after Pinia is initialized)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      // Only logout if we're not already on the login page
      if (router.currentRoute.value.name !== 'login') {
        authStore.logout()
      }
    }
    return Promise.reject(error)
  }
)

app.mount('#app')
