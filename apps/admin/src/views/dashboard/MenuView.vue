<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Toggle } from '@/components/ui/toggle'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, X, Upload, Image as ImageIcon, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const menuStore = useMenuStore()
const newCategoryName = ref('')
const selectedCategory = ref<string | null>(null)
const productDialogOpen = ref(false)
const expandedCategories = ref<Set<string>>(new Set()) // Track which categories are expanded

// Category form state
const editingCategory = ref<any>(null)
const categoryDialogOpen = ref(false)
const categoryImageFile = ref<File | null>(null)
const categoryImagePreview = ref<string | null>(null)
const categoryName = ref('')

// Product form state
const editingProduct = ref<any>(null)
const productForm = ref({
  name: '',
  description: '',
  price: '',
  weight: '',
  ingredients: '',
  nutritionalValues: {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: ''
  },
  isCombo: false,
  isFeatured: false,
  allergens: [] as string[],
  modifiers: {
    sizes: [] as Array<{name: string, price: number}>,
    extras: [] as Array<{name: string, price: number}>
  }
})

const productImages = ref<Array<{id?: string, url: string, type: string}>>([])
const imageFiles = ref<File[]>([])
const productRelations = ref<Array<any>>([])
const uploadingImage = ref(false)
const showModifierTemplates = ref(false)
const modifierTemplates = ref<Array<{name: string, modifiers: any}>>([])

// Allergen management state
const newAllergenName = ref('')
const editingAllergen = ref<any>(null)
const allergenEditName = ref('')

onMounted(() => {
  menuStore.fetchCategories()
  menuStore.fetchAllergens()
  loadModifierTemplates()
})

async function addCategory() {
  if (!newCategoryName.value) return
  const category = await menuStore.createCategory(newCategoryName.value)
  if (category) {
    // Expand the newly created category
    expandedCategories.value.add(category.id)
  }
  newCategoryName.value = ''
}

function toggleCategory(categoryId: string) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

function openCategoryDialog(category?: any) {
  categoryDialogOpen.value = true
  if (category) {
    editingCategory.value = category
    categoryName.value = category.name || ''
    categoryImagePreview.value = category.imageUrl ? (category.imageUrl.startsWith('http') ? category.imageUrl : `http://localhost:3000${category.imageUrl}`) : null
  } else {
    editingCategory.value = null
    categoryName.value = ''
    categoryImagePreview.value = null
  }
  categoryImageFile.value = null
}

function closeCategoryDialog() {
  categoryDialogOpen.value = false
  editingCategory.value = null
  categoryName.value = ''
  categoryImagePreview.value = null
  categoryImageFile.value = null
}

async function handleCategoryImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    alert('Only images are allowed for categories')
    return
  }

  categoryImageFile.value = file
  categoryImagePreview.value = URL.createObjectURL(file)
  if (target) target.value = ''
}

async function saveCategory() {
  if (!editingCategory.value) return
  
  if (!categoryName.value.trim()) {
    alert('Category name is required')
    return
  }
  
  try {
    // Update category name if it changed
    if (categoryName.value !== editingCategory.value.name) {
      await menuStore.updateCategory(editingCategory.value.id, { name: categoryName.value.trim() })
    }
    
    // Upload image if new file selected
    if (categoryImageFile.value) {
      await menuStore.uploadCategoryImage(editingCategory.value.id, categoryImageFile.value)
    }
    
    closeCategoryDialog()
  } catch (error) {
    alert('Failed to save category')
  }
}

async function deleteCategoryImageHandler() {
  if (!editingCategory.value) return
  
  if (!confirm('Are you sure you want to delete this category image?')) return
  
  try {
    await menuStore.deleteCategoryImage(editingCategory.value.id)
    categoryImagePreview.value = null
    categoryImageFile.value = null
    toast.success('Category image deleted successfully')
  } catch (error) {
    console.error('Failed to delete category image', error)
    toast.error('Failed to delete category image')
  }
}

