<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSuperAdminStore } from '@/stores/superadmin'
import { useAuthStore } from '@/stores/auth'
import { Plus, Trash2, Edit, UserCircle } from 'lucide-vue-next'
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

onMounted(async () => {
  await Promise.all([
    superAdminStore.fetchUsers(),
    superAdminStore.fetchRestaurants()
  ])
})

function openDialog(user?: any) {
  if (user) {
    editingUser.value = user
    formData.value = {
      email: user.email,
      password: '',
      role: user.role,
      restaurantId: user.restaurantId || ''
    }
  } else {
    editingUser.value = null
    formData.value = {
      email: '',
      password: '',
      role: 'RESTAURANT_ADMIN',
      restaurantId: ''
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
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to save user')
  }
}

async function handleDelete(id: string) {
  if (!confirm('Are you sure you want to delete this user?')) return
  
  try {
    await superAdminStore.deleteUser(id)
    toast.success('User deleted successfully')
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
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Users</h2>
        <p class="text-muted-foreground">Manage all platform users</p>
      </div>
      <Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
        <DialogTrigger as-child>
          <Button @click="openDialog()">
            <Plus class="w-4 h-4 mr-2" />
            Add User
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
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="RESTAURANT_ADMIN">Restaurant Admin</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="KITCHEN">Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div v-if="formData.role !== 'SUPER_ADMIN'">
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

    <!-- Skeleton Loader -->
    <div v-if="superAdminStore.loading" class="space-y-4">
      <Card v-for="i in 3" :key="i" class="hover:shadow-md transition-shadow">
        <CardContent class="p-6">
          <div class="flex justify-between items-start">
            <div class="space-y-2 flex-1">
              <div class="flex items-center gap-2">
                <Skeleton class="h-5 w-48" />
                <Skeleton class="h-4 w-20" />
              </div>
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-3 w-40" />
            </div>
            <div class="flex gap-2">
              <Skeleton class="h-9 w-9" />
              <Skeleton class="h-9 w-9" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-else-if="superAdminStore.users.length === 0" class="text-center py-8 text-muted-foreground">
      <p>No users found</p>
    </div>

    <div v-else class="space-y-4">
      <Card
        v-for="user in superAdminStore.users"
        :key="user.id"
        class="hover:shadow-md transition-shadow"
      >
        <CardContent class="p-6">
          <div class="flex justify-between items-start">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <p class="font-semibold">{{ user.email }}</p>
                <span class="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                  {{ user.role }}
                </span>
              </div>
              <p v-if="user.restaurant" class="text-sm text-muted-foreground">
                Restaurant: {{ user.restaurant.name }}
              </p>
              <p class="text-xs text-muted-foreground">
                Created: {{ new Date(user.createdAt).toLocaleString() }}
              </p>
            </div>
            <div class="flex gap-2">
              <Button 
                v-if="['SERVER', 'KITCHEN', 'STAFF', 'RESTAURANT_ADMIN'].includes(user.role) && user.role !== authStore.user?.role" 
                variant="outline" 
                size="sm" 
                @click="handleImpersonate(user.id, user.email)"
                title="Impersonate this user"
              >
                <UserCircle class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" @click="openDialog(user)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" @click="handleDelete(user.id)">
                <Trash2 class="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
