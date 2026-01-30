<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSuperAdminStore } from '@/stores/superadmin'
import { Building2, Users, Plus, Edit, Trash2, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const superAdminStore = useSuperAdminStore()
const restaurant = ref<any>(null)
const loading = ref(true)
const editingRestaurant = ref(false)
const userDialogOpen = ref(false)
const editingUser = ref<any>(null)
const uploadingLogo = ref(false)

const restaurantForm = ref({
  name: '',
  slug: '',
  address: '',
  logoUrl: '',
  phoneNumber: '',
  contactPerson: '',
  contractStart: '',
  contractEnd: ''
})

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const userForm = ref({
  email: '',
  password: '',
  role: 'RESTAURANT_ADMIN'
})

onMounted(async () => {
  const id = route.params.id as string
  await loadRestaurant(id)
})

async function loadRestaurant(id: string) {
  loading.value = true
  try {
    const data = await superAdminStore.fetchRestaurant(id)
    restaurant.value = data
    restaurantForm.value = {
      name: data.name,
      slug: data.slug,
      address: data.address || '',
      logoUrl: data.logoUrl || '',
      phoneNumber: data.phoneNumber || '',
      contactPerson: data.contactPerson || '',
      contractStart: data.contractStart ? data.contractStart.split('T')[0] : '',
      contractEnd: data.contractEnd ? data.contractEnd.split('T')[0] : ''
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to load restaurant')
  } finally {
    loading.value = false
  }
}

function startEditRestaurant() {
  editingRestaurant.value = true
}

async function saveRestaurant() {
  if (!restaurant.value) return
  
  try {
    const { logoUrl, ...updateData } = restaurantForm.value
    await superAdminStore.updateRestaurant(restaurant.value.id, updateData)
    await loadRestaurant(restaurant.value.id)
    editingRestaurant.value = false
    toast.success('Restaurant updated successfully')
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to update restaurant')
  }
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('ro-RO')
}

function cancelEditRestaurant() {
  if (restaurant.value) {
    restaurantForm.value = {
      name: restaurant.value.name,
      slug: restaurant.value.slug,
      address: restaurant.value.address || '',
      logoUrl: restaurant.value.logoUrl || '',
      phoneNumber: restaurant.value.phoneNumber || '',
      contactPerson: restaurant.value.contactPerson || '',
      contractStart: restaurant.value.contractStart ? restaurant.value.contractStart.split('T')[0] : '',
      contractEnd: restaurant.value.contractEnd ? restaurant.value.contractEnd.split('T')[0] : ''
    }
  }
  editingRestaurant.value = false
}

function openUserDialog(user?: any) {
  if (user) {
    editingUser.value = user
    userForm.value = {
      email: user.email,
      password: '',
      role: user.role
    }
  } else {
    editingUser.value = null
    userForm.value = {
      email: '',
      password: '',
      role: 'RESTAURANT_ADMIN'
    }
  }
  userDialogOpen.value = true
}

async function saveUser() {
  if (!restaurant.value) return
  
  try {
    if (editingUser.value) {
      await superAdminStore.updateUser(editingUser.value.id, {
        ...userForm.value,
        restaurantId: restaurant.value.id,
        password: userForm.value.password || undefined
      })
      toast.success('User updated successfully')
    } else {
      if (!userForm.value.password) {
        toast.error('Password is required')
        return
      }
      await superAdminStore.createUser({
        ...userForm.value,
        restaurantId: restaurant.value.id
      })
      toast.success('User created successfully')
    }
    userDialogOpen.value = false
    await loadRestaurant(restaurant.value.id)
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to save user')
  }
}

async function deleteUser(id: string) {
  if (!confirm('Are you sure you want to delete this user?')) return
  
  try {
    await superAdminStore.deleteUser(id)
    await loadRestaurant(restaurant.value!.id)
    toast.success('User deleted successfully')
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to delete user')
  }
}

async function handleLogoUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !restaurant.value) return

  uploadingLogo.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post(
      `${API_URL}/superadmin/restaurants/${restaurant.value.id}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    )

    if (response.data.success) {
      await loadRestaurant(restaurant.value.id)
      toast.success('Logo uploaded successfully')
    }
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to upload logo')
  } finally {
    uploadingLogo.value = false
    if (target) target.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.push({ name: 'superadmin-restaurants' })">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Restaurants
      </Button>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Restaurant Details</h2>
        <p class="text-muted-foreground">Manage restaurant information and users</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p class="text-muted-foreground">Loading restaurant...</p>
    </div>

    <div v-else-if="!restaurant" class="text-center py-8 text-muted-foreground">
      <p>Restaurant not found</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Restaurant Information -->
      <Card>
        <CardHeader>
          <div class="flex justify-between items-center">
            <CardTitle class="flex items-center gap-2">
              <Building2 class="w-5 h-5" />
              Restaurant Information
            </CardTitle>
            <Button v-if="!editingRestaurant" variant="outline" size="sm" @click="startEditRestaurant">
              <Edit class="w-4 h-4 mr-2" />
              Edit
            </Button>
            <div v-else class="flex gap-2">
              <Button size="sm" @click="saveRestaurant">Save</Button>
              <Button size="sm" variant="outline" @click="cancelEditRestaurant">Cancel</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Logo -->
          <div>
            <Label>Restaurant Logo</Label>
            <div class="mt-2 flex gap-4 items-center">
              <div v-if="restaurant.logoUrl" class="overflow-hidden w-24 h-24 rounded-lg bg-muted shrink-0 border">
                <img
                  :src="restaurant.logoUrl.startsWith('http') ? restaurant.logoUrl : `http://localhost:3000${restaurant.logoUrl}`"
                  :alt="restaurant.name"
                  class="object-cover w-full h-full"
                />
              </div>
              <div v-else class="flex justify-center items-center w-24 h-24 rounded-lg bg-muted shrink-0 border">
                <ImageIcon class="w-8 h-8 text-muted-foreground" />
              </div>
              <div class="flex-1">
                <div class="flex flex-col gap-2">
                  <label class="cursor-pointer inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleLogoUpload"
                      :disabled="uploadingLogo"
                    />
                    <Button type="button" variant="outline" size="sm" :disabled="uploadingLogo">
                      <Upload class="w-4 h-4 mr-2" />
                      {{ uploadingLogo ? 'Uploading...' : 'Upload Logo' }}
                    </Button>
                  </label>
                  <p class="text-xs text-muted-foreground">JPG, PNG, or WebP (max 50MB)</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Label for="name">Restaurant Name</Label>
            <Input
              id="name"
              v-model="restaurantForm.name"
              :disabled="!editingRestaurant"
              placeholder="Restaurant Name"
            />
          </div>
          <div>
            <Label for="slug">URL Slug</Label>
            <Input
              id="slug"
              v-model="restaurantForm.slug"
              :disabled="!editingRestaurant"
              placeholder="restaurant-slug"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Menu will be available at /r/{{ restaurantForm.slug }}
            </p>
          </div>
          <div>
            <Label for="address">Address</Label>
            <Textarea
              id="address"
              v-model="restaurantForm.address"
              :disabled="!editingRestaurant"
              placeholder="Restaurant Address"
              rows="2"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                v-model="restaurantForm.phoneNumber"
                :disabled="!editingRestaurant"
                placeholder="+40 123 456 789"
              />
            </div>
            <div>
              <Label for="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                v-model="restaurantForm.contactPerson"
                :disabled="!editingRestaurant"
                placeholder="Contact Person Name"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="contractStart">Contract Start Date</Label>
              <Input
                id="contractStart"
                v-model="restaurantForm.contractStart"
                :disabled="!editingRestaurant"
                type="date"
              />
            </div>
            <div>
              <Label for="contractEnd">Contract End Date</Label>
              <Input
                id="contractEnd"
                v-model="restaurantForm.contractEnd"
                :disabled="!editingRestaurant"
                type="date"
              />
            </div>
          </div>
          <!-- Display contract dates when not editing -->
          <div v-if="!editingRestaurant && (restaurant?.contractStart || restaurant?.contractEnd)" class="p-3 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground">
              <span class="font-medium">Contract Period:</span>
              {{ formatDate(restaurant?.contractStart) }} - {{ formatDate(restaurant?.contractEnd) }}
            </p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p class="text-xs text-muted-foreground">Users</p>
              <p class="text-lg font-semibold">{{ restaurant.users?.length || 0 }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Categories</p>
              <p class="text-lg font-semibold">{{ restaurant._count?.categories || 0 }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Products</p>
              <p class="text-lg font-semibold">{{ restaurant._count?.products || 0 }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Orders</p>
              <p class="text-lg font-semibold">{{ restaurant._count?.orders || 0 }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Users Management -->
      <Card>
        <CardHeader>
          <div class="flex justify-between items-center">
            <CardTitle class="flex items-center gap-2">
              <Users class="w-5 h-5" />
              Users ({{ restaurant.users?.length || 0 }})
            </CardTitle>
            <Dialog :open="userDialogOpen" @update:open="userDialogOpen = $event">
              <DialogTrigger as-child>
                <Button @click="openUserDialog()">
                  <Plus class="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{{ editingUser ? 'Edit User' : 'Add User' }}</DialogTitle>
                </DialogHeader>
                <div class="space-y-4">
                  <div>
                    <Label for="user-email">Email</Label>
                    <Input id="user-email" v-model="userForm.email" type="email" required />
                  </div>
                  <div>
                    <Label for="user-password">
                      {{ editingUser ? 'New Password (leave empty to keep current)' : 'Password' }}
                    </Label>
                    <Input id="user-password" v-model="userForm.password" type="password" :required="!editingUser" />
                  </div>
                  <div>
                    <Label for="user-role">Role</Label>
                    <Select v-model="userForm.role">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESTAURANT_ADMIN">Restaurant Admin</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="KITCHEN">Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="flex justify-end gap-2">
                    <Button variant="outline" @click="userDialogOpen = false">Cancel</Button>
                    <Button @click="saveUser">Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="!restaurant.users || restaurant.users.length === 0" class="text-center py-8 text-muted-foreground">
            <p>No users found</p>
            <p class="text-sm mt-2">Add your first user to get started</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="user in restaurant.users"
              :key="user.id"
              class="flex justify-between items-center p-3 rounded-lg border"
            >
              <div>
                <p class="font-medium">{{ user.email }}</p>
                <p class="text-sm text-muted-foreground">{{ user.role }}</p>
              </div>
              <div class="flex gap-2">
                <Button variant="ghost" size="sm" @click="openUserDialog(user)">
                  <Edit class="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="deleteUser(user.id)">
                  <Trash2 class="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