function openProductDialog(product?: any, categoryId?: string) {
  productDialogOpen.value = true
  if (product) {
    editingProduct.value = product
    // Parse allergens - handle both string and already parsed formats
    let parsedAllergens = []
    if (product.allergens) {
      try {
        if (typeof product.allergens === 'string') {
          parsedAllergens = JSON.parse(product.allergens)
        } else if (Array.isArray(product.allergens)) {
          parsedAllergens = product.allergens
        }
      } catch (e) {
        console.error('Failed to parse allergens:', e)
        parsedAllergens = []
      }
    }
    
    let parsedNutritional = {
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      sugar: '',
      sodium: ''
    }
    if (product.nutritionalValues) {
      try {
        const parsed = typeof product.nutritionalValues === 'string' 
          ? JSON.parse(product.nutritionalValues) 
          : product.nutritionalValues
        parsedNutritional = { ...parsedNutritional, ...parsed }
      } catch (e) {
        console.error('Failed to parse nutritional values:', e)
      }
    }
    
    productForm.value = {
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      weight: product.weight || '',
      ingredients: product.ingredients || '',
      nutritionalValues: parsedNutritional,
      isCombo: product.isCombo || false,
      isFeatured: product.isFeatured || false,
      allergens: parsedAllergens,
      modifiers: product.modifiers ? (typeof product.modifiers === 'string' ? JSON.parse(product.modifiers) : product.modifiers) : { sizes: [], extras: [] }
    }
    // Convert old format to new format if needed
    if (productForm.value.modifiers.sizes && productForm.value.modifiers.sizes.length > 0 && typeof productForm.value.modifiers.sizes[0] === 'string') {
      productForm.value.modifiers.sizes = productForm.value.modifiers.sizes.map((s: any) => ({ name: s.name, price: s.price }))
    }
    if (productForm.value.modifiers.extras && productForm.value.modifiers.extras.length > 0 && typeof productForm.value.modifiers.extras[0] === 'string') {
      productForm.value.modifiers.extras = productForm.value.modifiers.extras.map((e: any) => ({ name: e.name, price: e.price }))
    }
    selectedCategory.value = product.categoryId
    // Load images - ensure we have the full URL
    productImages.value = (product.images || []).map((img: any) => {
      let imageUrl = img.url || ''
      // Handle both relative and absolute URLs
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:')) {
        // If it starts with /, use it directly, otherwise prepend /
        if (!imageUrl.startsWith('/')) {
          imageUrl = `/${imageUrl}`
        }
        imageUrl = `http://localhost:3000${imageUrl}`
      }
      return {
        id: img.id,
        url: imageUrl,
        type: img.type || 'image'
      }
    })
    console.log('Loaded product images:', productImages.value)
    imageFiles.value = []
    loadProductRelations(product.id)
  } else {
    editingProduct.value = null
    productForm.value = {
      name: '',
      description: '',
      price: '',
      weight: '',
      ingredients: '',
      nutritionalValues: {
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        sugar: '',
        sodium: ''
      },
      isCombo: false,
      isFeatured: false,
      allergens: [],
      modifiers: { sizes: [], extras: [] }
    }
    selectedCategory.value = categoryId || null
    productImages.value = []
    imageFiles.value = []
    productRelations.value = []
  }
}

async function loadProductRelations(productId: string) {
  try {
    productRelations.value = await menuStore.getProductRelations(productId)
  } catch (error) {
    console.error('Failed to load relations', error)
  }
}

function closeProductDialog() {
  productDialogOpen.value = false
  editingProduct.value = null
  productForm.value = {
    name: '',
    description: '',
    price: '',
    weight: '',
    ingredients: '',
    nutritionalValues: {
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      sugar: '',
      sodium: ''
    },
    isCombo: false,
    isFeatured: false,
    allergens: [],
    modifiers: { sizes: [], extras: [] }
  }
  selectedCategory.value = null
  productImages.value.forEach(img => {
    if (img.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url)
    }
  })
  productImages.value = []
  imageFiles.value = []
  productRelations.value = []
}

