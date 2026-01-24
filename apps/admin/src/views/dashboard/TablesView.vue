<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTablesStore } from '@/stores/tables'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QrCode, Edit, Trash2, Copy, Download, Eye } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const tablesStore = useTablesStore()
const newTableName = ref('')
const newTableChairs = ref<number>(4)
const newTableForm = ref<string>('')
const editingTableId = ref<string | null>(null)
const editingTableName = ref('')
const editingTableChairs = ref<number>(4)
const editingTableForm = ref<string>('')
const qrCodeData = ref<{ qrUrl: string; qrCodeImage: string; tableName: string } | null>(null)
const tableFormOptions = [
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' },
  { value: 'oval', label: 'Oval' },
  { value: 'rectangular', label: 'Rectangular' }
]

onMounted(() => {
  tablesStore.fetchTables()
})

async function addTable() {
  if (!newTableName.value.trim()) return
  try {
    await tablesStore.createTable(
      newTableName.value.trim(),
      newTableChairs.value || 4,
      newTableForm.value || undefined
    )
    newTableName.value = ''
    newTableChairs.value = 4
    newTableForm.value = ''
  } catch (error) {
    toast.error('Failed to create table')
  }
}

async function startEdit(table: any) {
  editingTableId.value = table.id
  editingTableName.value = table.name
  editingTableChairs.value = table.chairs || 4
  editingTableForm.value = table.form || ''
}

async function saveEdit() {
  if (!editingTableId.value || !editingTableName.value.trim()) return
  try {
    await tablesStore.updateTable(
      editingTableId.value,
      editingTableName.value.trim(),
      editingTableChairs.value || 4,
      editingTableForm.value || undefined
    )
    editingTableId.value = null
    editingTableName.value = ''
    editingTableChairs.value = 4
    editingTableForm.value = ''
  } catch (error) {
    toast.error('Failed to update table')
  }
}

function cancelEdit() {
  editingTableId.value = null
  editingTableName.value = ''
  editingTableChairs.value = 4
  editingTableForm.value = ''
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
    </div>

    <!-- Add Table Form -->
    <Card>
      <CardHeader>
        <CardTitle>Add New Table</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex gap-4">
          <Input v-model="newTableName" placeholder="Table Name (e.g. Table 1, Terrace)" class="flex-1" />
          <Input 
            v-model.number="newTableChairs" 
            type="number" 
            placeholder="Chairs" 
            min="1"
            class="w-32"
          />
          <Select v-model="newTableForm">
            <SelectTrigger class="w-40">
              <SelectValue placeholder="Form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in tableFormOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button @click="addTable" :disabled="tablesStore.loading || !newTableName.trim()" class="bg-primary text-primary-foreground">
            Add Table
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Tables Table -->
    <Card>
      <CardContent class="p-0">
        <div v-if="tablesStore.loading && tablesStore.tables.length === 0" class="py-20 text-center">
          <div class="inline-block w-8 h-8 rounded-full border-b-2 animate-spin border-primary"></div>
          <p class="mt-4 text-muted-foreground">Loading tables...</p>
        </div>

        <div v-else-if="tablesStore.tables.length === 0" class="py-20 text-center">
          <p class="text-lg text-muted-foreground">No tables yet</p>
          <p class="mt-2 text-sm text-muted-foreground">Create your first table above</p>
        </div>

        <Table v-else>
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
            <TableRow v-for="table in tablesStore.tables" :key="table.id">
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
                  <div class="flex gap-2">
                    <Input 
                      v-model.number="editingTableChairs" 
                      type="number" 
                      placeholder="Chairs" 
                      min="1"
                      class="w-24"
                    />
                    <Select v-model="editingTableForm">
                      <SelectTrigger class="w-32">
                        <SelectValue placeholder="Form" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="option in tableFormOptions" :key="option.value" :value="option.value">
                          {{ option.label }}
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
      </CardContent>
    </Card>

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
