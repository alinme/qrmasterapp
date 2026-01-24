<script setup lang="ts">
import { ref, watch } from 'vue'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Bell, DollarSign } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  total?: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'call-waiter': [message: string]
  'request-check': [message: string]
}>()

const isCheckRequest = ref(false)
const message = ref('')

watch(() => props.open, (newVal) => {
  if (newVal) {
    // Reset when opening
    isCheckRequest.value = false
    message.value = isCheckRequest.value 
      ? 'Vă rog să-mi aduceți nota de plată.'
      : 'Vă rog să veniți la masă.'
  }
})

watch(isCheckRequest, (newVal) => {
  message.value = newVal 
    ? 'Vă rog să-mi aduceți nota de plată.'
    : 'Vă rog să veniți la masă.'
})

function sendRequest() {
  if (isCheckRequest.value) {
    emit('request-check', message.value)
  } else {
    emit('call-waiter', message.value)
  }
  emit('update:open', false)
  message.value = ''
}
</script>

<template>
  <Drawer :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="mx-auto max-w-md">
      <DrawerHeader>
        <DrawerTitle>Solicitare Serviciu</DrawerTitle>
      </DrawerHeader>
      <div class="px-4 pb-4 space-y-4">
        <div class="p-4 rounded-lg border bg-muted/50 space-y-3">
          <Label class="text-base font-semibold">Tip solicitare:</Label>
          <div class="flex gap-2">
            <Button
              :variant="!isCheckRequest ? 'default' : 'outline'"
              :class="!isCheckRequest ? 'bg-blue-600 hover:bg-blue-700' : ''"
              @click="isCheckRequest = false"
              class="flex-1"
            >
              <Bell class="mr-2 w-4 h-4" />
              Cheamă Serverul
            </Button>
            <Button
              :variant="isCheckRequest ? 'default' : 'outline'"
              :class="isCheckRequest ? 'bg-green-600 hover:bg-green-700' : ''"
              @click="isCheckRequest = true"
              class="flex-1"
            >
              <DollarSign class="mr-2 w-4 h-4" />
              Notă de Plată
            </Button>
          </div>
        </div>

        <div v-if="isCheckRequest && total" class="p-3 rounded-lg bg-green-50 border border-green-200">
          <p class="text-sm text-green-800">
            <span class="font-medium">Total comandă:</span>
            <span class="text-lg font-bold ml-2">{{ total.toFixed(2) }} RON</span>
          </p>
        </div>

        <div>
          <Label for="message" class="mb-2">Mesaj pentru server:</Label>
          <Textarea
            id="message"
            v-model="message"
            rows="3"
            :placeholder="isCheckRequest ? 'Vă rog să-mi aduceți nota de plată.' : 'Vă rog să veniți la masă.'"
            class="min-h-[80px]"
          />
        </div>
      </div>
      <DrawerFooter>
        <Button @click="sendRequest" :class="isCheckRequest ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'">
          <Bell class="mr-2 w-4 h-4" />
          Trimite Cerere
        </Button>
        <DrawerClose as-child>
          <Button variant="outline" class="w-full">Anulează</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
