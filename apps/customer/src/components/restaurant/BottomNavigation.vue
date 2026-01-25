<script setup lang="ts">
import { BookOpen, UtensilsCrossed, Star, Bell, Activity } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

defineProps<{
  activeTab: string
  cartCount: number
  favoritesCount: number
  hasActiveOrder?: boolean
}>()

const emit = defineEmits<{
  'menu-click': []
  'order-click': []
  'service-click': []
  'status-click': []
  'saved-click': []
  'update:activeTab': [value: string]
}>()

function handleClick(tab: string, event: string) {
  emit('update:activeTab', tab)
  emit(event as any)
}
</script>

<template>
  <nav class="fixed right-1 bottom-1 left-1 z-50 rounded-lg border-t shadow-xl bg-foreground">
    <ButtonGroup class="flex w-full h-16 rounded-none border-0" orientation="horizontal">
      <!-- Menu -->
      <Button
        @click="handleClick('menu', 'menu-click')"
        :variant="activeTab === 'menu' ? 'default' : 'ghost'"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-none',
          activeTab === 'menu' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
        ]"
        aria-label="Meniu"
      >
        <BookOpen :class="['w-5 h-5', activeTab === 'menu' && 'fill-current']" />
        <span class="text-xs font-medium">Meniu</span>
      </Button>

      <!-- Order (Cart) -->
      <Button
        @click="handleClick('order', 'order-click')"
        :variant="activeTab === 'order' ? 'default' : 'ghost'"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-none relative',
          activeTab === 'order' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
        ]"
        aria-label="Comandă"
      >
        <UtensilsCrossed :class="['w-5 h-5', activeTab === 'order' && 'fill-current']" />
        <span class="text-xs font-medium">Comandă</span>
        <Badge
          v-if="cartCount > 0"
          class="flex absolute -top-1 -right-1 justify-center items-center p-0 w-5 h-5 text-xs"
        >
          {{ cartCount }}
        </Badge>
      </Button>

      <!-- Service (Call/Bill) -->
      <Button
        @click="handleClick('service', 'service-click')"
        :variant="activeTab === 'service' ? 'default' : 'ghost'"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-none',
          activeTab === 'service' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
        ]"
        aria-label="Serviciu"
      >
        <Bell :class="['w-5 h-5', activeTab === 'service' && 'fill-current']" />
        <span class="text-xs font-medium">Serviciu</span>
      </Button>

      <!-- Status -->
      <Button
        @click="handleClick('status', 'status-click')"
        :variant="activeTab === 'status' ? 'default' : 'ghost'"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-none relative',
          activeTab === 'status' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
        ]"
        aria-label="Status"
      >
        <Activity :class="['w-5 h-5', activeTab === 'status' && 'fill-current']" />
        <span class="text-xs font-medium">Status</span>
        <Badge
          v-if="hasActiveOrder"
          class="flex absolute -top-1 -right-1 justify-center items-center p-0 w-2 h-2 rounded-full bg-green-500"
        />
      </Button>

      <!-- Saved -->
      <Button
        @click="handleClick('saved', 'saved-click')"
        :variant="activeTab === 'saved' ? 'default' : 'ghost'"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-none relative',
          activeTab === 'saved' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
        ]"
        aria-label="Salvate"
      >
        <Star :class="['w-5 h-5', activeTab === 'saved' && 'fill-current']" />
        <span class="text-xs font-medium">Salvate</span>
        <Badge
          v-if="favoritesCount > 0"
          class="flex absolute -top-1 -right-1 justify-center items-center p-0 w-4 h-4 text-xs"
        >
          {{ favoritesCount }}
        </Badge>
      </Button>
    </ButtonGroup>
  </nav>
</template>
