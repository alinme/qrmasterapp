<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSuperAdminStore } from '@/stores/superadmin'
import { Building2, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const superAdminStore = useSuperAdminStore()
const router = useRouter()
const createDialogOpen = ref(false)
const restaurantForm = ref({
  name: '',
  slug: '',
  address: ''
})

onMounted(async () => {
  await superAdminStore.fetchRestaurants()
})

function openCreateDialog() {
  restaurantForm.value = {
    name: '',
    slug: '',
    address: ''
  }
  createDialogOpen.value = true
}

async function createRestaurant() {
  if (!restaurantForm.value.name || !restaurantForm.value.slug) {
    toast.error('Name and slug are required')
    return
  }
  
  try {
    const restaurant = await superAdminStore.createRestaurant(restaurantForm.value)
    createDialogOpen.value = false
    toast.success('Restaurant created successfully')
    router.push({ name: 'superadmin-restaurant-detail', params: { id: restaurant.id } })
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to create restaurant')
  }
}

function viewRestaurant(id: string) {
  router.push({ name: 'superadmin-restaurant-detail', params: { id } })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Restaurants</h2>
        <p class="text-muted-foreground">Manage all restaurants on the platform</p>
      </div>
      <Dialog :open="createDialogOpen" @update:open="createDialogOpen = $event">
        <DialogTrigger as-child>
          <Button @click="openCreateDialog()">
            <Plus class="w-4 h-4 mr-2" />
            Create Restaurant
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Restaurant</DialogTitle>
          </DialogHeader>
          <div class="space-y-4">
            <div>
              <Label for="name">Restaurant Name</Label>
              <Input id="name" v-model="restaurantForm.name" placeholder="Restaurant Name" required />
            </div>
            <div>
              <Label for="slug">URL Slug</Label>
              <Input id="slug" v-model="restaurantForm.slug" placeholder="restaurant-slug" required />
              <p class="text-xs text-muted-foreground mt-1">
                Menu will be available at /r/{{ restaurantForm.slug }}
              </p>
            </div>
            <div>
              <Label for="address">Address (Optional)</Label>
              <Textarea id="address" v-model="restaurantForm.address" placeholder="Restaurant Address" rows="2" />
            </div>
            <div class="flex justify-end gap-2">
              <Button variant="outline" @click="createDialogOpen = false">Cancel</Button>
              <Button @click="createRestaurant">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <div v-if="superAdminStore.loading" class="text-center py-8">
      <p class="text-muted-foreground">Loading restaurants...</p>
    </div>

    <div v-else-if="superAdminStore.restaurants.length === 0" class="text-center py-8 text-muted-foreground">
      <p>No restaurants found</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="restaurant in superAdminStore.restaurants"
        :key="restaurant.id"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewRestaurant(restaurant.id)"
      >
        <CardHeader>
          <div class="flex items-center gap-3">
            <div v-if="restaurant.logoUrl" class="overflow-hidden w-12 h-12 rounded-lg bg-muted shrink-0 border">
              <img
                :src="restaurant.logoUrl.startsWith('http') ? restaurant.logoUrl : `http://localhost:3000${restaurant.logoUrl}`"
                :alt="restaurant.name"
                class="object-cover w-full h-full"
              />
            </div>
            <div v-else class="flex justify-center items-center w-12 h-12 rounded-lg bg-muted shrink-0">
              <Building2 class="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle class="flex-1">{{ restaurant.name }}</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <p class="text-sm text-muted-foreground">Slug</p>
            <p class="font-medium">{{ restaurant.slug }}</p>
          </div>
          <div v-if="restaurant.address">
            <p class="text-sm text-muted-foreground">Address</p>
            <p class="text-sm">{{ restaurant.address }}</p>
          </div>
          <div class="grid grid-cols-3 gap-4 pt-2 border-t">
            <div>
              <p class="text-xs text-muted-foreground">Users</p>
              <p class="text-lg font-semibold">{{ restaurant.users?.length || 0 }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Orders</p>
              <p class="text-lg font-semibold">{{ restaurant._count?.orders || 0 }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Products</p>
              <p class="text-lg font-semibold">{{ restaurant._count?.products || 0 }}</p>
            </div>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Created</p>
            <p class="text-sm">{{ new Date(restaurant.createdAt).toLocaleDateString() }}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
