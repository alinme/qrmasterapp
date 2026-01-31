<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStaffStore } from '@/stores/staff'
import { Plus, Trash2, Edit } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const staffStore = useStaffStore()
const dialogOpen = ref(false)
const editingStaff = ref<any>(null)
const formData = ref({
  email: '',
  password: '',
  role: 'STAFF'
})

onMounted(async () => {
  await staffStore.fetchStaff()
})

function openDialog(staff?: any) {
  if (staff) {
    editingStaff.value = staff
    formData.value = {
      email: staff.email,
      password: '',
      role: staff.role
    }
  } else {
    editingStaff.value = null
    formData.value = {
      email: '',
      password: '',
      role: 'STAFF'
    }
  }
  dialogOpen.value = true
}

async function handleSubmit() {
  try {
    if (editingStaff.value) {
      await staffStore.updateStaff(editingStaff.value.id, formData.value)
      toast.success('Staff member updated successfully')
    } else {
      if (!formData.value.password) {
        toast.error('Password is required')
        return
      }
      await staffStore.createStaff(formData.value)
      toast.success('Staff member created successfully')
    }
    dialogOpen.value = false
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to save staff member')
  }
}

async function handleDelete(id: string) {
  if (!confirm('Are you sure you want to delete this staff member?')) return
  
  try {
    await staffStore.deleteStaff(id)
    toast.success('Staff member deleted successfully')
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to delete staff member')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Staff Management</h2>
        <p class="text-muted-foreground">Manage staff members for your restaurant</p>
      </div>
      <Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
        <DialogTrigger as-child>
          <Button @click="openDialog()">
            <Plus class="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingStaff ? 'Edit Staff Member' : 'Add Staff Member' }}</DialogTitle>
          </DialogHeader>
          <div class="space-y-4">
            <div>
              <Label for="email">Email</Label>
              <Input id="email" v-model="formData.email" type="email" required />
            </div>
            <div>
              <Label for="password">{{ editingStaff ? 'New Password (leave empty to keep current)' : 'Password' }}</Label>
              <Input id="password" v-model="formData.password" type="password" :required="!editingStaff" />
            </div>
            <div>
              <Label for="role">Role</Label>
              <Select v-model="formData.role">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="KITCHEN">Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex justify-end gap-2">
              <Button variant="outline" @click="dialogOpen = false" :disabled="staffStore.isSaving">Cancel</Button>
              <Button @click="handleSubmit" :loading="staffStore.isSaving" :disabled="staffStore.isSaving">
                {{ staffStore.isSaving ? 'Saving...' : 'Save' }}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Skeleton Loader -->
    <div v-if="staffStore.loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 3" :key="i" class="hover:shadow-md transition-shadow">
        <CardHeader>
          <div class="flex justify-between items-start">
            <div class="space-y-2 flex-1">
              <Skeleton class="h-6 w-48" />
              <Skeleton class="h-4 w-20" />
            </div>
            <div class="flex gap-1">
              <Skeleton class="h-9 w-9" />
              <Skeleton class="h-9 w-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton class="h-3 w-32" />
        </CardContent>
      </Card>
    </div>

    <div v-else-if="staffStore.staff.length === 0" class="text-center py-8 text-muted-foreground">
      <p>No staff members found</p>
      <p class="text-sm mt-2">Add your first staff member to get started</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="staff in staffStore.staff"
        :key="staff.id"
        class="hover:shadow-md transition-shadow"
      >
        <CardHeader>
          <div class="flex justify-between items-start">
            <div>
              <CardTitle class="text-lg">{{ staff.email }}</CardTitle>
              <p class="text-sm text-muted-foreground mt-1">
                {{ staff.role }}
              </p>
            </div>
            <div class="flex gap-1">
              <Button variant="ghost" size="sm" @click="openDialog(staff)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" @click="handleDelete(staff.id)">
                <Trash2 class="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p class="text-xs text-muted-foreground">
            Added {{ new Date(staff.createdAt).toLocaleDateString() }}
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