async function saveProduct(categoryId: string) {
  // Log the current state before processing
  console.log('saveProduct called - productForm.value.allergens:', productForm.value.allergens)
  console.log('Type of allergens:', typeof productForm.value.allergens, 'Is array:', Array.isArray(productForm.value.allergens))
  
  // Ensure allergens is properly formatted as an array (not a string)
  let allergensToSave: string[] | null = null
  if (productForm.value.allergens) {
    if (Array.isArray(productForm.value.allergens)) {
      allergensToSave = productForm.value.allergens.length > 0 ? [...productForm.value.allergens] : null
    } else if (typeof productForm.value.allergens === 'string') {
      // If it's already a string, parse it first
      try {
        const parsed = JSON.parse(productForm.value.allergens)
        allergensToSave = Array.isArray(parsed) && parsed.length > 0 ? parsed : null
      } catch (e) {
        console.error('Failed to parse allergens string:', e)
        allergensToSave = null
      }
    }
  }
  
  // Prepare nutritional values - only include non-empty values
  const nutritionalValuesToSave: any = {}
  Object.keys(productForm.value.nutritionalValues).forEach(key => {
    const value = productForm.value.nutritionalValues[key as keyof typeof productForm.value.nutritionalValues]
    if (value && value.toString().trim() !== '') {
      nutritionalValuesToSave[key] = parseFloat(value.toString()) || 0
    }
  })
  
  const productData: any = {
    name: productForm.value.name,
    description: productForm.value.description,
    price: productForm.value.price,
    weight: productForm.value.weight || null,
    ingredients: productForm.value.ingredients || null,
    nutritionalValues: Object.keys(nutritionalValuesToSave).length > 0 ? nutritionalValuesToSave : null,
    isCombo: productForm.value.isCombo,
    isFeatured: productForm.value.isFeatured,
    categoryId: editingProduct.value ? editingProduct.value.categoryId : categoryId,
    allergens: allergensToSave, // Send as array, backend will stringify it
    modifiers: (productForm.value.modifiers.sizes.length > 0 || productForm.value.modifiers.extras.length > 0) 
      ? productForm.value.modifiers 
      : null
  }

  console.log('Saving product with allergens (as array):', allergensToSave)
  console.log('Product data being sent:', JSON.stringify(productData, null, 2))

  let savedProduct
  if (editingProduct.value) {
    const success = await menuStore.updateProduct(editingProduct.value.id, productData)
    if (!success) {
      alert('Failed to update product. Please try again.')
      return
    }
    savedProduct = editingProduct.value
  } else {
    savedProduct = await menuStore.createProduct(productData)
    if (!savedProduct) {
      alert('Failed to create product. Please try again.')
      return
    }
  }
  
  // Upload any new images
  for (const file of imageFiles.value) {
    if (savedProduct?.id) {
      try {
        await menuStore.uploadProductImage(savedProduct.id, file)
      } catch (error) {
        console.error('Failed to upload image:', error)
        alert('Failed to upload some images. Product was saved but images may be missing.')
      }
    }
  }
  
  closeProductDialog()
}

