<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Minus } from 'lucide-vue-next'
import { useCartStore } from '@/stores/cart'

const props = defineProps<{
  title: string
  subtitle?: string
  weight?: string // Weight/volume (e.g., "500g", "250ml")
  imageUrl?: string
  imagePlaceholder?: string
  mediaType?: string // 'image' or 'video'
  autoplay?: boolean // If true, autoplay video when in view
  product?: any // Product object for cart operations
  onClick?: () => void
  onQuantityChange?: (product: any, quantity: number) => void
}>()

const cart = useCartStore()
const quantity = computed(() => {
  if (!props.product) return 0
  const item = cart.items.find(i => i.productId === props.product.id)
  return item ? item.quantity : 0
})

const handleDecrease = (e: Event) => {
  e.stopPropagation()
  if (props.product && quantity.value > 0) {
    cart.removeFromCart(props.product.id)
    if (props.onQuantityChange) {
      props.onQuantityChange(props.product, quantity.value - 1)
    }
  }
}

const handleIncrease = (e: Event) => {
  e.stopPropagation()
  if (props.product) {
    cart.addToCart(props.product)
    if (props.onQuantityChange) {
      props.onQuantityChange(props.product, quantity.value + 1)
    }
  }
}

const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (props.autoplay && props.mediaType === 'video' && videoRef.value && containerRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.value) {
            videoRef.value.play().catch(() => {
              // Autoplay was prevented, ignore
            })
          } else if (videoRef.value) {
            videoRef.value.pause()
          }
        })
      },
      {
        threshold: 0.5 // Play when 50% of video is visible
      }
    )
    observer.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (observer && containerRef.value) {
    observer.unobserve(containerRef.value)
    observer.disconnect()
  }
})
</script>

<template>
  <Card
    class="overflow-hidden transition-shadow cursor-pointer hover:shadow-lg"
    @click="onClick"
  >
    <!-- Square Image Container -->
    <div ref="containerRef" class="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
      <!-- Image, Video, or Placeholder -->
      <div v-if="imageUrl" class="absolute inset-0">
        <img 
          v-if="!mediaType || mediaType === 'image'"
          :src="imageUrl" 
          :alt="title"
          class="object-cover w-full h-full"
        />
        <video
          v-else-if="mediaType === 'video'"
          ref="videoRef"
          :src="imageUrl"
          class="object-cover w-full h-full"
          muted
          loop
          playsinline
        />
      </div>
      <div v-else class="flex justify-center items-center h-full">
        <span class="text-6xl">{{ imagePlaceholder || '🍽️' }}</span>
      </div>
      
      <!-- Gradient Overlay at Bottom -->
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4">
        <h3 class="text-lg font-semibold text-white line-clamp-1">{{ title }}</h3>
        <div class="flex gap-2 items-center mt-1">
          <p v-if="weight" class="text-xs text-white/80">{{ weight }}</p>
          <p v-if="subtitle" class="text-sm text-white/90">{{ subtitle }}</p>
        </div>
        <!-- Quantity Controls (only show if weight is set) -->
        <div v-if="weight && product" class="flex gap-2 items-center mt-3" @click.stop>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Scade cantitatea"
            @click="handleDecrease"
            class="w-8 h-8 bg-white/20 hover:bg-white/30 border-white/30"
          >
            <Minus class="w-3 h-3 text-white" />
          </Button>
          <span class="w-6 text-sm font-semibold text-center text-white">{{ quantity || 0 }}</span>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Crește cantitatea"
            @click="handleIncrease"
            class="w-8 h-8 bg-white/20 hover:bg-white/30 border-white/30"
          >
            <Plus class="w-3 h-3 text-white" />
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>
