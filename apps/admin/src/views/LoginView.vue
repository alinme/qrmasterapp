<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const email = ref('admin@gmail.com')
const password = ref('password')
const error = ref('')
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()

const demoUsers = [
  { email: 'super@gmail.com', password: 'PParolamea00', role: 'Super Admin', description: 'Full system access' },
  { email: 'admin@gmail.com', password: 'password', role: 'Restaurant Admin', description: 'Restaurant management' },
  { email: 'kitchen@gmail.com', password: 'password', role: 'Kitchen', description: 'Kitchen orders view' },
  { email: 'waiter@gmail.com', password: 'password', role: 'Server', description: 'Table management' }
]

async function handleLogin() {
  error.value = ''
  loading.value = true
  
  const success = await auth.login(email.value, password.value)
  
  if (success) {
    router.push('/')
  } else {
    error.value = 'Invalid credentials'
  }
  
  loading.value = false
}

async function quickLogin(userEmail: string, userPassword: string) {
  email.value = userEmail
  password.value = userPassword
  await handleLogin()
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-950">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Admin Login</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" placeholder="admin@example.com" required />
          </div>
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input id="password" v-model="password" type="password" required />
          </div>
          <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
          
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </Button>
        </form>
      </CardContent>
      <CardFooter class="flex-col gap-4">
        <div class="w-full">
          <p class="text-sm font-medium text-muted-foreground mb-3">Quick Login as Demo User:</p>
          <div class="space-y-2">
            <button
              v-for="user in demoUsers"
              :key="user.email"
              type="button"
              @click="quickLogin(user.email, user.password)"
              :disabled="loading"
              class="w-full text-left px-3 py-2 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">{{ user.role }}</p>
                  <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
