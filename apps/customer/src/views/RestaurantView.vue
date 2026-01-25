<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import axios from 'axios'
import { useCartStore } from '../stores/cart'
import { useOrderStore } from '../stores/order'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
import ItemCard from '@/components/ItemCard.vue'
import RestaurantHeader from '@/components/restaurant/RestaurantHeader.vue'
import BottomNavigation from '@/components/restaurant/BottomNavigation.vue'
import ProductDrawer from '@/components/restaurant/ProductDrawer.vue'
import CartDrawer from '@/components/restaurant/CartDrawer.vue'
import SavedDrawer from '@/components/restaurant/SavedDrawer.vue'
import ServiceDrawer from '@/components/restaurant/ServiceDrawer.vue'
import MenuSheet from '@/components/restaurant/MenuSheet.vue'
import OrderStatusView from '@/components/restaurant/OrderStatusView.vue'
import CustomerProfileModal from '@/components/restaurant/CustomerProfileModal.vue'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const orderStore = useOrderStore()
const loading = ref(true)
const restaurant = ref<any>(null)
const categories = ref<any[]>([])
const selectedCategory = ref<any>(null)
const selectedProduct = ref<any>(null)
const drawerOpen = ref(false)
const cartDrawerOpen = ref(false)
const placingOrder = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const favorites = ref<Set<string>>(new Set())
const menuSheetOpen = ref(false)
const savedDrawerOpen = ref(false)
const serviceDrawerOpen = ref(false)
const activeTab = ref('menu')
const profileModalOpen = ref(false)
const selectedModifiers = ref<Record<string, any>>({
  size: null,
  extras: []
})
const quantity = ref(1)
const orderNote = ref('')
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const BASE_URL = API_URL.replace('/api', '') // Remove /api to get base URL

// Store interval reference for cleanup (must be at top level)
let statusCheckInterval: ReturnType<typeof setInterval> | null = null

const featuredProducts = computed(() => {
  if (!categories.value.length) return []
  // Get all products marked as featured from all categories
  const featured: any[] = []
  categories.value.forEach(category => {
    if (category.products) {
      category.products.forEach((product: any) => {
        if (product.isFeatured) {
          featured.push(product)
        }
      })
    }
  })
  return featured
})

