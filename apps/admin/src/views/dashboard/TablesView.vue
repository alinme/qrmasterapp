<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useTablesStore } from '@/stores/tables'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QrCode, Edit, Trash2, Copy, Download, Eye, Plus, FolderPlus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const tablesStore = useTablesStore()
const newTableName = ref('')
const newTableChairs = ref<number>(4)
const newTableForm = ref<string>('')
const newTableCategoryId = ref<string>('')
const editingTableId = ref<string | null>(null)
const editingTableName = ref('')
const editingTableChairs = ref<number>(4)
const editingTableForm = ref<string>('')
const editingTableCategoryId = ref<string>('')
const qrCodeData = ref<{ qrUrl: string; qrCodeImage: string; tableName: string } | null>(null)

// Category management
const newCategoryName = ref('')
const newCategoryDescription = ref('')
const categoryDialogOpen = ref(false)
const editingCategoryId = ref<string | null>(null)
const editingCategoryName = ref('')
const editingCategoryDescription = ref('')

const tableFormOptions = [
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' },
  { value: 'oval', label: 'Oval' },
  { value: 'rectangular', label: 'Rectangular' }
]

// Group tables by category
const tablesByCategory = computed(() => {
  const grouped: Record<string, { category: any; tables: any[] }> = {}
  
  // First add all categories (even empty ones)
  tablesStore.categories.forEach(cat => {
    grouped[cat.id] = { category: cat, tables: [] }
  })
  
  // Add uncategorized
  grouped['uncategorized'] = { category: { id: 'uncategorized', name: 'Uncategorized', sortOrder: 999 }, tables: [] }
  
  // Distribute tables
  tablesStore.tables.forEach(table => {
    const categoryId = table.categoryId || 'uncategorized'
    if (grouped[categoryId]) {
      grouped[categoryId].tables.push(table)
    } else if (grouped['uncategorized']) {
      grouped['uncategorized'].tables.push(table)
    }
  })
  
  return Object.values(grouped).sort((a, b) => (a.category.sortOrder ?? 999) - (b.category.sortOrder ?? 999))
})

onMounted(async () => {
  await Promise.all([
    tablesStore.fetchTables(),
    tablesStore.fetchCategories()
  ])
})

async function addTable() {
  if (!newTableName.value.trim()) return
  try {
    await tablesStore.createTable(
      newTableName.value.trim(),
      newTableChairs.value || 4,
      newTableForm.value || undefined,
      newTableCategoryId.value || undefined
    )
    newTableName.value = ''
    newTableChairs.value = 4
    newTableForm.value = ''
    newTableCategoryId.value = ''
    toast.success('Table created')
  } catch (error) {
    toast.error('Failed to create table')
  }
}

async function startEdit(table: any) {
  editingTableId.value = table.id
  editingTableName.value = table.name
  editingTableChairs.value = table.chairs || 4
  editingTableForm.value = table.form || ''
  editingTableCategoryId.value = table.categoryId || ''
}

async function saveEdit() {
  if (!editingTableId.value || !editingTableName.value.trim()) return
  try {
    await tablesStore.updateTable(
      editingTableId.value,
      editingTableName.value.trim(),
      editingTableChairs.value || 4,
      editingTableForm.value || undefined,
      editingTableCategoryId.value || null
    )
    editingTableId.value = null
    editingTableName.value = ''
    editingTableChairs.value = 4
    editingTableForm.value = ''
    editingTableCategoryId.value = ''
    toast.success('Table updated')
  } catch (error) {
    toast.error('Failed to update table')
  }
}

function cancelEdit() {
  editingTableId.value = null
  editingTableName.value = ''
  editingTableChairs.value = 4
  editingTableForm.value = ''
  editingTableCategoryId.value = ''
}

// Category functions
async function addCategory() {
  if (!newCategoryName.value.trim()) return
  try {
    await tablesStore.createCategory(
      newCategoryName.value.trim(),
      newCategoryDescription.value.trim() || undefined,
      tablesStore.categories.length
    )
    newCategoryName.value = ''
    newCategoryDescription.value = ''
    categoryDialogOpen.value = false
    toast.success('Category created')
  } catch (error) {
    toast.error('Failed to create category')
  }
}

