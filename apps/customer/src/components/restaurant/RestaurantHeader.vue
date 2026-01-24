<script setup lang="ts">
import { Search, Heart } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ButtonGroup } from '@/components/ui/button-group'
import SearchBar from './SearchBar.vue'

defineProps<{
  restaurantName?: string
  favoritesCount: number
  cartCount: number
  searchOpen: boolean
  searchQuery: string
  filteredProducts: any[]
  baseUrl: string
}>()

const emit = defineEmits<{
  'toggle-search': []
  'favorites-click': []
  'cart-click': []
  'update:searchQuery': [value: string]
  'product-click': [product: any]
  'quantity-change': [product: any, quantity: number]
}>()
</script>

<template>
  <header class="sticky top-0 z-40 bg-white border-t shadow-lg">
    <div class="flex justify-between items-center px-4 py-2 mx-auto maxappw">
      <div>
        <h1 class="text-xl font-bold text-gray-900">{{ restaurantName }}</h1>
        <p class="text-gray-500 text-start">Unde gustul este viata!</p>
      </div>
      <ButtonGroup orientation="horizontal">
        <!-- Search Button -->
        <Button 
          size="icon"
          variant="outline"
          aria-label="Caută produse"
          @click="$emit('toggle-search')"
        >
          <Search />
        </Button>
        <!-- Favorites Button -->
        <Button 
          size="icon"
          variant="outline"
          aria-label="Favorite"
          @click="$emit('favorites-click')"
          :class="{ 'text-red-500 ': favoritesCount > 0 }"
          class="relative"
        >
          <Heart 
            :class="{ 'fill-red-500': favoritesCount > 0 }"
            class="w-5 h-5"
          />
          <Badge 
            v-if="favoritesCount > 0" 
            class="flex absolute -top-1 -right-1 justify-center items-center p-0 w-4 h-4 text-xs"
          >
            {{ favoritesCount }}
          </Badge>
        </Button>
      </ButtonGroup>
    </div>
    <!-- Overlay - positioned below header to separate search from page content -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="searchOpen"
        class="fixed inset-x-0 bottom-0 top-[73px] z-30 bg-black/50 backdrop-blur-sm"
        @click="$emit('toggle-search')"
      />
    </Transition>
    <!-- Search Bar -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="max-h-0 opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0 max-h-[500px]"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 max-h-[500px]"
      leave-to-class="max-h-0 opacity-0 -translate-y-2"
    >
      <SearchBar
        v-if="searchOpen"
        :search-open="searchOpen"
        :search-query="searchQuery"
        :filtered-products="filteredProducts"
        :base-url="baseUrl"
        @update:search-query="$emit('update:searchQuery', $event)"
        @close="$emit('toggle-search')"
        @product-click="$emit('product-click', $event)"
        @quantity-change="$emit('quantity-change', $event[0], $event[1])"
      />
    </Transition>
  </header>
</template>
