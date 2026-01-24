<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, X, ChevronDown } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const props = defineProps<{
  searchOpen: boolean
  searchQuery: string
  filteredProducts: any[]
  baseUrl: string
}>()

const isMounted = ref(false)

onMounted(() => {
  // Small delay to ensure transition starts from initial state
  setTimeout(() => {
    isMounted.value = true
  }, 10)
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'close': []
  'product-click': [product: any]
  'quantity-change': [product: any, quantity: number]
}>()

function updateQuery(value: string) {
  emit('update:searchQuery', value)
}

function handleProductClick(product: any) {
  emit('product-click', product)
}
</script>

<template>
  <div class="overflow-hidden relative z-50 px-2 pb-4 w-full bg-white border-t shadow-lg">
    <div class="flex gap-2 items-center pt-4 transition-all duration-300 maxappw">
      <div class="relative flex-1 min-w-0">
        <Search class="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transition-opacity duration-300 -translate-y-1/2" />
        <input
          :value="searchQuery"
          @input="updateQuery(($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Caută produse..."
          class="py-2 pr-10 pl-10 w-full rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.escape="$emit('close')"
        />
        <Transition
          enter-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <Button
            v-if="searchQuery"
            size="icon"
            variant="outline"
            class="absolute right-1 top-1/2 w-6 h-6 -translate-y-1/2"
            @click="updateQuery('')"
          >
            <X class="w-4 h-4" />
          </Button>
        </Transition>
      </div>
      <Button 
        size="icon"
        variant="outline" 
        aria-label="Închide căutarea"
        @click="$emit('close')"
      >
        <ChevronDown 
          :class="[
            'w-5 h-5 transition-transform duration-300 ease-in-out',
            isMounted ? 'rotate-180' : 'rotate-0'
          ]"
        />
      </Button>
    </div>
    <!-- Search Results -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="max-h-0 opacity-0 translate-y-2"
      enter-to-class="max-h-64 opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="max-h-64 opacity-100 translate-y-0"
      leave-to-class="max-h-0 opacity-0 translate-y-2"
    >
      <ScrollArea v-if="searchQuery.trim().length >= 2 && filteredProducts.length > 0" class="mt-4 max-h-64 maxappw">
        <div class="space-y-2 text-start">
          <TransitionGroup
            name="list"
            tag="div"
            class="space-y-2"
          >
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              class="flex gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:shadow-sm"
              @click="handleProductClick(product)"
            >
              <!-- Product Image -->
              <div class="overflow-hidden w-16 h-16 bg-gray-100 rounded-lg shrink-0">
                <img
                  v-if="product.images && product.images.length > 0 && product.images[0].type !== 'video'"
                  :src="product.images[0].url.startsWith('http') ? product.images[0].url : `${baseUrl}${product.images[0].url}`"
                  :alt="product.name"
                  class="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
                />
                <video
                  v-else-if="product.images && product.images.length > 0 && product.images[0].type === 'video'"
                  :src="product.images[0].url.startsWith('http') ? product.images[0].url : `${baseUrl}${product.images[0].url}`"
                  class="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
                  muted
                  loop
                  playsinline
                />
                <span v-else class="flex justify-center items-center w-full h-full text-2xl">🍕</span>
              </div>
              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 line-clamp-1">{{ product.name }}</h3>
                <p v-if="product.weight" class="mt-1 text-xs text-gray-500">{{ product.weight }}</p>
                <p v-if="product.description" class="mt-1 text-xs text-gray-600 line-clamp-1">{{ product.description }}</p>
                <div class="flex gap-2 items-center mt-2">
                  <p class="text-sm font-bold text-blue-600">{{ product.price.toFixed(2) }} RON</p>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </ScrollArea>
    </Transition>
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="searchQuery.trim().length >= 2 && filteredProducts.length === 0" class="mt-4 text-center text-gray-500">
        Nu s-au găsit produse
      </div>
    </Transition>
  </div>
</template>
