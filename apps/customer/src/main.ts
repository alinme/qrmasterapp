import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/index.css'
import './style.css'
// Import Inter fonts so Vite processes them correctly
import '@/assets/Inter.ttf'
import '@/assets/Inter-Italic.ttf'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
