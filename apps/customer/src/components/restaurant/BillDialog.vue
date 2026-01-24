<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  total: number
  defaultMessage?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'send': [message: string]
}>()

const billMessage = ref(props.defaultMessage || 'Vă rog să-mi aduceți nota de plată.')

function sendRequest() {
  emit('send', billMessage.value)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Cerere Notă de Plată</DialogTitle>
        <DialogDescription>
          Totalul comenzii: <span class="text-lg font-bold">{{ total.toFixed(2) }} RON</span>
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <label class="block mb-2 text-sm font-medium">Mesaj pentru server:</label>
        <textarea
          v-model="billMessage"
          rows="3"
          placeholder="Vă rog să-mi aduceți nota de plată."
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">Anulează</Button>
        <Button @click="sendRequest" class="bg-green-600 hover:bg-green-700">
          <Bell class="mr-2 w-4 h-4" />
          Trimite Cerere
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
