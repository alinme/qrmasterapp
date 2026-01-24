<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

const email = ref('')
const password = ref('')
const restaurantName = ref('')
const restaurantSlug = ref('')
const error = ref('')
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()

async function handleRegister() {
  error.value = ''
  loading.value = true
  
  try {
    const success = await auth.register({
      email: email.value,
      password: password.value,
      restaurantName: restaurantName.value,
      restaurantSlug: restaurantSlug.value
    })
    
    if (success) {
      router.push('/')
    } else {
      error.value = 'Registration failed'
    }
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Registration failed'
  }
  
  loading.value = false
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-950">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register Restaurant</CardTitle>
        <CardDescription>Create your restaurant account</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-2">
            <Label for="r-name">Restaurant Name</Label>
            <Input id="r-name" v-model="restaurantName" placeholder="My Awesome Bistro" required />
          </div>
          <div class="space-y-2">
            <Label for="r-slug">URL Slug</Label>
            <Input id="r-slug" v-model="restaurantSlug" placeholder="my-awesome-bistro" required />
            <p class="text-xs text-muted-foreground">Your menu will be at /menu/{{ restaurantSlug }}</p>
          </div>
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
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </Button>
        </form>
      </CardContent>
      <CardFooter class="justify-center text-sm text-muted-foreground">
        Already have an account? <RouterLink to="/login" class="underline ml-1">Login</RouterLink>
      </CardFooter>
    </Card>
  </div>
</template>