onMounted(async () => {
  cart.loadSession()
  loadFavorites()
  
  // Validate token if we have one (check before loading restaurant)
  if (cart.tableToken) {
    try {
      const validateRes = await axios.post(`${API_URL}/public/validate-token`, {
        token: cart.tableToken
      })
      if (!validateRes.data.success) {
        // Token is invalid, clear session and redirect after delay
        toast.error('Sesiunea a expirat', {
          description: 'Te rugăm să scanezi din nou codul QR de pe masă.',
          duration: 3000
        })
        cart.clearSession()
        orderStore.disconnectSocket()
        setTimeout(() => {
          router.push({ name: 'scan' })
        }, 2000) // 2 second delay
        return
      }
      
      // Check if table was reset (status is AVAILABLE) - if so, redirect customer
      if (validateRes.data.data?.tableStatus === 'AVAILABLE') {
        // Table was reset while customer was browsing, clear session and redirect
        toast.error('Masă resetată', {
          description: 'Masă a fost resetată. Te rugăm să scanezi din nou codul QR.',
          duration: 3000
        })
        cart.clearSession()
        orderStore.disconnectSocket()
        setTimeout(() => {
          router.push({ name: 'scan' })
        }, 2000) // 2 second delay
        return
      }
      
      // Connect socket immediately so customer can receive table_session_revoked events
      if (cart.tableId) {
        orderStore.connectSocket(cart.tableId)
      }
    } catch (validateError) {
      // Token validation failed, clear session and redirect after delay
      console.error('Token validation error:', validateError)
      toast.error('Sesiunea a expirat', {
        description: 'Te rugăm să scanezi din nou codul QR de pe masă.',
        duration: 3000
      })
      cart.clearSession()
      orderStore.disconnectSocket()
      setTimeout(() => {
        router.push({ name: 'scan' })
      }, 2000) // 2 second delay
      return
    }
  }
  
  const slug = route.params.slug
  try {
     const res = await axios.get(`${API_URL}/public/restaurant/${slug}`)
     if (res.data.success) {
        restaurant.value = res.data.data
        categories.value = res.data.data.categories
        
        cart.restaurantId = res.data.data.id
        cart.restaurantSlug = res.data.data.slug
     }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
  
  // Check if profile setup is needed (after loading restaurant)
  if (route.query.setupProfile === 'true' && !cart.customerProfile) {
    profileModalOpen.value = true
  }
  
  // Set up periodic token/table status check while customer is browsing
  // This ensures we catch table resets even if socket connection fails
  if (cart.tableToken && cart.tableId) {
    statusCheckInterval = setInterval(async () => {
      try {
        const validateRes = await axios.post(`${API_URL}/public/validate-token`, {
          token: cart.tableToken
        })
        // If validation fails or table was reset (status is AVAILABLE), clear session and redirect
        if (!validateRes.data.success || validateRes.data.data?.tableStatus === 'AVAILABLE') {
          cart.clearSession()
          orderStore.disconnectSocket()
          if (statusCheckInterval) clearInterval(statusCheckInterval)
          statusCheckInterval = null
          toast.error('Masă resetată', {
            description: 'Masă a fost resetată. Te rugăm să scanezi din nou codul QR.',
            duration: 3000
          })
          setTimeout(() => {
            router.push({ name: 'scan' })
          }, 2000)
        }
      } catch (error) {
        // Silently fail - don't interrupt browsing for network errors
        console.error('Status check error:', error)
      }
    }, 10000) // Check every 10 seconds
  }
})

// Disable body scrolling when search is active
let scrollPosition = 0
watch(searchOpen, (isOpen) => {
  if (isOpen) {
    // Store the current scroll position
    scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollPosition}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
  } else {
    // Restore scroll position
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    // Restore scroll position after a brief delay to ensure styles are applied
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition)
    })
  }
})

// Cleanup on unmount (must be at top level, not inside onMounted)
onUnmounted(() => {
  // Clear status check interval
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
    statusCheckInterval = null
  }
  
  // Restore body styles
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  document.body.style.overflow = ''
  
  // Disconnect socket when leaving the page
  orderStore.disconnectSocket()
})

function openProductDrawer(product: any) {
  selectedProduct.value = product
  selectedModifiers.value = {
    size: null,
    extras: []
  }
  quantity.value = 1
  drawerOpen.value = true
}

function handleQuantityChange(product: any, qty: number) {
  // Remove all existing items of this product from cart
  const existingItem = cart.items.find(i => i.productId === product.id)
  if (existingItem) {
    // Remove all instances
    const index = cart.items.findIndex(i => i.productId === product.id)
    if (index > -1) {
      cart.items.splice(index, 1)
    }
  }
  // Add the new quantity
  for (let i = 0; i < qty; i++) {
    cart.addToCart(product)
  }
}

async function handleTabChange(tab: string) {
  const previousTab = activeTab.value
  activeTab.value = tab
  
  if (tab === 'menu') {
    selectedCategory.value = null
  }
  
  // Fetch data when switching to status or order tabs
  if (tab === 'status' && previousTab !== 'status') {
    // Force reload when switching to status tab
    await orderStore.fetchOrders()
    if (cart.tableId) {
      orderStore.connectSocket(cart.tableId)
    }
  } else if (tab === 'order' && previousTab !== 'order') {
    await orderStore.fetchOrders()
  }
}

