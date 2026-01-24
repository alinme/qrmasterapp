<script setup lang="ts">
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Star, Heart } from 'lucide-vue-next'

defineProps<{
  open: boolean
  favoriteProducts: any[]
  baseUrl: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'product-click': [product: any]
  'toggle-favorite': [productId: string]
}>()
</script>

<template>
  <Drawer :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="mx-auto max-w-md flex flex-col max-h-[99vh] min-h-[90vh]">
      <DrawerHeader class="shrink-0">
        <DrawerTitle>Produse Salvate</DrawerTitle>
      </DrawerHeader>
      <div class="overflow-y-auto flex-1 px-4 pb-4">
        <div v-if="favoriteProducts.length === 0" class="flex flex-col justify-center items-center py-20 text-center">
          <Star class="mb-4 w-16 h-16 text-gray-300" />
          <p class="text-gray-500">Nu aveți produse salvate</p>
          <p class="mt-2 text-sm text-gray-400">Adăugați produse la favorite pentru a le comanda mai târziu</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-4 py-4">
          <div
            v-for="product in favoriteProducts"
            :key="product.id"
            class="flex gap-4 p-4 bg-white rounded-lg border transition-shadow cursor-pointer hover:shadow-md"
            @click="$emit('product-click', product)"
          >
            <div class="overflow-hidden w-20 h-20 bg-gray-100 rounded-lg shrink-0">
              <img
                v-if="product.images && product.images.length > 0"
                :src="product.images[0].url.startsWith('http') ? product.images[0].url : `${baseUrl}${product.images[0].url}`"
                :alt="product.name"
                class="object-cover w-full h-full"
              />
              <span v-else class="flex justify-center items-center w-full h-full text-2xl">🍽️</span>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 line-clamp-1">{{ product.name }}</h3>
              <p v-if="product.weight" class="mt-1 text-sm text-gray-500">{{ product.weight }}</p>
              <p class="mt-2 text-lg font-bold text-blue-600">{{ product.price.toFixed(2) }} RON</p>
            </div>
            <Button
              size="icon"
              variant="outline"
              aria-label="Elimină din favorite"
              @click.stop="$emit('toggle-favorite', product.id)"
              class="text-red-500 border-red-500"
            >
              <Heart class="w-5 h-5 fill-red-500" />
            </Button>
          </div>
        </div>
      </div>
      <DrawerFooter class="shrink-0">
        <DrawerClose as-child>
          <Button class="w-full">Închide</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
