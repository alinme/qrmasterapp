<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Heart } from 'lucide-vue-next'
import {
  getAllergens,
  getNutritionalValue,
  getAvailableSizes,
  getAvailableExtras,
  calculatePriceWithModifiers
} from '@/utils/product'

const props = defineProps<{
  open: boolean
  product: any
  baseUrl: string
  isFavorite: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add-to-cart': [notes?: string]
  'toggle-favorite': []
  'quantity-change': [quantity: number]
}>()

const quantity = ref(1)
const itemNote = ref('')
const selectedModifiers = ref<{ size: string | null, extras: string[] }>({
  size: null,
  extras: []
})

const price = computed(() => {
  if (!props.product) return 0
  return calculatePriceWithModifiers(props.product.price, selectedModifiers.value)
})

function addToCart() {
  emit('add-to-cart', itemNote.value || undefined)
  emit('update:open', false)
  quantity.value = 1
  itemNote.value = ''
  selectedModifiers.value = { size: null, extras: [] }
  toast.success('Produs adăugat', {
    description: `${props.product?.name} a fost adăugat în comandă`,
  })
}
</script>

<template>
  <Drawer :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="mx-auto max-w-md flex flex-col max-h-[99vh] min-h-[90vh]">
      <DrawerHeader class="shrink-0">
        <DrawerTitle>{{ product?.name }}</DrawerTitle>
      </DrawerHeader>
      <div v-if="product" class="overflow-y-auto flex-1 px-4 pb-4 min-h-full">
        <!-- Product Image/Video -->
        <div class="flex overflow-hidden relative justify-center items-center bg-gray-100 rounded-lg aspect-video">
          <template v-if="product.images && product.images.length > 0">
            <img
              v-if="product.images[0].type !== 'video'"
              :src="product.images[0].url.startsWith('http') ? product.images[0].url : `${baseUrl}${product.images[0].url}`"
              :alt="product.name"
              class="object-cover w-full h-full"
            />
            <video
              v-else
              :src="product.images[0].url.startsWith('http') ? product.images[0].url : `${baseUrl}${product.images[0].url}`"
              class="object-cover w-full h-full"
              controls
              autoplay
              muted
              loop
            />
          </template>
          <span v-else class="text-8xl">🍽️</span>
        </div>

        <!-- Product Info -->
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1">
              <div class="flex justify-between items-start mb-2">
                <div v-if="product.weight" class="text-sm font-medium text-gray-700">
                  {{ product.weight }}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Adaugă la favorite"
                  @click="$emit('toggle-favorite')"
                  :class="{ 'text-red-500 border-red-500': isFavorite }"
                >
                  <Heart 
                    :class="{ 'fill-red-500': isFavorite }"
                    class="w-5 h-5"
                  />
                </Button>
              </div>
              <div class="mt-2 mb-4 text-gray-600">
                <p class="text-sm">{{ product.description }}</p>
              </div>
              <div v-if="product.ingredients" class="p-3 mb-4 text-sm bg-gray-50 rounded-lg">
                <strong>Ingrediente:</strong> {{ product.ingredients }}
              </div>
              <div v-if="product.nutritionalValues" class="p-3 mb-4 text-sm bg-blue-50 rounded-lg">
                <strong class="block mb-2">Valori nutriționale (per 100g/ml):</strong>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div v-if="getNutritionalValue(product, 'calories')">
                    Calorii: {{ getNutritionalValue(product, 'calories') }} kcal
                  </div>
                  <div v-if="getNutritionalValue(product, 'protein')">
                    Proteine: {{ getNutritionalValue(product, 'protein') }}g
                  </div>
                  <div v-if="getNutritionalValue(product, 'carbs')">
                    Carbohidrați: {{ getNutritionalValue(product, 'carbs') }}g
                  </div>
                  <div v-if="getNutritionalValue(product, 'fat')">
                    Grăsimi: {{ getNutritionalValue(product, 'fat') }}g
                  </div>
                  <div v-if="getNutritionalValue(product, 'fiber')">
                    Fibre: {{ getNutritionalValue(product, 'fiber') }}g
                  </div>
                  <div v-if="getNutritionalValue(product, 'sugar')">
                    Zahăr: {{ getNutritionalValue(product, 'sugar') }}g
                  </div>
                  <div v-if="getNutritionalValue(product, 'sodium')">
                    Sodiu: {{ getNutritionalValue(product, 'sodium') }}mg
                  </div>
                </div>
              </div>
              <div v-if="getAllergens(product).length > 0" class="p-3 mb-4 text-sm text-orange-800 bg-orange-50 rounded-lg">
                <strong>⚠️ Conține:</strong> {{ getAllergens(product).join(', ') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Extra Options / Modifiers -->
        <div v-if="getAvailableSizes(product).length > 0 || getAvailableExtras(product).length > 0" class="space-y-4">
          <h4 class="text-lg font-semibold">Opțiuni Extra</h4>
          <!-- Size Selection -->
          <div v-if="getAvailableSizes(product).length > 0" class="mb-4">
            <label class="block mb-2 text-sm font-medium">Mărime</label>
            <div class="grid grid-cols-3 gap-2">
              <Button
                v-for="size in getAvailableSizes(product)"
                :key="size"
                variant="outline"
                @click="selectedModifiers.size = size"
                :class="[
                  selectedModifiers.size === size
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : ''
                ]"
              >
                {{ size }}
              </Button>
            </div>
          </div>

          <!-- Extras -->
          <div v-if="getAvailableExtras(product).length > 0" class="mb-4">
            <label class="block mb-2 text-sm font-medium">Suplimente</label>
            <div class="space-y-2">
              <label
                v-for="extra in getAvailableExtras(product)"
                :key="extra"
                class="flex gap-3 items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  :value="extra"
                  v-model="selectedModifiers.extras"
                  class="w-4 h-4 text-blue-600"
                />
                <span>{{ extra }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Item Note -->
        <div class="pt-4 border-t">
          <label class="block mb-2 text-sm font-medium text-gray-600">Note pentru acest produs (opțional)</label>
          <textarea
            v-model="itemNote"
            class="p-2 w-full text-sm rounded-md border border-gray-300"
            placeholder="Ex: fără ceapă, extra sos, alergii..."
            rows="2"
          ></textarea>
        </div>

        <!-- Price and Quantity -->
        <div class="flex justify-between items-center pt-4 border-t">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-600">Cantitate</label>
            <div class="flex gap-4 items-center">
              <Button
                size="icon"
                aria-label="Scade cantitatea"
                @click="quantity = Math.max(1, quantity - 1)"
                class="w-10 h-10 rounded-full"
              >
                <Minus class="w-4 h-4" />
              </Button>
              <span class="w-8 text-xl font-semibold text-center">{{ quantity }}</span>
              <Button
                size="icon"
                aria-label="Crește cantitatea"
                @click="quantity++"
                class="w-10 h-10 rounded-full"
              >
                <Plus class="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div class="text-right">
            <div class="mb-2 text-sm font-medium text-gray-600">Preț</div>
            <div class="text-3xl font-bold text-blue-600">{{ (price * quantity).toFixed(2) }} RON</div>
          </div>
        </div>
      </div>

      <DrawerFooter class="shrink-0">
        <Button @click="addToCart" class="w-full text-white bg-blue-600 hover:bg-blue-700" size="lg">
          <Plus class="mr-2 w-4 h-4" />
          Adaugă la Comandă
        </Button>
        <DrawerClose as-child>
          <Button class="w-full text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200">Anulează</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