async function deleteProduct(productId: string) {
  if (!confirm('Are you sure you want to delete this product?')) return
  try {
    const success = await menuStore.deleteProduct(productId)
    if (!success) {
      alert('Failed to delete product. Please try again.')
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    alert('Failed to delete product. Please try again.')
  }
}

function toggleProductAllergen(allergenName: string, pressed: boolean) {
  console.log('toggleProductAllergen called:', allergenName, 'pressed:', pressed, 'current allergens:', [...productForm.value.allergens])
  
  // Create a new array reference to ensure Vue reactivity
  const currentAllergens = [...productForm.value.allergens]
  
  if (pressed) {
    // Add allergen if not already present
    if (!currentAllergens.includes(allergenName)) {
      currentAllergens.push(allergenName)
    }
  } else {
    // Remove allergen
    const index = currentAllergens.indexOf(allergenName)
    if (index > -1) {
      currentAllergens.splice(index, 1)
    }
  }
  
  // Assign new array to trigger reactivity
  productForm.value.allergens = currentAllergens
  console.log('Final allergens after update:', productForm.value.allergens)
}

async function addAllergen() {
  if (!newAllergenName.value.trim()) return
  const result = await menuStore.createAllergen(newAllergenName.value.trim())
  if (result) {
    newAllergenName.value = ''
  } else {
    alert('Failed to create allergen. It may already exist.')
  }
}

function startEditAllergen(allergen: any) {
  editingAllergen.value = allergen
  allergenEditName.value = allergen.name
}

function cancelEditAllergen() {
  editingAllergen.value = null
  allergenEditName.value = ''
}

async function saveAllergen() {
  if (!editingAllergen.value || !allergenEditName.value.trim()) return
  const success = await menuStore.updateAllergen(editingAllergen.value.id, allergenEditName.value.trim())
  if (success) {
    cancelEditAllergen()
  } else {
    alert('Failed to update allergen. It may already exist.')
  }
}

async function deleteAllergen(allergenId: string) {
  if (!confirm('Are you sure you want to delete this allergen?')) return
  const success = await menuStore.deleteAllergen(allergenId)
  if (!success) {
    alert('Failed to delete allergen')
  }
}

function addSize() {
  productForm.value.modifiers.sizes.push({ name: '', price: 0 })
}

function removeSize(index: number) {
  productForm.value.modifiers.sizes.splice(index, 1)
}

function addExtra() {
  productForm.value.modifiers.extras.push({ name: '', price: 1.0 })
}

function removeExtra(index: number) {
  productForm.value.modifiers.extras.splice(index, 1)
}

// Modifier Template Management
function loadModifierTemplates() {
  try {
    const saved = localStorage.getItem('modifier_templates')
    if (saved) {
      modifierTemplates.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load modifier templates', e)
  }
}

function saveModifierTemplate() {
  const name = prompt('Enter a name for this modifier template:')
  if (!name) return
  
  const template = {
    name: name.trim(),
    modifiers: {
      sizes: [...productForm.value.modifiers.sizes],
      extras: [...productForm.value.modifiers.extras]
    }
  }
  
  modifierTemplates.value.push(template)
  try {
    localStorage.setItem('modifier_templates', JSON.stringify(modifierTemplates.value))
    alert('Template saved successfully!')
  } catch (e) {
    console.error('Failed to save template', e)
    alert('Failed to save template')
  }
}

function loadModifierTemplate(template: any) {
  productForm.value.modifiers = {
    sizes: template.modifiers.sizes ? [...template.modifiers.sizes] : [],
    extras: template.modifiers.extras ? [...template.modifiers.extras] : []
  }
  showModifierTemplates.value = false
}

function deleteModifierTemplate(index: number) {
  if (confirm('Are you sure you want to delete this template?')) {
    modifierTemplates.value.splice(index, 1)
    try {
      localStorage.setItem('modifier_templates', JSON.stringify(modifierTemplates.value))
    } catch (e) {
      console.error('Failed to delete template', e)
    }
  }
}

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingImage.value = true
  try {
    const blobUrl = URL.createObjectURL(file)
    const fileType = file.type.startsWith('video/') ? 'video' : 'image'
    productImages.value.push({ url: blobUrl, type: fileType })
    imageFiles.value.push(file)
  } catch (error) {
    console.error('Failed to process image', error)
    alert('Failed to process image')
  } finally {
    uploadingImage.value = false
    if (target) target.value = ''
  }
}

async function deleteImage(imageId: string, index: number) {
  if (imageId && editingProduct.value) {
    await menuStore.deleteProductImage(editingProduct.value.id, imageId)
  }
  productImages.value.splice(index, 1)
}

function getModifiers(product: any) {
  if (!product.modifiers) return null
  try {
    const mods = JSON.parse(product.modifiers)
    if (mods.sizes && mods.sizes.length > 0 && typeof mods.sizes[0] === 'string') {
      return { sizes: mods.sizes.map((s: string) => ({ name: s })), extras: mods.extras || [] }
    }
    return mods
  } catch {
    return null
  }
}

const availableProducts = computed(() => {
  const allProducts: any[] = []
  menuStore.categories.forEach(cat => {
    if (cat.products) {
      cat.products.forEach((p: any) => {
        if (!editingProduct.value || p.id !== editingProduct.value.id) {
          allProducts.push({ ...p, categoryName: cat.name })
        }
      })
    }
  })
  return allProducts
})

const allergenUpdate = (allergenName: string, value: boolean) => {
  console.log('allergen', allergenName, value)
  toggleProductAllergen(allergenName, value)
}
// Computed property to check if an allergen is selected (for better reactivity)
const isAllergenSelected = (allergenName: string) => {
  const includes = productForm.value.allergens.includes(allergenName)
  console.log('isAllergenSelected called:', allergenName, 'includes:', includes)
  return includes
}

async function addRelation() {
  if (!editingProduct.value) return
  const relatedProductId = prompt('Enter product ID or select from list')
  if (!relatedProductId) return
  
  const product = availableProducts.value.find(p => p.id === relatedProductId || p.name.toLowerCase().includes(relatedProductId.toLowerCase()))
  if (!product) {
    alert('Product not found')
    return
  }

  const groupName = prompt('Group name (e.g., "Sides"):') || 'Options'
  const priceModifier = parseFloat(prompt('Price modifier (can be negative):') || '0')
  const isRequired = confirm('Is this option required? (must select one from group)')

  try {
    await menuStore.addProductRelation(editingProduct.value.id, {
      relatedProductId: product.id,
      groupName,
      priceModifier,
      isRequired
    })
    await loadProductRelations(editingProduct.value.id)
  } catch (error) {
    alert('Failed to add relation')
  }
}

async function removeRelation(relationId: string) {
  if (!editingProduct.value) return
  if (!confirm('Remove this relation?')) return
  try {
    await menuStore.deleteProductRelation(editingProduct.value.id, relationId)
    await loadProductRelations(editingProduct.value.id)
  } catch (error) {
    alert('Failed to remove relation')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Menu Management</h2>
        <p class="mt-1 text-muted-foreground">Manage your categories and products</p>
      </div>
    </div>

    <!-- Manage Allergens -->
    <Card>
      <CardHeader>
        <CardTitle>Manage Allergens</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex gap-4">
          <Input v-model="newAllergenName" placeholder="Allergen Name (e.g. Gluten)" class="flex-1" @keyup.enter="addAllergen" />
          <Button @click="addAllergen" :disabled="menuStore.loading || !newAllergenName.trim()" class="bg-primary text-primary-foreground">Add Allergen</Button>
        </div>
        <div v-if="menuStore.allergens.length > 0" class="space-y-2">
          <div
            v-for="allergen in menuStore.allergens"
            :key="allergen.id"
            class="flex gap-2 items-center p-2 rounded border"
          >
            <Input
              v-if="editingAllergen?.id === allergen.id"
              v-model="allergenEditName"
              class="flex-1"
              @keyup.enter="saveAllergen"
              @keyup.escape="cancelEditAllergen"
            />
            <span v-else class="flex-1 font-medium">{{ allergen.name }}</span>
            <div class="flex gap-2">
              <Button
                v-if="editingAllergen?.id === allergen.id"
                size="sm"
                variant="outline"
                @click="saveAllergen"
              >
                Save
              </Button>
              <Button
                v-if="editingAllergen?.id === allergen.id"
                size="sm"
                variant="outline"
                @click="cancelEditAllergen"
              >
                Cancel
              </Button>
              <Button
                v-else
                size="sm"
                variant="ghost"
                @click="startEditAllergen(allergen)"
              >
                <Edit class="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                @click="deleteAllergen(allergen.id)"
                class="text-destructive hover:text-destructive"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div v-else class="py-4 text-sm text-center text-muted-foreground">
          No allergens yet. Add your first allergen above.
        </div>
      </CardContent>
    </Card>

    <!-- Add Category -->
    <Card>
      <CardHeader>
        <CardTitle>Add Category</CardTitle>
      </CardHeader>
      <CardContent class="flex gap-4">
        <Input v-model="newCategoryName" placeholder="Category Name (e.g. Starters)" class="flex-1" />
        <Button @click="addCategory" :disabled="menuStore.loading" class="bg-primary text-primary-foreground">Add Category</Button>
      </CardContent>
    </Card>

    <!-- Category Cards -->
    <div class="grid grid-cols-1 gap-4">
      <Card 
        v-for="category in menuStore.categories" 
        :key="category.id"
        class="transition-all cursor-pointer hover:shadow-lg"
        :class="expandedCategories.has(category.id) ? 'ring-2 ring-primary' : ''"
      >
        <CardHeader @click="toggleCategory(category.id)" class="pb-3">
          <div class="flex justify-between items-center">
            <div class="flex flex-1 gap-3 items-center">
              <div 
                v-if="category.imageUrl" 
                class="overflow-hidden w-16 h-16 rounded-lg bg-muted shrink-0"
              >
                <img 
                  :src="category.imageUrl.startsWith('http') ? category.imageUrl : `http://localhost:3000${category.imageUrl}`" 
                  :alt="category.name"
                  class="object-cover w-full h-full"
                />
              </div>
              <div 
                v-else
                class="flex justify-center items-center w-16 h-16 rounded-lg bg-muted shrink-0"
              >
                <ImageIcon class="w-8 h-8 text-muted-foreground" />
              </div>
              <div class="flex-1 min-w-0">
                <CardTitle class="text-lg">{{ category.name }}</CardTitle>
                <p class="text-sm text-muted-foreground">
                  {{ category.products?.length || 0 }} products
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              @click.stop="openCategoryDialog(category)"
              class="shrink-0"
            >
              <Edit class="w-4 h-4" />
            </Button>
            <div 
              class="shrink-0"
              @click.stop="toggleCategory(category.id)"
            >
              <ChevronDown 
                v-if="!expandedCategories.has(category.id)" 
                class="w-5 h-5 text-muted-foreground"
              />
              <ChevronUp 
                v-else 
                class="w-5 h-5 text-muted-foreground"
              />
            </div>
          </div>
        </CardHeader>
        
        <!-- Products Table (shown when expanded) -->
        <CardContent v-if="expandedCategories.has(category.id)" @click.stop>
          <div class="flex justify-end mb-4">
            <Button 
              size="sm"
              @click="openProductDialog(undefined, category.id)"
              class="bg-primary text-primary-foreground"
            >
              <Plus class="mr-1 w-4 h-4" />
              Add Product
            </Button>
          </div>
          
          <div v-if="category.products && category.products.length > 0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Modifiers</TableHead>
                  <TableHead>Allergens</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="product in category.products" :key="product.id">
                  <TableCell class="font-medium">{{ product.name }}</TableCell>
                  <TableCell class="max-w-xs truncate">{{ product.description || '-' }}</TableCell>
                  <TableCell>${{ product.price?.toFixed(2) }}</TableCell>
                  <TableCell>
                    <div class="flex flex-wrap gap-1">
                      <Badge v-if="getModifiers(product)?.sizes?.length" variant="secondary" class="text-xs">
                        {{ getModifiers(product).sizes.length }} sizes
                      </Badge>
                      <Badge v-if="getModifiers(product)?.extras?.length" variant="secondary" class="text-xs">
                        {{ getModifiers(product).extras.length }} extras
                      </Badge>
                      <Badge v-if="product.isCombo" variant="default" class="text-xs">Combo</Badge>
                      <Badge v-if="product.isFeatured" variant="secondary" class="text-xs">Featured</Badge>
                      <span v-if="!getModifiers(product)?.sizes?.length && !getModifiers(product)?.extras?.length && !product.isCombo && !product.isFeatured" class="text-sm text-muted-foreground">-</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div v-if="product.allergens" class="flex flex-wrap gap-1">
                      <Badge v-for="allergen in JSON.parse(product.allergens)" :key="allergen" variant="destructive" class="text-xs">
                        {{ allergen }}
                      </Badge>
                    </div>
                    <span v-else class="text-sm text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        @click="openProductDialog(product)"
                      >
                        <Edit class="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        @click="deleteProduct(product.id)"
                        class="text-destructive hover:text-destructive"
                      >
                        <Trash2 class="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div v-else class="py-8 text-center text-muted-foreground">
            <p>No products yet. Click "Add Product" to get started.</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Category Edit Dialog -->
    <Dialog :open="categoryDialogOpen" @update:open="categoryDialogOpen = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div class="py-4 space-y-4">
          <div>
            <Label>Category Name *</Label>
            <Input v-model="categoryName" placeholder="Category Name" class="mt-2" />
          </div>
          <div>
            <Label>Category Image</Label>
            <div class="mt-2">
              <div v-if="categoryImagePreview" class="relative mb-4">
                <img :src="categoryImagePreview" alt="Category" class="object-cover w-full h-48 rounded-lg border" />
                <Button
                  size="sm"
                  variant="destructive"
                  class="absolute top-2 right-2"
                  @click="deleteCategoryImageHandler"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
              <label class="flex flex-col justify-center items-center w-full h-32 rounded-lg border-2 border-dashed transition cursor-pointer hover:bg-accent">
                <Upload class="mb-2 w-8 h-8 text-muted-foreground" />
                <span class="text-sm text-muted-foreground">Click to upload image</span>
                <input type="file" accept="image/*" class="hidden" @change="handleCategoryImageUpload" />
              </label>
              <p class="mt-2 text-xs text-muted-foreground">Only images are allowed for categories</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeCategoryDialog">Cancel</Button>
          <Button 
            @click="saveCategory" 
            :disabled="!categoryName.trim()"
            class="bg-primary text-primary-foreground"
          >
            Save Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Product Edit/Create Dialog -->
    <Dialog :open="productDialogOpen" @update:open="productDialogOpen = $event">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingProduct ? 'Edit Product' : 'Add New Product' }}</DialogTitle>
        </DialogHeader>

        <div class="py-4 space-y-6">
          <!-- Basic Info -->
          <div class="grid gap-4">
            <div>
              <Label>Product Name *</Label>
              <Input v-model="productForm.name" placeholder="Burger" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea v-model="productForm.description" placeholder="Delicious burger with..." rows="3" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Price *</Label>
                <Input v-model="productForm.price" type="number" step="0.01" placeholder="10.99" />
              </div>
              <div>
                <Label>Weight/Volume</Label>
                <Input v-model="productForm.weight" placeholder="500g, 250ml, 1kg" />
              </div>
            </div>
            <div>
              <Label>Ingredients (Optional)</Label>
              <Textarea v-model="productForm.ingredients" placeholder="Beef, Potatoes, Vegetables..." rows="2" />
            </div>
            <div>
              <Label>Nutritional Values (per 100g/ml) - Optional</Label>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Input v-model="productForm.nutritionalValues.calories" type="number" placeholder="Calories (kcal)" />
                </div>
                <div>
                  <Input v-model="productForm.nutritionalValues.protein" type="number" step="0.1" placeholder="Protein (g)" />
                </div>
                <div>
                  <Input v-model="productForm.nutritionalValues.carbs" type="number" step="0.1" placeholder="Carbs (g)" />
                </div>
                <div>
                  <Input v-model="productForm.nutritionalValues.fat" type="number" step="0.1" placeholder="Fat (g)" />
                </div>
                <div>
                  <Input v-model="productForm.nutritionalValues.fiber" type="number" step="0.1" placeholder="Fiber (g)" />
                </div>
                <div>
                  <Input v-model="productForm.nutritionalValues.sugar" type="number" step="0.1" placeholder="Sugar (g)" />
                </div>
                <div>
                  <Input v-model="productForm.nutritionalValues.sodium" type="number" step="0.1" placeholder="Sodium (mg)" />
                </div>
              </div>
            </div>
            <div class="flex gap-4 items-end">
                <label class="flex gap-2 items-center cursor-pointer">
                  <Checkbox v-model="productForm.isCombo" />
                  <span class="text-sm">This is a combo meal</span>
                </label>
                <label class="flex gap-2 items-center cursor-pointer">
                  <Checkbox v-model="productForm.isFeatured" />
                  <span class="text-sm">Featured product</span>
                </label>
            </div>
          </div>

          <!-- Image/Video Upload -->
          <div>
            <Label class="block mb-2">Product Images/Videos</Label>
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div 
                v-for="(img, index) in productImages" 
                :key="img.id || `img-${index}`"
                class="overflow-hidden relative rounded-lg border aspect-video bg-muted"
              >
                <img v-if="img.type === 'image'" :src="img.url" alt="Product" class="object-cover w-full h-full" />
                <video v-else :src="img.url" class="object-cover w-full h-full" controls />
                <Button 
                  size="sm" 
                  variant="destructive" 
                  class="absolute top-2 right-2"
                  @click="deleteImage(img.id || '', index)"
                >
                  <X class="w-4 h-4" />
                </Button>
              </div>
              <label class="flex flex-col justify-center items-center rounded-lg border-2 border-dashed transition cursor-pointer aspect-video hover:bg-accent">
                <Upload class="mb-2 w-8 h-8 text-muted-foreground" />
                <span class="text-sm text-muted-foreground">Add Image/Video</span>
                <input type="file" accept="image/*,video/*" class="hidden" @change="handleImageUpload" />
              </label>
            </div>
          </div>

          <!-- Allergens -->
          <div>
            <Label class="block mb-2">Allergens</Label>
            <div v-if="menuStore.allergens.length === 0" class="p-4 mb-4 text-sm rounded-lg text-muted-foreground bg-muted">
              No allergens available. Add allergens in the "Manage Allergens" section above.
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <Toggle
                v-for="{ name, id } in menuStore.allergens"
                :key="`allergen-${id}`"
                :pressed="isAllergenSelected(name)" 
                @update:model-value="allergenUpdate(name, $event)"
                variant="outline"
                class="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {{ name }}
              </Toggle>
            </div>
            <div v-if="productForm.allergens.length > 0" class="mt-2 text-xs text-muted-foreground">
              Selected: {{ productForm.allergens.join(', ') }}
            </div>
          </div>

          <!-- Custom Size Options with Pricing -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <Label>Size Options (Custom Names & Pricing)</Label>
              <Button size="sm" variant="outline" @click="addSize">
                <Plus class="mr-1 w-4 h-4" />
                Add Size
              </Button>
            </div>
            <div class="space-y-2">
              <div 
                v-for="(size, index) in productForm.modifiers.sizes" 
                :key="index"
                class="flex gap-2 items-center p-2 rounded border"
              >
                <Input v-model="size.name" placeholder="Size name (e.g., SM, MD, LG, XL, XXL, Family)" class="flex-1" />
                <Input v-model.number="size.price" type="number" step="0.01" placeholder="Price" class="w-24" />
                <span class="text-sm text-muted-foreground">$</span>
                <Button size="sm" variant="ghost" @click="removeSize(index)">
                  <X class="w-4 h-4" />
                </Button>
              </div>
              <p v-if="productForm.modifiers.sizes.length === 0" class="text-xs text-muted-foreground">No sizes added. Base price will be used.</p>
            </div>
          </div>

          <!-- Custom Extra Options with Pricing -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <Label>Extra Options</Label>
              <div class="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  @click="saveModifierTemplate"
                  :disabled="productForm.modifiers.extras.length === 0 && productForm.modifiers.sizes.length === 0"
                >
                  Save Template
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  @click="showModifierTemplates = !showModifierTemplates"
                >
                  Load Template
                </Button>
                <Button size="sm" variant="outline" @click="addExtra">
                  <Plus class="mr-1 w-4 h-4" />
                  Add Extra
                </Button>
              </div>
            </div>
            <div v-if="showModifierTemplates" class="mb-4 p-3 bg-muted rounded-lg">
              <Label class="mb-2 block text-sm">Saved Templates</Label>
              <div v-if="modifierTemplates.length === 0" class="text-xs text-muted-foreground mb-2">
                No templates saved. Create modifiers and click "Save Template" to create one.
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="(template, index) in modifierTemplates"
                  :key="index"
                  class="flex justify-between items-center p-2 bg-background rounded border"
                >
                  <div>
                    <p class="text-sm font-medium">{{ template.name || `Template ${index + 1}` }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ template.modifiers.sizes?.length || 0 }} sizes, {{ template.modifiers.extras?.length || 0 }} extras
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <Button size="sm" variant="ghost" @click="loadModifierTemplate(template)">
                      Load
                    </Button>
                    <Button size="sm" variant="ghost" @click="deleteModifierTemplate(index)" class="text-destructive">
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <div 
                v-for="(extra, index) in productForm.modifiers.extras" 
                :key="index"
                class="flex gap-2 items-center p-2 rounded border"
              >
                <Input v-model="extra.name" placeholder="Extra name (e.g., Extra Cheese)" class="flex-1" />
                <Input v-model.number="extra.price" type="number" step="0.01" placeholder="Price" class="w-24" />
                <span class="text-sm text-muted-foreground">$</span>
                <Button size="sm" variant="ghost" @click="removeExtra(index)">
                  <X class="w-4 h-4" />
                </Button>
              </div>
              <p v-if="productForm.modifiers.extras.length === 0" class="text-xs text-muted-foreground">No extras added.</p>
            </div>
          </div>

          <!-- Product Relations/Combo Meals -->
          <div v-if="editingProduct && productForm.isCombo">
            <div class="flex justify-between items-center mb-2">
              <Label>Related Products (Combo Options)</Label>
              <Button size="sm" variant="outline" @click="addRelation">
                <LinkIcon class="mr-1 w-4 h-4" />
                Add Related Product
              </Button>
            </div>
            <div v-if="productRelations.length > 0" class="space-y-2">
              <div 
                v-for="relation in productRelations" 
                :key="relation.id"
                class="flex justify-between items-center p-2 rounded border"
              >
                <div>
                  <span class="font-medium">{{ relation.relatedProduct?.name }}</span>
                  <Badge v-if="relation.groupName" variant="secondary" class="ml-2">{{ relation.groupName }}</Badge>
                  <Badge v-if="relation.isRequired" variant="default" class="ml-2">Required</Badge>
                  <span class="ml-2 text-sm text-muted-foreground">
                    {{ relation.priceModifier >= 0 ? '+' : '' }}${{ relation.priceModifier.toFixed(2) }}
                  </span>
                </div>
                <Button size="sm" variant="ghost" @click="removeRelation(relation.id)">
                  <X class="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p v-else class="text-xs text-muted-foreground">No related products. Add products that can be combined with this combo meal (e.g., sides, drinks).</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeProductDialog">Cancel</Button>
          <Button 
            @click="saveProduct(selectedCategory || editingProduct?.categoryId || '')" 
            :disabled="!productForm.name || !productForm.price || !selectedCategory && !editingProduct"
            class="bg-primary text-primary-foreground"
          >
            {{ editingProduct ? 'Update' : 'Create' }} Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
