import express, { Router, Response } from 'express';
import prisma from './prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';

const router = Router();

// Get my restaurant
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
         return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.user.restaurantId }
    });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurant' });
  }
});

// Update my restaurant
router.put('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, address } = req.body;
  try {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
   }
    const restaurant = await prisma.restaurant.update({
      where: { id: req.user.restaurantId },
      data: { name, address }
    });
    res.json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ success: false, error: 'Failed to update restaurant' });
  }
});

export default router;
