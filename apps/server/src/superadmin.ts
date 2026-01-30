import express, { Router, Response } from 'express';
import prisma from './prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { requireSuperAdmin } from './middleware/rbac';
import bcrypt from 'bcryptjs';
import { upload } from './upload';
import { uploadFile, deleteFile } from './storage';

const router = Router();

// Get all restaurants (Super Admin only)
router.get('/restaurants', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            orders: true,
            products: true,
            tables: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurants' });
  }
});

// Create restaurant (Super Admin only)
router.post('/restaurants', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, address, logoUrl, phoneNumber, contactPerson, contractStart, contractEnd } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, error: 'Name and slug are required' });
    }

    // Check if slug already exists
    const existing = await prisma.restaurant.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Restaurant slug already taken' });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        address: address || null,
        logoUrl: logoUrl || null,
        phoneNumber: phoneNumber || null,
        contactPerson: contactPerson || null,
        contractStart: contractStart ? new Date(contractStart) : null,
        contractEnd: contractEnd ? new Date(contractEnd) : null
      },
      include: {
        users: true,
        _count: {
          select: {
            orders: true,
            products: true,
            tables: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ success: false, error: 'Failed to create restaurant' });
  }
});

// Update restaurant (Super Admin only)
router.put('/restaurants/:id', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, address, logoUrl, phoneNumber, contactPerson, contractStart, contractEnd } = req.body;

    // Check if slug is being changed and if it's already taken
    if (slug) {
      const existing = await prisma.restaurant.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ success: false, error: 'Restaurant slug already taken' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (address !== undefined) updateData.address = address;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (contractStart !== undefined) updateData.contractStart = contractStart ? new Date(contractStart) : null;
    if (contractEnd !== undefined) updateData.contractEnd = contractEnd ? new Date(contractEnd) : null;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
      include: {
        users: true,
        _count: {
          select: {
            orders: true,
            products: true,
            tables: true
          }
        }
      }
    });

    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ success: false, error: 'Failed to update restaurant' });
  }
});

// Upload restaurant logo (Super Admin only)
router.post('/restaurants/:id/logo', authenticateToken, requireSuperAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Only allow images for logos
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'Only images are allowed for restaurant logos' });
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // Delete old logo if exists
    if (restaurant.logoUrl) {
      try {
        await deleteFile(restaurant.logoUrl);
      } catch (e) {
        console.error('Failed to delete old logo:', e);
      }
    }

    const uploadResult = await uploadFile(req.file);
    
    const updated = await prisma.restaurant.update({
      where: { id },
      data: { logoUrl: uploadResult.url },
      include: {
        users: true,
        _count: {
          select: {
            orders: true,
            products: true,
            tables: true
          }
        }
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload logo' });
  }
});

// Get single restaurant (Super Admin only)
router.get('/restaurants/:id', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        },
        categories: {
          take: 5,
          orderBy: { sortOrder: 'asc' }
        },
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        tables: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        _count: {
          select: {
            orders: true,
            products: true,
            tables: true,
            categories: true
          }
        }
      }
    });
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurant' });
  }
});

// Get all users (Super Admin only)
router.get('/users', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Create user (Super Admin only)
router.post('/users', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role, restaurantId } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // If not SUPER_ADMIN, require restaurantId
    if (role !== 'SUPER_ADMIN' && !restaurantId) {
      return res.status(400).json({ success: false, error: 'Restaurant ID required for non-super-admin users' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // For SUPER_ADMIN, restaurantId is still required by schema but not used for access control
    // We'll use the first restaurant as a placeholder, or require restaurantId to be provided
    let finalRestaurantId = restaurantId;
    
    if (role === 'SUPER_ADMIN' && !restaurantId) {
      // Get first restaurant as placeholder (or create system restaurant)
      const firstRestaurant = await prisma.restaurant.findFirst();
      if (!firstRestaurant) {
        return res.status(400).json({ success: false, error: 'No restaurants exist. Create a restaurant first.' });
      }
      finalRestaurantId = firstRestaurant.id;
    }

    if (!finalRestaurantId && role !== 'SUPER_ADMIN') {
      return res.status(400).json({ success: false, error: 'Restaurant ID required' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        restaurantId: finalRestaurantId!
      },
      include: {
        restaurant: role === 'SUPER_ADMIN' ? false : true
      }
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Update user (Super Admin only)
router.put('/users/:id', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role, restaurantId, password } = req.body;

    const updateData: any = {};
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (restaurantId) updateData.restaurantId = restaurantId;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: true
      }
    });

    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user (Super Admin only)
router.delete('/users/:id', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (req.user?.userId === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Get platform stats (Super Admin only)
router.get('/stats', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [restaurantCount, userCount, orderCount, productCount] = await Promise.all([
      prisma.restaurant.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count()
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: { name: true, slug: true }
        },
        table: {
          select: { name: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        restaurants: restaurantCount,
        users: userCount,
        orders: orderCount,
        products: productCount,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
