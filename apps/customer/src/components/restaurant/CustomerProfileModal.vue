<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, UserCircle } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'save': [profile: { name: string; avatar: string | null }]
}>()

const customerName = ref('')
const avatarUrl = ref<string | null>(null)
const error = ref('')

// Generate avatar placeholder
const avatarPlaceholder = computed(() => {
  if (avatarUrl.value) return avatarUrl.value
  // Return generic user emoji
  return '👤'
})

function handleSave() {
  if (!customerName.value.trim()) {
    error.value = 'Te rugăm să introduci un nume'
    return
  }
  
  emit('save', {
    name: customerName.value.trim(),
    avatar: avatarUrl.value
  })
  
  // Reset form
  customerName.value = ''
  avatarUrl.value = null
  error.value = ''
}

// Watch for file input (if user wants to upload avatar)
function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (!file.type.startsWith('image/')) {
      error.value = 'Te rugăm să selectezi o imagine'
      return
    }
    
    // Create a data URL for preview (in production, you'd upload to server)
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}
</script>

<template>
  <Dialog :open="open">
    <DialogContent 
      class="max-w-md" 
      :show-close-button="false"
      @pointer-down-outside.prevent 
      @escape-key-down.prevent
      @interact-outside.prevent
    >
      <DialogHeader>
        <DialogTitle>Completează Profilul Tău</DialogTitle>
        <p class="text-sm text-muted-foreground mt-1">Te rugăm să completezi profilul înainte de a continua</p>
      </DialogHeader>
      
      <div class="space-y-6 py-4">
        <!-- Avatar Section -->
        <div class="flex flex-col items-center space-y-4">
          <div class="relative">
            <div class="flex justify-center items-center w-24 h-24 rounded-full bg-muted border-4 border-primary text-4xl">
              <span v-if="!avatarUrl">{{ avatarPlaceholder }}</span>
              <img v-else :src="avatarUrl" alt="Avatar" class="w-full h-full rounded-full object-cover" />
            </div>
            <label
              for="avatar-upload"
              class="absolute bottom-0 right-0 flex justify-center items-center w-8 h-8 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition"
            >
              <UserCircle class="w-4 h-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarChange"
              />
            </label>
          </div>
        </div>

        <!-- Name Input -->
        <div class="space-y-2">
          <Label for="customer-name">Numele tău *</Label>
          <Input
            id="customer-name"
            v-model="customerName"
            placeholder="Introdu numele tău"
            class="w-full"
            @keyup.enter="handleSave"
          />
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </div>

        <!-- Save Button -->
        <Button
          @click="handleSave"
          :disabled="!customerName.trim()"
          class="w-full bg-primary text-primary-foreground"
          size="lg"
        >
          <User class="mr-2 w-4 h-4" />
          Continuă
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
