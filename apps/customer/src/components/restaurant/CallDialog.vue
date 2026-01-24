<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  defaultMessage?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'send': [message: string]
}>()

const callMessage = ref(props.defaultMessage || 'Vă rog să veniți la masă.')

function sendRequest() {
  emit('send', callMessage.value)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Cheamă Serverul</DialogTitle>
        <DialogDescription>
          Trimiteți un mesaj serverului pentru a veni la masă
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <label class="block mb-2 text-sm font-medium">Mesaj pentru server:</label>
        <textarea
          v-model="callMessage"
          rows="3"
          placeholder="Vă rog să veniți la masă."
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">Anulează</Button>
        <Button @click="sendRequest" class="bg-blue-600 hover:bg-blue-700">
          <Bell class="mr-2 w-4 h-4" />
          Trimite Cerere
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
