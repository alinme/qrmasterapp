import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useMenuStore = defineStore('menu', () => {
  const categories = ref<any[]>([])
  const allergens = ref<any[]>([])
  const loading = ref(false)

  async function fetchCategories() {
    loading.value = true
    try {
      const response = await axios.get(`${API_URL}/menu/categories`)
      if (response.data.success) {
        categories.value = response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch categories', error)
    } finally {
      loading.value = false
    }
  }

  async function createCategory(name: string) {
    try {
      const response = await axios.post(`${API_URL}/menu/categories`, { name })
      if (response.data.success) {
        await fetchCategories()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create category', error)
      return false
    }
    return false
  }

  async function updateCategory(categoryId: string, data: any) {
    try {
      const response = await axios.put(`${API_URL}/menu/categories/${categoryId}`, data)
      if (response.data.success) {
        await fetchCategories()
        return true
      }
    } catch (error) {
      console.error('Failed to update category', error)
      return false
    }
    return false
  }

  async function uploadCategoryImage(categoryId: string, file: File) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await axios.post(`${API_URL}/menu/categories/${categoryId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (response.data.success) {
        await fetchCategories()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to upload category image', error)
      throw error
    }
  }

  // BUGFIX #3 & #7: Add delete category image function
  async function deleteCategoryImage(categoryId: string) {
    try {
      const response = await axios.delete(`${API_URL}/menu/categories/${categoryId}/image`)
      if (response.data.success) {
        await fetchCategories()
        return true
      }
    } catch (error) {
      console.error('Failed to delete category image', error)
      throw error
    }
    return false
  }

  async function createProduct(product: any) {
    try {
      // Ensure allergens is an array, not a string
      const productData = { ...product }
      if (productData.allergens !== undefined && productData.allergens !== null) {
        if (typeof productData.allergens === 'string') {
          // If it's a string, parse it to an array
          try {
            productData.allergens = JSON.parse(productData.allergens)
          } catch (e) {
            console.error('Failed to parse allergens string:', e)
            productData.allergens = null
          }
        }
        // Ensure it's an array or null
        if (!Array.isArray(productData.allergens)) {
          productData.allergens = null
        }
      }
      console.log('Sending create request with allergens:', productData.allergens, 'type:', typeof productData.allergens)
      const response = await axios.post(`${API_URL}/menu/products`, productData)
      if (response.data.success) {
        await fetchCategories()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create product', error)
      return false
    }
    return false
  }

  async function updateProduct(productId: string, product: any) {
    try {
      // Ensure allergens is an array, not a string
      const productData = { ...product }
      if (productData.allergens !== undefined && productData.allergens !== null) {
        if (typeof productData.allergens === 'string') {
          // If it's a string, parse it to an array
          try {
            productData.allergens = JSON.parse(productData.allergens)
          } catch (e) {
            console.error('Failed to parse allergens string:', e)
            productData.allergens = null
          }
        }
        // Ensure it's an array or null
        if (!Array.isArray(productData.allergens)) {
          productData.allergens = null
        }
      }
      console.log('Sending update request with allergens:', productData.allergens, 'type:', typeof productData.allergens)
      const response = await axios.put(`${API_URL}/menu/products/${productId}`, productData)
      if (response.data.success) {
        await fetchCategories()
        return true
      }
    } catch (error) {
      console.error('Failed to update product', error)
      return false
    }
    return false
  }

  async function deleteProduct(productId: string) {
    try {
      const response = await axios.delete(`${API_URL}/menu/products/${productId}`)
      if (response.data.success) {
        await fetchCategories()
        return true
      } else {
        console.error('Delete product failed:', response.data.error)
        return false
      }
    } catch (error: any) {
      console.error('Failed to delete product', error)
      if (error.response?.data?.error) {
        console.error('Server error:', error.response.data.error)
      }
      return false
    }
  }

  async function uploadProductImage(productId: string, file: File) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await axios.post(`${API_URL}/menu/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (response.data.success) {
        await fetchCategories()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to upload image', error)
      throw error
    }
  }

  async function deleteProductImage(productId: string, imageId: string) {
    try {
      const response = await axios.delete(`${API_URL}/menu/products/${productId}/images/${imageId}`)
      if (response.data.success) {
        await fetchCategories()
        return true
      }
    } catch (error) {
      console.error('Failed to delete image', error)
      throw error
    }
  }

  async function addProductRelation(productId: string, relation: any) {
    try {
      const response = await axios.post(`${API_URL}/menu/products/${productId}/relations`, relation)
      if (response.data.success) {
        await fetchCategories()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to add product relation', error)
      throw error
    }
  }

  async function getProductRelations(productId: string) {
    try {
      const response = await axios.get(`${API_URL}/menu/products/${productId}/relations`)
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to get product relations', error)
      throw error
    }
  }

  async function deleteProductRelation(productId: string, relationId: string) {
    try {
      const response = await axios.delete(`${API_URL}/menu/products/${productId}/relations/${relationId}`)
      if (response.data.success) {
        await fetchCategories()
        return true
      }
    } catch (error) {
      console.error('Failed to delete product relation', error)
      throw error
    }
  }

  // Allergen management
  async function fetchAllergens() {
    try {
      const response = await axios.get(`${API_URL}/menu/allergens`)
      if (response.data.success) {
        allergens.value = response.data.data
      }
    } catch (error) {
      console.error('Failed to fetch allergens', error)
    }
  }

  async function createAllergen(name: string) {
    try {
      const response = await axios.post(`${API_URL}/menu/allergens`, { name })
      if (response.data.success) {
        await fetchAllergens()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to create allergen', error)
      return false
    }
    return false
  }

  async function updateAllergen(allergenId: string, name: string) {
    try {
      const response = await axios.put(`${API_URL}/menu/allergens/${allergenId}`, { name })
      if (response.data.success) {
        await fetchAllergens()
        return true
      }
    } catch (error) {
      console.error('Failed to update allergen', error)
      return false
    }
    return false
  }

  async function deleteAllergen(allergenId: string) {
    try {
      const response = await axios.delete(`${API_URL}/menu/allergens/${allergenId}`)
      if (response.data.success) {
        await fetchAllergens()
        return true
      }
    } catch (error) {
      console.error('Failed to delete allergen', error)
      return false
    }
    return false
  }

  // Menu Scheduling - Update category schedule
  async function updateCategorySchedule(categoryId: string, schedule: any) {
    try {
      const response = await axios.put(`${API_URL}/menu/categories/${categoryId}/schedule`, schedule)
      if (response.data.success) {
        await fetchCategories()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to update category schedule', error)
      throw error
    }
  }

  // Menu Scheduling - Update product schedule
  async function updateProductSchedule(productId: string, schedule: any) {
    try {
      const response = await axios.put(`${API_URL}/menu/products/${productId}/schedule`, schedule)
      if (response.data.success) {
        await fetchCategories()
        return response.data.data
      }
    } catch (error) {
      console.error('Failed to update product schedule', error)
      throw error
    }
  }

  return { 
    categories,
    allergens,
    loading, 
    fetchCategories,
    fetchAllergens,
    createCategory,
    updateCategory,
    uploadCategoryImage,
    deleteCategoryImage,
    createProduct, 
    updateProduct, 
    deleteProduct,
    uploadProductImage,
    deleteProductImage,
    addProductRelation,
    getProductRelations,
    deleteProductRelation,
    createAllergen,
    updateAllergen,
    deleteAllergen,
    updateCategorySchedule,
    updateProductSchedule
  }
})