function startEditCategory(category: any) {
  editingCategoryId.value = category.id
  editingCategoryName.value = category.name
  editingCategoryDescription.value = category.description || ''
}

async function saveEditCategory() {
  if (!editingCategoryId.value || !editingCategoryName.value.trim()) return
  try {
    await tablesStore.updateCategory(
      editingCategoryId.value,
      editingCategoryName.value.trim(),
      editingCategoryDescription.value.trim() || undefined
    )
    editingCategoryId.value = null
    editingCategoryName.value = ''
    editingCategoryDescription.value = ''
    toast.success('Category updated')
  } catch (error) {
    toast.error('Failed to update category')
  }
}

function cancelEditCategory() {
  editingCategoryId.value = null
  editingCategoryName.value = ''
  editingCategoryDescription.value = ''
}

async function deleteCategory(categoryId: string) {
  if (!confirm('Are you sure you want to delete this category? Tables will become uncategorized.')) return
  try {
    await tablesStore.deleteCategory(categoryId)
    toast.success('Category deleted')
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to delete category')
  }
}

async function deleteTable(tableId: string) {
  if (!confirm('Are you sure you want to delete this table?')) return
  try {
    await tablesStore.deleteTable(tableId)
  } catch (error) {
    alert('Failed to delete table')
  }
}

async function viewQR(tableId: string, tableName: string) {
  try {
    const data = await tablesStore.viewQR(tableId)
    if (data) {
      const qrUrl = data.qrUrl || ''
      qrCodeData.value = {
        qrUrl: qrUrl,
        qrCodeImage: data.qrCodeImage || '',
        tableName
      }
    } else {
      toast.error('No active QR code found. Please generate one first.')
    }
  } catch (error: any) {
    console.error('Failed to view QR code:', error)
    toast.error(error.response?.data?.error || 'Failed to view QR code')
  }
}

async function generateQR(tableId: string, tableName: string) {
  try {
    const data = await tablesStore.generateToken(tableId)
    if (data) {
      const qrUrl = data.qrUrl || ''
      qrCodeData.value = {
        qrUrl: qrUrl,
        qrCodeImage: data.qrCodeImage || '',
        tableName
      }
      toast.success('New QR code generated')
    } else {
      toast.error('Failed to generate QR code: No data returned. Check server CUSTOMER_APP_URL env variable.')
    }
  } catch (error: any) {
    console.error('Failed to generate QR code:', error)
    toast.error('Failed to generate QR code: ' + (error.response?.data?.error || error.message))
  }
}

function downloadQR() {
  if (!qrCodeData.value?.qrCodeImage) return
  const link = document.createElement('a')
  link.href = qrCodeData.value.qrCodeImage
  link.download = `qr-table-${qrCodeData.value.tableName}.png`
  link.click()
}

