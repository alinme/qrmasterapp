<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  order: any | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'review': [serverNotes: string, sendToKitchen: boolean]
}>()

const serverNotes = ref('')
const sendToKitchen = ref(true)

watch(() => props.open, (newVal) => {
  if (newVal && props.order) {
    serverNotes.value = props.order.serverNotes || ''
    sendToKitchen.value = true
  }
})

function handleReview() {
  emit('review', serverNotes.value, sendToKitchen.value)
  emit('update:open', false)
  serverNotes.value = ''
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Revizuire Comandă - #{{ order?.id.slice(0, 8) }}</DialogTitle>
      </DialogHeader>

      <div v-if="order" class="space-y-4">
        <!-- Order Info -->
        <Card>
          <CardHeader>
            <div class="flex justify-between items-start">
              <div>
                <CardTitle class="text-lg">Masă: {{ order.table?.name }}</CardTitle>
                <p class="text-sm text-muted-foreground mt-1">{{ formatDate(order.createdAt) }}</p>
                <div v-if="order.customerName" class="flex items-center gap-2 mt-2">
                  <span v-if="order.customerAvatar" class="text-2xl">{{ order.customerAvatar }}</span>
                  <span v-else class="text-2xl">👤</span>
                  <span class="font-semibold text-base">{{ order.customerName }}</span>
                </div>
              </div>
              <Badge variant="secondary">Total: {{ order.total.toFixed(2) }} RON</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <!-- Order Items -->
            <div class="space-y-2">
              <h4 class="font-semibold mb-2">Produse:</h4>
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex justify-between text-sm p-2 rounded border"
              >
                <div class="flex-1">
                  <span class="font-medium">{{ item.quantity }}x {{ item.product.name }}</span>
                  <p v-if="item.notes" class="text-xs text-muted-foreground mt-0.5">
                    Note client: {{ item.notes }}
                  </p>
                </div>
                <span class="text-gray-700 ml-4">
                  {{ (item.priceSnapshot * item.quantity).toFixed(2) }} RON
                </span>
              </div>
            </div>

            <!-- Customer Notes -->
            <div v-if="order.notes" class="mt-4 pt-4 border-t">
              <p class="text-sm">
                <span class="font-medium">Note client:</span>
                <span class="text-muted-foreground ml-2">{{ order.notes }}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Server Notes -->
        <div class="space-y-2">
          <Label for="serverNotes">Note server (opțional):</Label>
          <Textarea
            id="serverNotes"
            v-model="serverNotes"
            rows="4"
            placeholder="Adaugă note pentru bucătărie, modificări, instrucțiuni speciale..."
            class="min-h-[100px]"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            @click="sendToKitchen = false; handleReview()"
            class="flex-1"
          >
            <X class="mr-2 w-4 h-4" />
            Salvează fără trimitere
          </Button>
          <Button
            @click="handleReview()"
            class="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Send class="mr-2 w-4 h-4" />
            Trimite la Bucătărie
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
