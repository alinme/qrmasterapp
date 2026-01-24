/**
 * Utility functions for working with product data
 */

/**
 * Parse allergens from a product
 * @param product - Product object
 * @returns Array of allergen strings
 */
export function getAllergens(product: any): string[] {
  if (!product?.allergens) return []
  try {
    if (typeof product.allergens === 'string') {
      return JSON.parse(product.allergens)
    }
    return product.allergens
  } catch {
    return []
  }
}

/**
 * Get a nutritional value from a product
 * @param product - Product object
 * @param key - Nutritional value key (e.g., 'calories', 'protein')
 * @returns The nutritional value as a string, or null if not found
 */
export function getNutritionalValue(product: any, key: string): string | null {
  if (!product?.nutritionalValues) return null
  try {
    const values = typeof product.nutritionalValues === 'string' 
      ? JSON.parse(product.nutritionalValues) 
      : product.nutritionalValues
    return values[key] ? values[key].toString() : null
  } catch {
    return null
  }
}

/**
 * Parse modifiers from a product
 * @param product - Product object
 * @returns Object with sizes and extras arrays
 */
export function getModifiers(product: any): { sizes: string[], extras: string[] } {
  if (!product?.modifiers) return { sizes: [], extras: [] }
  try {
    return JSON.parse(product.modifiers)
  } catch {
    return { sizes: [], extras: [] }
  }
}

/**
 * Get available sizes from a product
 * @param product - Product object
 * @returns Array of size strings
 */
export function getAvailableSizes(product: any): string[] {
  const modifiers = getModifiers(product)
  return modifiers.sizes?.map((s: any) => s.name || s) || []
}

/**
 * Get available extras from a product
 * @param product - Product object
 * @returns Array of extra strings
 */
export function getAvailableExtras(product: any): string[] {
  const modifiers = getModifiers(product)
  return modifiers.extras?.map((e: any) => e.name || e) || []
}

/**
 * Calculate the final price of a product with modifiers
 * @param basePrice - Base price of the product
 * @param selectedModifiers - Object with selected size and extras
 * @returns Final calculated price
 */
export function calculatePriceWithModifiers(
  basePrice: number,
  selectedModifiers: { size: string | null, extras: string[] }
): number {
  let price = basePrice
  
  // Size modifiers
  if (selectedModifiers.size === 'Medium') {
    price = price * 1.2 // 20% increase
  } else if (selectedModifiers.size === 'Large') {
    price = price * 1.4 // 40% increase
  }
  
  // Extras modifiers (each extra adds 1 RON)
  if (selectedModifiers.extras && Array.isArray(selectedModifiers.extras)) {
    price += selectedModifiers.extras.length * 1.0
  }
  
  return price
}
