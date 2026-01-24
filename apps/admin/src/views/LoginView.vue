<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const email = ref('admin@demo.com')
const password = ref('password')
const error = ref('')
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()

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
      <CardFooter class="justify-center text-sm text-muted-foreground">
        Demo: admin@demo.com / password
      </CardFooter>
    </Card>
  </div>
</template>
