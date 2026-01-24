<script setup lang="ts">
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

defineProps<{
  open: boolean
  categories: any[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'category-select': [category: any]
}>()

function selectCategory(category: any) {
  emit('category-select', category)
  emit('update:open', false)
}
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="left" class="flex flex-col w-full sm:max-w-md">
      <SheetHeader class="shrink-0">
        <SheetTitle>Meniu</SheetTitle>
      </SheetHeader>
      <ScrollArea class="flex-1 pr-4 mt-6 h-full">
        <div class="space-y-4 h-full">
          <div
            v-for="category in categories"
            :key="category.id"
            class="p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50"
            @click="selectCategory(category)"
          >
            <div class="flex gap-3 items-center">
              <div v-if="category.imageUrl" class="overflow-hidden w-12 h-12 rounded-lg shrink-0">
                <img :src="category.imageUrl" :alt="category.name" class="object-cover w-full h-full" />
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ category.name }}</h3>
                <p class="text-sm text-gray-500">{{ category.products?.length || 0 }} produse</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
</template>