function copyQRUrl() {
  if (!qrCodeData.value?.qrUrl) return
  navigator.clipboard.writeText(qrCodeData.value.qrUrl)
  alert('QR URL copied to clipboard!')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Table Management</h2>
        <p class="mt-1 text-muted-foreground">Create tables and generate QR codes for customers</p>
      </div>
      <Button @click="categoryDialogOpen = true" variant="outline">
        <FolderPlus class="mr-2 w-4 h-4" />
        Manage Categories
      </Button>
    </div>

    <!-- Add Table Form -->
    <Card>
      <CardHeader>
        <CardTitle>Add New Table</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-wrap gap-4">
          <Input v-model="newTableName" placeholder="Table Name (e.g. Table 1)" class="flex-1 min-w-[200px]" />
          <Input 
            v-model.number="newTableChairs" 
            type="number" 
            placeholder="Chairs" 
            min="1"
            class="w-24"
          />
          <Select v-model="newTableForm">
            <SelectTrigger class="w-32">
              <SelectValue placeholder="Form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in tableFormOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="newTableCategoryId">
            <SelectTrigger class="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Category</SelectItem>
              <SelectItem v-for="category in tablesStore.categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button @click="addTable" :disabled="tablesStore.loading || !newTableName.trim()" class="bg-primary text-primary-foreground">
            <Plus class="mr-2 w-4 h-4" />
            Add Table
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Category Management Dialog -->
    <Dialog :open="categoryDialogOpen" @update:open="categoryDialogOpen = $event">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Table Categories</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <!-- Add New Category -->
          <div class="flex gap-2">
            <Input v-model="newCategoryName" placeholder="Category Name (e.g. Terrace, Bar)" class="flex-1" />
            <Input v-model="newCategoryDescription" placeholder="Description (optional)" class="flex-1" />
            <Button @click="addCategory" :disabled="!newCategoryName.trim()">
              <Plus class="mr-1 w-4 h-4" />
              Add
            </Button>
          </div>
          
          <!-- Categories List -->
          <div class="space-y-2">
            <div 
              v-for="category in tablesStore.categories" 
              :key="category.id"
              class="flex items-center gap-2 p-3 border rounded-lg"
            >
              <template v-if="editingCategoryId === category.id">
                <Input v-model="editingCategoryName" class="flex-1" />
                <Input v-model="editingCategoryDescription" placeholder="Description" class="flex-1" />
                <Button size="sm" @click="saveEditCategory">Save</Button>
                <Button size="sm" variant="outline" @click="cancelEditCategory">Cancel</Button>
              </template>
              <template v-else>
                <div class="flex-1">
                  <p class="font-medium">{{ category.name }}</p>
                  <p v-if="category.description" class="text-sm text-muted-foreground">{{ category.description }}</p>
                </div>
                <Badge>{{ category._count?.tables || 0 }} tables</Badge>
                <Button size="sm" variant="ghost" @click="startEditCategory(category)">
                  <Edit class="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" @click="deleteCategory(category.id)">
                  <Trash2 class="w-4 h-4 text-destructive" />
                </Button>
              </template>
            </div>
          </div>
          
          <div v-if="tablesStore.categories.length === 0" class="py-8 text-center text-muted-foreground">
            <p>No categories yet. Create one above.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Tables Grouped by Category -->
    <div class="space-y-6">
      <div v-if="tablesStore.loading && tablesStore.tables.length === 0" class="py-20 text-center">
        <div class="inline-block w-8 h-8 rounded-full border-b-2 animate-spin border-primary"></div>
        <p class="mt-4 text-muted-foreground">Loading tables...</p>
      </div>

      <div v-else-if="tablesStore.tables.length === 0" class="py-20 text-center">
        <p class="text-lg text-muted-foreground">No tables yet</p>
        <p class="mt-2 text-sm text-muted-foreground">Create your first table above</p>
      </div>

      <!-- Tables grouped by category -->
      <template v-else>
        <Card v-for="group in tablesByCategory" :key="group.category.id" class="overflow-hidden">
          <CardHeader class="bg-muted/50">
            <CardTitle class="flex items-center justify-between">
              <span>{{ group.category.name }}</span>
              <Badge variant="secondary">{{ group.tables.length }} tables</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <Table v-if="group.tables.length > 0">
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Chairs</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QR Token</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="table in group.tables" :key="table.id">
                  <TableCell class="font-medium">
                    <div v-if="editingTableId !== table.id">
                      <div>{{ table.name }}</div>
                      <div class="mt-1 text-xs text-muted-foreground">
                        <span v-if="table.chairs">{{ table.chairs }} chairs</span>
                        <span v-if="table.chairs && table.form"> • </span>
                        <span v-if="table.form" class="capitalize">{{ table.form }}</span>
                      </div>
                    </div>
                    <div v-else class="flex flex-col gap-2">
                      <Input v-model="editingTableName" class="w-48" />
                      <div class="flex flex-wrap gap-2">
                        <Input 
                          v-model.number="editingTableChairs" 
                          type="number" 
                          placeholder="Chairs" 
                          min="1"
                          class="w-20"
                        />
                        <Select v-model="editingTableForm">
                          <SelectTrigger class="w-28">
                            <SelectValue placeholder="Form" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem v-for="option in tableFormOptions" :key="option.value" :value="option.value">
                              {{ option.label }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select v-model="editingTableCategoryId">
                          <SelectTrigger class="w-32">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Category</SelectItem>
                            <SelectItem v-for="cat in tablesStore.categories" :key="cat.id" :value="cat.id">
                              {{ cat.name }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div class="flex gap-2">
                        <Button size="sm" @click="saveEdit">Save</Button>
                        <Button size="sm" variant="outline" @click="cancelEdit">Cancel</Button>
                      </div>
                </div>
              </TableCell>
              <TableCell>
                <span class="text-sm">{{ table.chairs || 4 }}</span>
              </TableCell>
              <TableCell>
                <span v-if="table.form" class="text-sm capitalize">{{ table.form }}</span>
                <span v-else class="text-sm text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                <Badge v-if="table.sessions?.length > 0" variant="default">Active QR</Badge>
                <Badge v-else variant="secondary">No QR</Badge>
              </TableCell>
              <TableCell>
                <div v-if="table.sessions?.length > 0" class="font-mono text-xs text-muted-foreground">
                  {{ table.sessions[0].token.slice(0, 20) }}...
                </div>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex gap-2 justify-end">
                  <Button 
                    v-if="editingTableId !== table.id"
                    size="sm" 
                    variant="outline"
                    @click="startEdit(table)"
                  >
                    <Edit class="w-4 h-4" />
                  </Button>
                  <Button 
                    v-if="table.sessions?.length > 0"
                    size="sm"
                    variant="outline"
                    @click="viewQR(table.id, table.name)"
                  >
                    <Eye class="mr-1 w-4 h-4" />
                    View QR
                  </Button>
                  <Button 
                    size="sm"
                    @click="generateQR(table.id, table.name)"
                    class="bg-primary text-primary-foreground"
                  >
                    <QrCode class="mr-1 w-4 h-4" />
                    Generate QR
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    @click="deleteTable(table.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div v-else class="p-8 text-center text-muted-foreground">
              No tables in this category
            </div>
          </CardContent>
        </Card>
      </template>
    </div>

    <!-- QR Code Dialog -->
    <Dialog :open="qrCodeData !== null" @update:open="qrCodeData = null">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - {{ qrCodeData?.tableName }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div class="flex justify-center p-4 bg-white rounded-lg">
            <img v-if="qrCodeData?.qrCodeImage" :src="qrCodeData.qrCodeImage" alt="QR Code" class="max-w-full rounded border" />
            <div v-else class="flex justify-center items-center w-64 h-64 rounded bg-muted text-muted-foreground">
              QR Code loading...
            </div>
          </div>
          <div class="space-y-2">
            <Label>QR URL:</Label>
            <div class="flex gap-2">
              <Input 
                :model-value="qrCodeData?.qrUrl" 
                readonly 
                class="flex-1 font-mono text-xs" 
                placeholder="No URL available"
              />
              <Button size="sm" @click="copyQRUrl" :disabled="!qrCodeData?.qrUrl">
                <Copy class="w-4 h-4" />
              </Button>
            </div>
            <p v-if="!qrCodeData?.qrUrl" class="text-xs text-destructive">
              ⚠️ Warning: QR URL is missing. Check server CUSTOMER_APP_URL environment variable.
            </p>
            <p v-else class="p-2 font-mono text-xs break-all rounded text-muted-foreground bg-muted">
              {{ qrCodeData.qrUrl }}
            </p>
          </div>
          <div class="flex gap-2">
            <Button @click="downloadQR" class="flex-1" :disabled="!qrCodeData?.qrCodeImage">
              <Download class="mr-2 w-4 h-4" />
              Download QR
            </Button>
            <Button variant="outline" @click="qrCodeData = null" class="flex-1">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
