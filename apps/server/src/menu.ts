import express, { Router, Response } from 'express';
import prisma from './prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { upload, UPLOADS_DIR } from './upload';
import { uploadFile, deleteFile, STORAGE_TYPE } from './storage';
import path from 'path';
import fs from 'fs';

const router = Router();

// --- Categories ---

// Get all categories for the restaurant
router.get('/categories', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
     if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const categories = await prisma.category.findMany({
      where: { restaurantId: req.user.restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: { 
        products: {
          include: {
            images: true,
            baseRelations: {
              include: {
                relatedProduct: true
              }
            }
          }
        }
      }
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Create Category
router.post('/categories', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, imageUrl } = req.body;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const category = await prisma.category.create({
      data: {
        name,
        imageUrl: imageUrl || null,
        restaurantId: req.user.restaurantId,
      }
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

// --- Products ---

// Create Product
router.post('/products', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, description, price, weight, ingredients, nutritionalValues, categoryId, isFeatured, allergens, modifiers } = req.body;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    // Verify category belongs to restaurant
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.restaurantId !== req.user.restaurantId) {
        return res.status(400).json({ success: false, error: 'Invalid category' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        weight: weight || null,
        ingredients: ingredients || null,
        nutritionalValues: nutritionalValues ? JSON.stringify(nutritionalValues) : null,
        isFeatured: isFeatured || false,
        allergens: allergens ? JSON.stringify(allergens) : null,
        modifiers: modifiers ? JSON.stringify(modifiers) : null,
        restaurantId: req.user.restaurantId,
        categoryId
      }
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// Update Category
router.put('/categories/:categoryId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  const { name, sortOrder, imageUrl } = req.body;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const updateData: any = { name, sortOrder };
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: updateData
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

// Upload category image
router.post('/categories/:categoryId/image', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    
    // Only allow images for categories
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'Only images are allowed for categories' });
    }
    
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Delete old image if exists
    if (category.imageUrl) {
      try {
        await deleteFile(category.imageUrl);
      } catch (e) {
        console.error('Failed to delete old category image:', e);
      }
    }

    const uploadResult = await uploadFile(req.file);
    
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: { imageUrl: uploadResult.url }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to upload category image' });
  }
});

// Delete Category
router.delete('/categories/:categoryId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    await prisma.category.delete({ where: { id: categoryId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

// Update Product
router.put('/products/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { name, description, price, weight, ingredients, nutritionalValues, categoryId, isAvailable, isFeatured, allergens, modifiers } = req.body;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (weight !== undefined) updateData.weight = weight || null;
    if (ingredients !== undefined) updateData.ingredients = ingredients || null;
    if (nutritionalValues !== undefined) updateData.nutritionalValues = nutritionalValues ? JSON.stringify(nutritionalValues) : null;
    if (categoryId !== undefined) {
      // Verify category belongs to restaurant
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category || category.restaurantId !== req.user.restaurantId) {
        return res.status(400).json({ success: false, error: 'Invalid category' });
      }
      updateData.categoryId = categoryId;
    }
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (allergens !== undefined) updateData.allergens = allergens ? JSON.stringify(allergens) : null;
    if (modifiers !== undefined) updateData.modifiers = modifiers ? JSON.stringify(modifiers) : null;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// Delete Product
router.delete('/products/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const product = await prisma.product.findUnique({ 
      where: { id: productId },
      include: { images: true }
    });
    if (!product || product.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Delete associated images
    for (const image of product.images) {
      try {
        await deleteFile(image.url);
      } catch (e) {
        console.error('Failed to delete image file:', e);
      }
    }

    await prisma.product.delete({ where: { id: productId } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

// Upload product image/video
router.post('/products/:productId/images', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const uploadResult = await uploadFile(req.file);

    const image = await prisma.productImage.create({
      data: {
        url: uploadResult.url,
        type: fileType,
        productId: productId
      }
    });

    res.json({ success: true, data: image });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// Delete product image
router.delete('/products/:productId/images/:imageId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { productId, imageId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    // Delete file from storage
    try {
      await deleteFile(image.url);
    } catch (e) {
      console.error('Failed to delete image file:', e);
    }

    await prisma.productImage.delete({ where: { id: imageId } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete image' });
  }
});

// Product Relations/Combo Meals
// Add related product to combo
router.post('/products/:productId/relations', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { relatedProductId, isRequired, groupName, priceModifier, sortOrder } = req.body;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const baseProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!baseProduct || baseProduct.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Base product not found' });
    }

    const relatedProduct = await prisma.product.findUnique({ where: { id: relatedProductId } });
    if (!relatedProduct || relatedProduct.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Related product not found' });
    }

    const relation = await prisma.productRelation.create({
      data: {
        baseProductId: productId,
        relatedProductId,
        isRequired: isRequired || false,
        groupName: groupName || null,
        priceModifier: parseFloat(priceModifier) || 0,
        sortOrder: sortOrder || 0
      }
    });

    res.json({ success: true, data: relation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create product relation' });
  }
});

// Get product relations
router.get('/products/:productId/relations', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const relations = await prisma.productRelation.findMany({
      where: { baseProductId: productId },
      include: {
        relatedProduct: true
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({ success: true, data: relations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch product relations' });
  }
});

// Delete product relation
router.delete('/products/:productId/relations/:relationId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { productId, relationId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await prisma.productRelation.delete({ where: { id: relationId } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete product relation' });
  }
});

// --- Allergens ---

// Get all allergens for the restaurant
router.get('/allergens', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const allergens = await prisma.allergen.findMany({
      where: { restaurantId: req.user.restaurantId },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: allergens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch allergens' });
  }
});

// Create allergen
router.post('/allergens', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Allergen name is required' });
    }
    
    const allergen = await prisma.allergen.create({
      data: {
        name: name.trim(),
        restaurantId: req.user.restaurantId
      }
    });
    res.status(201).json({ success: true, data: allergen });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Allergen already exists' });
    }
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create allergen' });
  }
});

// Update allergen
router.put('/allergens/:allergenId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { allergenId } = req.params;
  const { name } = req.body;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Allergen name is required' });
    }
    
    const allergen = await prisma.allergen.findUnique({ where: { id: allergenId } });
    if (!allergen || allergen.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Allergen not found' });
    }
    
    const updated = await prisma.allergen.update({
      where: { id: allergenId },
      data: { name: name.trim() }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Allergen name already exists' });
    }
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update allergen' });
  }
});

// Delete allergen
router.delete('/allergens/:allergenId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { allergenId } = req.params;
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const allergen = await prisma.allergen.findUnique({ where: { id: allergenId } });
    if (!allergen || allergen.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Allergen not found' });
    }
    
    await prisma.allergen.delete({ where: { id: allergenId } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete allergen' });
  }
});

export default router;