function selectCategory(category: any) {
  selectedCategory.value = selectedCategory.value?.id === category.id ? null : category
  // Scroll to products section smoothly with header offset
  if (selectedCategory.value) {
    setTimeout(() => {
      const productsSection = document.getElementById('category-products')
      const header = document.querySelector('header')
      if (productsSection && header) {
        const headerHeight = header.offsetHeight + 16 // Header height + extra padding
        const elementPosition = productsSection.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }
}


const filteredProducts = computed(() => {
  const trimmedQuery = searchQuery.value.trim()
  // Only search after 2-3 characters are entered (using 2 as minimum)
  if (!trimmedQuery || trimmedQuery.length < 2) return []
  
  const query = trimmedQuery.toLowerCase()
  const results: any[] = []
  categories.value.forEach(category => {
    if (category.products) {
      category.products.forEach((product: any) => {
        if (
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.ingredients?.toLowerCase().includes(query)
        ) {
          results.push({ ...product, categoryName: category.name })
        }
      })
    }
  })
  // Limit results to 6 items (between 5-7 as requested)
  return results.slice(0, 6)
})

const favoriteProducts = computed(() => {
  if (!categories.value.length) return []
  const favs: any[] = []
  categories.value.forEach(category => {
    if (category.products) {
      category.products.forEach((product: any) => {
        if (favorites.value.has(product.id)) {
          favs.push({ ...product, categoryName: category.name })
        }
      })
    }
  })
  return favs
})

function loadFavorites() {
  try {
    const stored = localStorage.getItem(`favorites_${route.params.slug}`)
    if (stored) {
      favorites.value = new Set(JSON.parse(stored))
    }
  } catch (e) {
    console.error('Failed to load favorites', e)
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(`favorites_${route.params.slug}`, JSON.stringify(Array.from(favorites.value)))
  } catch (e) {
    console.error('Failed to save favorites', e)
  }
}

function toggleFavorite(productId: string) {
  const product = categories.value
    .flatMap(cat => cat.products || [])
    .find(p => p.id === productId)
  
  if (favorites.value.has(productId)) {
    favorites.value.delete(productId)
    toast.info('Produs eliminat din favorite', {
      description: `${product?.name || 'Produsul'} a fost eliminat din lista de favorite`,
    })
  } else {
    favorites.value.add(productId)
    toast.success('Produs adăugat la favorite', {
      description: `${product?.name || 'Produsul'} a fost adăugat la favorite`,
    })
  }
  saveFavorites()
}

function isFavorite(productId: string) {
  return favorites.value.has(productId)
}

function handleCallWaiter(message: string) {
  // In a real app, this would send a message to the server/waiter
  console.log('Server called:', message)
  toast.info('Server chemat', {
    description: message,
  })
}

async function handleOrderClick() {
  cartDrawerOpen.value = true
  // Fetch orders when opening cart drawer
  await orderStore.fetchOrders()
}

function handleRequestCheck(_message: string) {
  // Navigate to split bill view
  router.push({ name: 'split-bill' })
}

function handleProfileSave(profile: { name: string; gender: 'male' | 'female'; avatar: string | null }) {
  cart.saveCustomerProfile(profile)
  profileModalOpen.value = false
  // Remove setupProfile query param
  const query = { ...route.query }
  delete query.setupProfile
  router.replace({ name: 'restaurant-menu', params: { slug: route.params.slug }, query })
}

function handleProductAddToCart(notes?: string) {
  if (!selectedProduct.value) return
  // Add item with quantity (ProductDrawer manages quantity state)
  for (let i = 0; i < quantity.value; i++) {
    cart.addToCart(selectedProduct.value, notes)
  }
  drawerOpen.value = false
  selectedProduct.value = null
  quantity.value = 1
  orderNote.value = ''
}


async function placeOrder(note: string) {
  if (cart.items.length === 0) return
  if (!cart.tableToken) {
    toast.error('Eroare', {
      description: 'Te rugăm să scanezi mai întâi codul QR de pe masă',
    })
    return
  }

  placingOrder.value = true
  try {
    const order = await orderStore.placeOrder(note)
    if (order) {
      cartDrawerOpen.value = false
      orderNote.value = ''
      toast.success('Comandă plasată', {
        description: `Comanda ta a fost trimisă cu succes. Total: ${cart.total.toFixed(2)} RON`,
      })
      router.push({ name: 'order-status', params: { orderId: order.id } })
    }
  } catch (error: any) {
    const errorMessage = error.message || error.response?.data?.error || 'Nu s-a putut plasa comanda. Te rugăm să încerci din nou.'
    toast.error('Eroare', {
      description: errorMessage,
    })
    
    // If token expired, redirect after delay
    if (error.isTokenExpired || errorMessage.includes('Sesiunea a expirat')) {
      setTimeout(() => {
        router.push({ name: 'scan' })
      }, 2000) // 2 second delay to show the message
    }
    console.error('Order placement error:', error)
  } finally {
    placingOrder.value = false
  }
}
</script>

<template>
  <div class="pb-20 mb-16 min-h-screen"> 
    <!-- Header -->
    <RestaurantHeader
      :restaurant-name="restaurant?.name"
      :favorites-count="favoriteProducts.length"
      :cart-count="cart.count"
      :search-open="searchOpen"
      :search-query="searchQuery"
      :filtered-products="filteredProducts"
      :base-url="BASE_URL"
      @toggle-search="searchOpen = !searchOpen"
      @favorites-click="selectedCategory = { id: 'favorites', name: 'Favorite', products: favoriteProducts }"
      @cart-click="cartDrawerOpen = true"
      @update:search-query="searchQuery = $event"
      @product-click="openProductDrawer"
      @quantity-change="handleQuantityChange"
    />
    
    <!-- Order Status View -->
    <OrderStatusView v-if="activeTab === 'status'" :key="activeTab" />

    <!-- Loading State -->
    <div v-else-if="loading" class="px-4 py-20 mx-auto text-center maxappw">
      <div class="inline-block w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
      <p class="mt-4 text-gray-500">Se încarcă meniul...</p>
    </div>

    <!-- Menu Content -->
    <main v-else class="px-4 py-6 mx-auto space-y-8 maxappw">
      <!-- Categories Carousel -->
      <section class="space-y-4 w-full">
        <div class="flex gap-3 items-center">
          <h2 class="text-2xl font-bold text-gray-900">Categorii</h2>
          <div class="flex-1 h-px bg-gray-200"></div>
          <Badge variant="secondary">{{ categories.length }} produse</Badge>
        </div>
        
        <Carousel
          :opts="{
            align: 'center',
            slidesToScroll: 1,
            containScroll: 'trimSnaps',
          }"
          class="w-full"
        >
          <CarouselContent class="-ml-2 md:-ml-4">
            <CarouselItem
              v-for="category in categories"
              :key="category.id"
              class="pl-2 md:pl-4 basis-[85%] md:basis-[50%]"
            >
              <div class="p-1">
                <ItemCard
                  :title="category.name"
                  :subtitle="`${category.products?.length || 0} produse`"
                  :image-url="category.imageUrl"
                  :image-placeholder="'🍽️'"
                  @click="selectCategory(category)"
                />
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious class="hidden -left-12 md:flex" />
          <CarouselNext class="hidden -right-12 md:flex" />
        </Carousel>
      </section>

      <!-- Selected Category Products -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <section
          v-if="selectedCategory"
          id="category-products"
          class="pt-6 space-y-4 scroll-mt-24"
        >
          <div class="flex gap-3 items-center">
            <h2 class="text-2xl font-bold text-gray-900">{{ selectedCategory.name }}</h2>
            <div class="flex-1 h-px bg-gray-200"></div>
            <Badge variant="secondary">{{ selectedCategory.products?.length || 0 }} produse</Badge>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <ItemCard
              v-for="product in selectedCategory.products"
              :key="product.id"
              :title="product.name"
              :subtitle="`${product.price.toFixed(2)} RON`"
              :weight="product.weight"
              :product="product"
              :image-url="product.images && product.images.length > 0 ? (product.images[0].url.startsWith('http') ? product.images[0].url : `${BASE_URL}${product.images[0].url}`) : undefined"
              :media-type="product.images && product.images.length > 0 ? product.images[0].type : undefined"
              :image-placeholder="'🍕'"
              @click="openProductDrawer(product)"
              @quantity-change="handleQuantityChange"
            />
          </div>
        </section>
      </Transition>

      <!-- Featured Section -->
      <section v-if="featuredProducts.length > 0" class="space-y-4 w-full">
        <div class="flex gap-3 items-center">
          <h2 class="text-2xl font-bold text-gray-900">Recomandate</h2>
          <div class="flex-1 h-px bg-gray-200"></div>
          <Badge variant="secondary">{{ featuredProducts.length }} produse</Badge>
        </div>
        
        <Carousel
          :opts="{
            align: 'center',
            slidesToScroll: 1,
            containScroll: 'trimSnaps',
          }"
          class="w-full"
        >
          <CarouselContent class="-ml-2 md:-ml-4">
            <CarouselItem
              v-for="product in featuredProducts"
              :key="product.id"
              class="pl-2 md:pl-4 basis-[85%] md:basis-[50%]"
            >
              <div class="p-1">
                <ItemCard
                  :title="product.name"
                  :subtitle="`${product.price.toFixed(2)} RON`"
                  :weight="product.weight"
                  :product="product"
                  :image-url="product.images && product.images.length > 0 ? (product.images[0].url.startsWith('http') ? product.images[0].url : `${BASE_URL}${product.images[0].url}`) : undefined"
                  :media-type="product.images && product.images.length > 0 ? product.images[0].type : undefined"
                  :autoplay="true"
                  :image-placeholder="'🍽️'"
                  @click="openProductDrawer(product)"
                  @quantity-change="handleQuantityChange"
                />
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious class="hidden -left-12 md:flex" />
          <CarouselNext class="hidden -right-12 md:flex" />
        </Carousel>
      </section>
    </main>

    <!-- Product Drawer -->
    <ProductDrawer
      :open="drawerOpen"
      :product="selectedProduct"
      :base-url="BASE_URL"
      :is-favorite="selectedProduct ? isFavorite(selectedProduct.id) : false"
      @update:open="drawerOpen = $event"
      @add-to-cart="handleProductAddToCart"
      @toggle-favorite="selectedProduct && toggleFavorite(selectedProduct.id)"
    />

    <!-- Cart/Order Drawer -->
    <CartDrawer
      :open="cartDrawerOpen"
      :items="cart.items"
      :total="cart.total"
      :placing-order="placingOrder"
      :table-id="cart.tableId"
      :table-name="cart.tableName"
      :has-table-token="!!cart.tableToken"
      @update:open="cartDrawerOpen = $event"
      @place-order="placeOrder"
      @remove-item="cart.removeFromCart"
      @add-item="cart.addToCart"
    />

    <!-- Saved/Favorites Drawer -->
    <SavedDrawer
      :open="savedDrawerOpen"
      :favorite-products="favoriteProducts"
      :base-url="BASE_URL"
      @update:open="savedDrawerOpen = $event"
      @product-click="openProductDrawer"
      @toggle-favorite="toggleFavorite"
    />

    <!-- Service Drawer (Call Waiter / Request Check) -->
    <ServiceDrawer
      :open="serviceDrawerOpen"
      :total="cart.total"
      @update:open="serviceDrawerOpen = $event"
      @call-waiter="handleCallWaiter"
      @request-check="handleRequestCheck"
    />

    <!-- Customer Profile Modal (Non-removable) -->
    <CustomerProfileModal
      :open="profileModalOpen"
      @save="handleProfileSave"
    />

    <!-- Menu Sheet -->
    <MenuSheet
      :open="menuSheetOpen"
      :categories="categories"
      @update:open="menuSheetOpen = $event"
      @category-select="selectCategory"
    />

    <!-- Bottom Navigation Menu -->
    <BottomNavigation
      :active-tab="activeTab"
      :cart-count="cart.count"
      :favorites-count="favoriteProducts.length"
      :has-active-order="orderStore.orders.some(o => o.status !== 'SERVED' && o.status !== 'CANCELLED')"
      @update:active-tab="handleTabChange"
      @menu-click="menuSheetOpen = true"
      @order-click="handleOrderClick"
      @service-click="serviceDrawerOpen = true"
      @status-click="handleTabChange('status')"
      @saved-click="savedDrawerOpen = true"
    />
  </div>
</template>
