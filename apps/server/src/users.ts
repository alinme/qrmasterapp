import express, { Router, Response } from 'express';
import prisma from './prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { requireRestaurantAdmin } from './middleware/rbac';
import bcrypt from 'bcryptjs';

const router = Router();

// Get all staff users for my restaurant
router.get('/staff', authenticateToken, requireRestaurantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const users = await prisma.user.findMany({
      where: {
        restaurantId: req.user.restaurantId,
        role: {
          in: ['STAFF', 'KITCHEN'] // Only STAFF and KITCHEN, exclude RESTAURANT_ADMIN
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch staff' });
  }
});

// Create staff user
router.post('/staff', authenticateToken, requireRestaurantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Only allow creating STAFF or KITCHEN roles
    if (!['STAFF', 'KITCHEN'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role. Only STAFF and KITCHEN allowed' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        restaurantId: req.user.restaurantId
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, error: 'Failed to create staff user' });
  }
});

// Update staff user
router.put('/staff/:id', authenticateToken, requireRestaurantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { email, role, password } = req.body;

    // Verify user belongs to same restaurant
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { restaurantId: true, role: true }
    });

    if (!existingUser || existingUser.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Prevent changing role to RESTAURANT_ADMIN or SUPER_ADMIN
    if (role && !['STAFF', 'KITCHEN'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ success: false, error: 'Failed to update staff user' });
  }
});

// Delete staff user
router.delete('/staff/:id', authenticateToken, requireRestaurantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user.userId === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    // Verify user belongs to same restaurant
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { restaurantId: true }
    });

    if (!existingUser || existingUser.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Staff user deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete staff user' });
  }
});

export default router;
