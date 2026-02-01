<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSuperAdminStore } from '@/stores/superadmin'
import { useAuthStore } from '@/stores/auth'
import { Plus, Trash2, Edit, UserCircle, ChevronRight, Building2, Users, ArrowLeft } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useRouter } from 'vue-router'

const superAdminStore = useSuperAdminStore()
const authStore = useAuthStore()
const router = useRouter()
const dialogOpen = ref(false)
const editingUser = ref<any>(null)
const formData = ref({
  email: '',
  password: '',
  role: 'RESTAURANT_ADMIN',
  restaurantId: ''
})

// Selected restaurant to view users
const selectedRestaurant = ref<any>(null)
const restaurantUsers = ref<any[]>([])
const loadingUsers = ref(false)

// Get restaurants with their admin users
const restaurantsWithAdmins = computed(() => {
  return superAdminStore.restaurants.map(restaurant => {
    const admin = restaurant.users?.find((u: any) => u.role === 'RESTAURANT_ADMIN')
    const userCount = restaurant.users?.length || 0
    return {
      ...restaurant,
      admin,
      userCount
    }
  })
})

onMounted(async () => {
  await superAdminStore.fetchRestaurants()
})

async function selectRestaurant(restaurant: any) {
  selectedRestaurant.value = restaurant
  loadingUsers.value = true
  try {
    restaurantUsers.value = await superAdminStore.fetchUsersByRestaurant(restaurant.id)
  } catch (error) {
    toast.error('Failed to load restaurant users')
    restaurantUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

function goBack() {
  selectedRestaurant.value = null
  restaurantUsers.value = []
}

function openDialog(user?: any) {
  if (user) {
    editingUser.value = user
    formData.value = {
      email: user.email,
      password: '',
      role: user.role,
      restaurantId: user.restaurantId || selectedRestaurant.value?.id || ''
    }
  } else {
    editingUser.value = null
    formData.value = {
      email: '',
      password: '',
      role: selectedRestaurant.value ? 'SERVER' : 'RESTAURANT_ADMIN',
      restaurantId: selectedRestaurant.value?.id || ''
    }
  }
  dialogOpen.value = true
}

async function handleSubmit() {
  try {
    if (editingUser.value) {
      await superAdminStore.updateUser(editingUser.value.id, formData.value)
      toast.success('User updated successfully')
    } else {
      if (!formData.value.password) {
        toast.error('Password is required')
        return
      }
      await superAdminStore.createUser(formData.value)
      toast.success('User created successfully')
    }
    dialogOpen.value = false
    
    // Refresh users if viewing a restaurant
    if (selectedRestaurant.value) {
      restaurantUsers.value = await superAdminStore.fetchUsersByRestaurant(selectedRestaurant.value.id)
    }
    // Refresh restaurants list
    await superAdminStore.fetchRestaurants()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to save user')
  }
}

async function handleDelete(id: string) {
  if (!confirm('Are you sure you want to delete this user?')) return
  
  try {
    await superAdminStore.deleteUser(id)
    toast.success('User deleted successfully')
    
    // Refresh users if viewing a restaurant
    if (selectedRestaurant.value) {
      restaurantUsers.value = await superAdminStore.fetchUsersByRestaurant(selectedRestaurant.value.id)
    }
    // Refresh restaurants list
    await superAdminStore.fetchRestaurants()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to delete user')
  }
}

async function handleImpersonate(userId: string, userEmail: string) {
  if (!confirm(`Impersonate user ${userEmail}?`)) return
  
  try {
    await authStore.impersonate(userId)
    toast.success(`Now impersonating ${userEmail}`)
    router.push('/')
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to impersonate user')
  }
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'RESTAURANT_ADMIN': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    case 'SERVER': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'KITCHEN': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    case 'STAFF': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

function getRoleDisplayName(role: string) {
  switch (role) {
    case 'RESTAURANT_ADMIN': return 'Admin'
    case 'SERVER': return 'Waiter'
    case 'KITCHEN': return 'Kitchen'
    case 'STAFF': return 'Staff'
    default: return role
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-4">
        <Button v-if="selectedRestaurant" variant="ghost" size="sm" @click="goBack">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">
            {{ selectedRestaurant ? selectedRestaurant.name : 'Restaurants' }}
          </h2>
          <p class="text-muted-foreground">
            {{ selectedRestaurant ? 'Manage users for this restaurant' : 'Select a restaurant to view its users' }}
          </p>
        </div>
      </div>
      
      <Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
        <DialogTrigger as-child>
          <Button @click="openDialog()">
            <Plus class="w-4 h-4 mr-2" />
            {{ selectedRestaurant ? 'Add User' : 'Add Restaurant Admin' }}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingUser ? 'Edit User' : 'Create User' }}</DialogTitle>
          </DialogHeader>
          <div class="space-y-4">
            <div>
              <Label for="email">Email</Label>
              <Input id="email" v-model="formData.email" type="email" required />
            </div>
            <div>
              <Label for="password">{{ editingUser ? 'New Password (leave empty to keep current)' : 'Password' }}</Label>
              <Input id="password" v-model="formData.password" type="password" :required="!editingUser" />
            </div>
            <div>
              <Label for="role">Role</Label>
              <Select v-model="formData.role">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESTAURANT_ADMIN">Restaurant Admin</SelectItem>
                  <SelectItem value="SERVER">Server (Waiter)</SelectItem>
                  <SelectItem value="KITCHEN">Kitchen</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-if="!selectedRestaurant">
              <Label for="restaurant">Restaurant</Label>
              <Select v-model="formData.restaurantId">
                <SelectTrigger>
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="restaurant in superAdminStore.restaurants"
                    :key="restaurant.id"
                    :value="restaurant.id"
                  >
                    {{ restaurant.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex justify-end gap-2">
              <Button variant="outline" @click="dialogOpen = false" :disabled="superAdminStore.isSaving">Cancel</Button>
              <Button @click="handleSubmit" :loading="superAdminStore.isSaving" :disabled="superAdminStore.isSaving">
                {{ superAdminStore.isSaving ? 'Saving...' : 'Save' }}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Loading State -->
    <div v-if="superAdminStore.loading && !selectedRestaurant" class="space-y-4">
      <Card v-for="i in 3" :key="i" class="hover:shadow-md transition-shadow">
        <CardContent class="p-6">
          <div class="flex justify-between items-center">
            <div class="space-y-2 flex-1">
              <Skeleton class="h-6 w-48" />
              <Skeleton class="h-4 w-32" />
            </div>
            <Skeleton class="h-8 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Restaurant List View -->
    <div v-else-if="!selectedRestaurant" class="space-y-4">
      <div v-if="restaurantsWithAdmins.length === 0" class="text-center py-8 text-muted-foreground">
        <Building2 class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No restaurants found</p>
      </div>
      
      <Card
        v-for="restaurant in restaurantsWithAdmins"
        :key="restaurant.id"
        class="hover:shadow-md transition-shadow cursor-pointer"
        @click="selectRestaurant(restaurant)"
      >
        <CardContent class="p-6">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <Building2 class="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-lg">{{ restaurant.name }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <span v-if="restaurant.admin" class="text-sm text-muted-foreground">
                    Admin: {{ restaurant.admin.email }}
                  </span>
                  <span v-else class="text-sm text-orange-600">
                    No admin assigned
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <Badge variant="secondary" class="flex items-center gap-1">
                <Users class="w-3 h-3" />
                {{ restaurant.userCount }} users
              </Badge>
              <ChevronRight class="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Restaurant Users View -->
    <div v-else class="space-y-4">
      <!-- Loading Users -->
      <div v-if="loadingUsers" class="space-y-4">
        <Card v-for="i in 3" :key="i">
          <CardContent class="p-6">
            <div class="flex justify-between items-center">
              <div class="space-y-2 flex-1">
                <Skeleton class="h-5 w-48" />
                <Skeleton class="h-4 w-20" />
              </div>
              <div class="flex gap-2">
                <Skeleton class="h-9 w-9" />
                <Skeleton class="h-9 w-9" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-else-if="restaurantUsers.length === 0" class="text-center py-8 text-muted-foreground">
        <Users class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No users found for this restaurant</p>
        <p class="text-sm mt-2">Add users using the button above</p>
      </div>

      <Card
        v-for="user in restaurantUsers"
        :key="user.id"
        class="hover:shadow-md transition-shadow"
      >
        <CardContent class="p-6">
          <div class="flex justify-between items-start">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <p class="font-semibold">{{ user.email }}</p>
                <span :class="['px-2 py-1 text-xs rounded-full', getRoleBadgeColor(user.role)]">
                  {{ getRoleDisplayName(user.role) }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground">
                Created: {{ new Date(user.createdAt).toLocaleString() }}
              </p>
            </div>
            <div class="flex gap-2">
              <Button 
                v-if="user.role !== 'SUPER_ADMIN'" 
                variant="outline" 
                size="sm" 
                @click.stop="handleImpersonate(user.id, user.email)"
                title="Impersonate this user"
              >
                <UserCircle class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" @click.stop="openDialog(user)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" @click.stop="handleDelete(user.id)">
                <Trash2 class="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
