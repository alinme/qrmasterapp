import express, { Router, Response } from 'express';
import prisma from './prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { getSocket } from './socket';

const router = Router();

// Get all orders for restaurant (Admin) - for SERVER role, ?mine=true returns only orders from tables they're assigned to
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { status, limit = 50, mine } = req.query;

    const where: any = {
      restaurantId: req.user.restaurantId,
      ...(status && { status: status as string })
    };

    // For SERVER role with mine=true, filter orders from tables assigned to this waiter
    if (req.user.role === 'SERVER' && mine === 'true') {
      where.table = {
        serverId: req.user.userId
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: {
          include: {
            server: {
              select: { id: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Get single order (Admin)
router.get('/:orderId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Verify order belongs to restaurant
    if (order.restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Server review and send to kitchen (Admin - Server role)
// When server sends to kitchen, order goes to PENDING status (waiting for chef to claim)
router.post('/:orderId/review', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { orderId } = req.params;
    const { serverNotes, sendToKitchen } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (order.status !== 'SERVER_REVIEW') {
      return res.status(400).json({ success: false, error: 'Order is not in server review status' });
    }

    const updateData: any = {
      serverNotes: serverNotes || null
    };

    // If sending to kitchen, change status to PENDING (not PREPARING)
    // Chef will need to claim it first, then it becomes PREPARING
    if (sendToKitchen) {
      updateData.status = 'PENDING';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    // Emit Socket.IO event for real-time updates
    const io = getSocket();
    io.to(`restaurant_${updatedOrder.restaurantId}`).emit('order_updated', updatedOrder);
    io.to(`table_${updatedOrder.tableId}`).emit('order_status_updated', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      order: updatedOrder
    });
    
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Server review error:', error);
    res.status(500).json({ success: false, error: 'Failed to review order' });
  }
});

// Claim order by chef (changes status from PENDING to PREPARING)
router.post('/:orderId/claim', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Only allow claiming orders in PENDING status
    if (order.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Order is not in pending status' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'PREPARING',
        claimedAt: new Date() // Track when chef claimed the order
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    // Emit Socket.IO event for real-time updates
    const io = getSocket();
    io.to(`restaurant_${updatedOrder.restaurantId}`).emit('order_updated', updatedOrder);
    io.to(`table_${updatedOrder.tableId}`).emit('order_status_updated', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      order: updatedOrder
    });
    
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Claim order error:', error);
    res.status(500).json({ success: false, error: 'Failed to claim order' });
  }
});

// Update order status (Admin)
router.put('/:orderId/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['RECEIVED', 'SERVER_REVIEW', 'PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true
      }
    });

    // Emit Socket.IO event for real-time updates
    const io = getSocket();
    io.to(`restaurant_${updatedOrder.restaurantId}`).emit('order_updated', updatedOrder);
    io.to(`table_${updatedOrder.tableId}`).emit('order_status_updated', {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      order: updatedOrder
    });
    
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

export default router;
