import express, { Router, Request, Response } from 'express';
import prisma from './prisma';
import { getSocket } from './socket';

type PaymentLike = { amount?: number; tipAmount?: number; total?: number };

const router = Router();

// Helper function to check if category/product is available based on schedule
function isAvailableBySchedule(
  scheduleEnabled: boolean,
  scheduleStart: string | null,
  scheduleEnd: string | null,
  scheduleDays: string | null
): boolean {
  if (!scheduleEnabled) return true;
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
  
  // Check days
  if (scheduleDays) {
    const days = JSON.parse(scheduleDays) as number[];
    // Convert JS day (0=Sun) to our format (1=Mon, 7=Sun)
    const adjustedDay = currentDay === 0 ? 7 : currentDay;
    if (!days.includes(adjustedDay)) return false;
  }
  
  // Check time
  if (scheduleStart && scheduleEnd) {
    const [startHour, startMin] = scheduleStart.split(':').map(Number);
    const [endHour, endMin] = scheduleEnd.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (currentTime < startMinutes || currentTime > endMinutes) return false;
  }
  
  return true;
}

// Get restaurant by slug (Public)
// Filters categories and products based on schedule
router.get('/restaurant/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              where: { isAvailable: true },
              orderBy: { isFeatured: 'desc' },
              include: {
                images: true,
                baseRelations: {
                  include: {
                    relatedProduct: {
                      include: {
                        images: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // Filter categories and products by schedule
    const filteredCategories = restaurant.categories
      .filter(cat => isAvailableBySchedule(
        cat.scheduleEnabled,
        cat.scheduleStart,
        cat.scheduleEnd,
        cat.scheduleDays
      ))
      .map(cat => ({
        ...cat,
        products: cat.products.filter(prod => isAvailableBySchedule(
          prod.scheduleEnabled,
          prod.scheduleStart,
          prod.scheduleEnd,
          prod.scheduleDays
        ))
      }))
      .filter(cat => cat.products.length > 0); // Remove empty categories

    res.json({ 
      success: true, 
      data: {
        ...restaurant,
        categories: filteredCategories
      }
    });
  } catch (error) {
    console.error('Get public restaurant error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurant' });
  }
});

// Validate Table Token
router.post('/validate-token', async (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
  }

  // TODO: Implement actual signed token validation or DB lookup
  // For MVP, we might treat the token as the tableId or a simple string stored in TableSession
  
  try {
      // Check if it's a valid active session token
      const session = await prisma.tableSession.findUnique({
          where: { token },
          include: { 
            table: {
              include: { restaurant: true }
            } 
          }
      });

      if (!session || !session.active) {
           return res.status(400).json({ success: false, error: 'Invalid or expired token' });
      }

      // Get table to check its status
      const table = await prisma.table.findUnique({
        where: { id: session.tableId }
      })

      if (!table) {
        return res.status(400).json({ success: false, error: 'Table not found' });
      }

      // If table status is AVAILABLE, it means it was reset - allow customer to use it and set to BUSY
      // If table is already BUSY/BILL_REQUESTED/READY, the customer can continue browsing
      if (table.status === 'AVAILABLE') {
        // Table was reset, update to BUSY for this customer
        await prisma.table.update({
          where: { id: session.tableId },
          data: { status: 'BUSY' }
        });
      } else {
        // Table is already BUSY/BILL_REQUESTED/READY - customer is already using it, just update to BUSY if needed
        // (This handles the case where customer re-validates their token)
        if (table.status !== 'BUSY') {
          await prisma.table.update({
            where: { id: session.tableId },
            data: { status: 'BUSY' }
          });
        }
      }
      
      // Emit socket event for table status change
      const io = getSocket();
      io.to(`restaurant_${session.table.restaurantId}`).emit('table_status_changed', {
        tableId: session.tableId,
        status: 'BUSY'
      });

      res.json({ success: true, data: { 
          tableId: session.tableId, 
          tableName: session.table.name, 
          restaurantId: session.table.restaurantId,
          restaurantSlug: session.table.restaurant.slug,
          tableStatus: table.status // Include table status so client can check if it was reset
      }});

  } catch (error) {
      console.error('Validate token error:', error);
      res.status(500).json({ success: false, error: 'Validation failed' });
  }
});

// Create Order (Public - from customer)
router.post('/orders', async (req: Request, res: Response) => {
  const { tableToken, items, notes, deviceId, customerName, customerAvatar } = req.body;

  if (!tableToken || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Table token and items are required' });
  }

  try {
    // Validate table session
    const session = await prisma.tableSession.findUnique({
      where: { token: tableToken },
      include: {
        table: {
          include: { restaurant: true }
        }
      }
    });

    if (!session || !session.active) {
      return res.status(400).json({ success: false, error: 'Invalid or expired table token' });
    }

    // Calculate total
    const total = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Generate deviceId if not provided (fallback)
    const finalDeviceId = deviceId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create order with items - goes to SERVER_REVIEW first
    const order = await prisma.order.create({
      data: {
        restaurantId: session.table.restaurantId,
        tableId: session.tableId,
        status: 'SERVER_REVIEW',
        total,
        notes: notes || null,
        deviceId: finalDeviceId,
        customerName: customerName || null,
        customerAvatar: customerAvatar || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceSnapshot: item.price,
            notes: item.notes || null
          }))
        }
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
    
    // Fetch table with server info to determine notification target
    const tableWithServer = await prisma.table.findUnique({
      where: { id: session.tableId },
      include: {
        server: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    // If table has a server assigned, notify that server specifically
    // Otherwise, notify all servers in the restaurant (free table)
    if (tableWithServer?.serverId) {
      // Table is assigned - notify the assigned server
      // We'll emit to restaurant room but include serverId in the event
      // Frontend will filter based on current user's ID
      io.to(`restaurant_${session.table.restaurantId}`).emit('new_order', {
        ...order,
        tableServerId: tableWithServer.serverId
      });
    } else {
      // Free table - notify all servers
      io.to(`restaurant_${session.table.restaurantId}`).emit('new_order', {
        ...order,
        tableServerId: null // null means free table - all servers should see it
      });
    }
    
    io.to(`table_${session.tableId}`).emit('order_created', order);
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Get all orders for a device/table (Public)
router.get('/orders', async (req: Request, res: Response) => {
  const { tableToken, deviceId } = req.query;

  if (!tableToken && !deviceId) {
    return res.status(400).json({ success: false, error: 'Table token or device ID is required' });
  }

  try {
    let whereClause: any = {};

    let session: any = null;
    if (tableToken) {
      // Validate table session
      session = await prisma.tableSession.findUnique({
        where: { token: tableToken as string },
        include: {
          table: true
        }
      });

      if (!session || !session.active) {
        return res.status(400).json({ success: false, error: 'Invalid or expired table token' });
      }

      whereClause.tableId = session.tableId;
    }

    if (deviceId) {
      whereClause.deviceId = deviceId as string;
    }

    // If we have a session, filter by lastResetAt to only show orders from current session
    // This allows showing paid orders from current session, but hides orders from previous sessions
    if (session?.table?.lastResetAt) {
      whereClause.createdAt = { gte: session.table.lastResetAt };
    }

    const orders = await prisma.order.findMany({
      where: {
        ...whereClause,
        status: { not: 'CANCELLED' }
        // Show all orders (including paid) for current session
        // lastResetAt filter ensures we don't show orders from previous sessions
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Get Order Status (Public)
router.get('/orders/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        table: {
          include: {
            server: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Get table bill for customer (public endpoint with table token)
router.get('/tables/:tableId/bill', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params as any;
    const { tableToken } = req.query as any;

    if (!tableToken) {
      return res.status(400).json({ success: false, error: 'Table token required' });
    }

    // Validate table session
    const session = await prisma.tableSession.findFirst({
      where: {
        token: tableToken,
        tableId,
        active: true
      },
      include: {
        table: true
      }
    });

    if (!session) {
      return res.status(400).json({ success: false, error: 'Invalid or expired table token' });
    }

    // Build where clause - only show orders created after the last reset
    const whereClause: any = {
      tableId,
      status: { not: 'CANCELLED' }
    };

    // If table was reset, only show orders from after the reset
    if (session.table.lastResetAt) {
      whereClause.createdAt = { gte: session.table.lastResetAt };
    }

    // Fetch all non-cancelled orders for the table (after last reset)
    // Frontend will filter out fully paid orders to prevent showing past orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    type OrderRow = (typeof orders)[number];
    // Group orders by deviceId
    const ordersByDevice = orders.reduce((acc: Record<string, OrderRow[]>, order: OrderRow) => {
      const deviceId = order.deviceId || 'unknown';
      if (!acc[deviceId]) {
        acc[deviceId] = [];
      }
      acc[deviceId].push(order);
      return acc;
    }, {} as Record<string, OrderRow[]>);

    // Calculate total bill (order totals)
    const totalBill = orders.reduce((sum: number, order: OrderRow) => sum + order.total, 0);

    // Calculate paid amount (base payments, excluding tips) and total tips
    let totalPaid = 0;
    let totalTips = 0;

    orders.forEach((order: OrderRow) => {
      order.payments.forEach((payment: PaymentLike) => {
        totalPaid += payment.amount || 0;
        totalTips += payment.tipAmount || 0;
      });
    });

    res.json({
      success: true,
      data: {
        table: session.table,
        orders,
        ordersByDevice,
        totalBill,
        totalPaid,
        totalTips,
        remainingAmount: totalBill - totalPaid
      }
    });
  } catch (error) {
    console.error('Get public table bill error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch table bill' });
  }
});

// Create payment (public - from customer)
router.post('/payments', async (req: Request, res: Response) => {
  try {
    const { orderIds, amount, tipType, tipValue, deviceId, tableToken } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Order IDs are required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    if (!tableToken) {
      return res.status(400).json({ success: false, error: 'Table token is required' });
    }

    // Validate table session
    const session = await prisma.tableSession.findFirst({
      where: {
        token: tableToken,
        active: true
      }
    });

    if (!session) {
      return res.status(400).json({ success: false, error: 'Invalid or expired table token' });
    }

    // Calculate tip
    let tipAmount = 0;
    if (tipType && tipValue !== undefined) {
      if (tipType === 'PERCENTAGE') {
        tipAmount = (amount * tipValue) / 100;
      } else if (tipType === 'AMOUNT') {
        tipAmount = tipValue;
      }
    }

    const total = amount + tipAmount;

    // Verify orders exist and belong to same table
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        tableId: session.tableId,
        status: { not: 'CANCELLED' }
      },
      include: {
        payments: true
      }
    });

    if (orders.length !== orderIds.length) {
      return res.status(400).json({ success: false, error: 'Some orders not found or do not belong to this table' });
    }

    type OrderWithPmts = (typeof orders)[number];
    // Calculate remaining amount for selected orders
    const remainingAmount = orders.reduce((sum: number, order: OrderWithPmts) => {
      const paid = order.payments.reduce((pSum: number, payment: PaymentLike) => pSum + (payment.total ?? 0), 0);
      return sum + (order.total - paid);
    }, 0);

    if (amount > remainingAmount) {
      return res.status(400).json({ success: false, error: 'Payment amount exceeds remaining balance' });
    }

    // Create payments for each order proportionally
    const payments = [];
    let remainingPayment = total;

    for (const order of orders) {
      const orderPaid = order.payments.reduce((sum: number, p: PaymentLike) => sum + (p.total ?? 0), 0);
      const orderRemaining = order.total - orderPaid;

      if (orderRemaining > 0 && remainingPayment > 0) {
        const paymentAmount = Math.min(orderRemaining, remainingPayment);
        const paymentTip = remainingPayment === total ? tipAmount : 0; // Only apply tip to last payment
        const paymentTotal = paymentAmount + (remainingPayment === total ? tipAmount : 0);

        const payment = await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: paymentAmount,
            tipAmount: paymentTip,
            tipType: remainingPayment === total ? tipType : null,
            tipValue: remainingPayment === total ? tipValue : null,
            paymentType: remainingPayment === total ? (req.body.paymentType || null) : null,
            total: paymentTotal,
            deviceId: deviceId || null
          }
        });

        payments.push(payment);
        remainingPayment -= paymentAmount;

        // Update order payment status
        const newPaid = order.payments.reduce((sum: number, p: PaymentLike) => sum + (p.total ?? 0), 0) + paymentTotal;
        let paymentStatus = 'UNPAID';
        if (newPaid >= order.total) {
          paymentStatus = 'PAID';
        } else if (newPaid > 0) {
          paymentStatus = 'PARTIALLY_PAID';
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus }
        });
      }
    }

    res.status(201).json({ success: true, data: payments });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

// Request bill (notify waiter instead of processing payment)
router.post('/tables/:tableId/request-bill', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params as any;
    const { tableToken, orderIds, amount, tipType, tipValue, paymentType, deviceId } = req.body;

    if (!tableToken) {
      return res.status(400).json({ success: false, error: 'Table token required' });
    }

    if (!paymentType || !['CASH', 'POS'].includes(paymentType)) {
      return res.status(400).json({ success: false, error: 'Payment type must be CASH or POS' });
    }

    // Validate table session
    const session = await prisma.tableSession.findFirst({
      where: {
        token: tableToken,
        tableId,
        active: true
      },
      include: {
        table: {
          include: { restaurant: true }
        }
      }
    });

    if (!session) {
      return res.status(400).json({ success: false, error: 'Invalid or expired table token' });
    }

    // Calculate tip
    let tipAmount = 0;
    if (tipType && tipValue !== undefined) {
      if (tipType === 'PERCENTAGE') {
        tipAmount = (amount * tipValue) / 100;
      } else if (tipType === 'AMOUNT') {
        tipAmount = tipValue;
      }
    }

    const totalWithTip = amount + tipAmount;

    // Store bill request in database
    const billRequest = await prisma.billRequest.create({
      data: {
        tableId,
        orderIds: JSON.stringify(orderIds || []),
        amount,
        tipAmount,
        tipType: tipType || null,
        tipValue: tipValue || null,
        paymentType,
        totalWithTip,
        deviceId: deviceId || null
      }
    });

    // Update table status to BILL_REQUESTED
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'BILL_REQUESTED' }
    });

    // Emit socket event to notify waiter
    const io = getSocket();
    io.to(`restaurant_${session.table.restaurantId}`).emit('bill_requested', {
      tableId,
      tableName: session.table.name,
      billRequestId: billRequest.id,
      orderIds: orderIds || [],
      amount,
      tipAmount,
      totalWithTip,
      paymentType, // 'CASH' or 'POS'
      message: paymentType === 'CASH' 
        ? `Masă ${session.table.name}: Notă de plată - ${totalWithTip.toFixed(2)} RON (Numerar)`
        : `Masă ${session.table.name}: Notă de plată - ${totalWithTip.toFixed(2)} RON (POS)`
    });

    // Also emit table status change
    io.to(`restaurant_${session.table.restaurantId}`).emit('table_status_changed', {
      tableId,
      status: 'BILL_REQUESTED'
    });

    res.status(200).json({ 
      success: true, 
      message: paymentType === 'CASH' 
        ? 'Serverul a fost notificat să aducă nota de plată (Numerar)'
        : 'Serverul a fost notificat să aducă POS-ul'
    });
  } catch (error) {
    console.error('Request bill error:', error);
    res.status(500).json({ success: false, error: 'Failed to request bill' });
  }
});

// Get server info for a table (public endpoint for clients)
router.get('/tables/:tableId/server', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params as { tableId: string };
    
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        server: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }
    
    res.json({ 
      success: true, 
      data: table.server ? {
        id: table.server.id,
        email: table.server.email
      } : null
    });
  } catch (error) {
    console.error('Get table server error:', error);
    res.status(500).json({ success: false, error: 'Failed to get table server' });
  }
});

// Call waiter (notify server)
router.post('/tables/:tableId/call-waiter', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params as { tableId: string };
    const { tableToken, message, deviceId } = req.body;

    if (!tableToken) {
      return res.status(400).json({ success: false, error: 'Table token required' });
    }

    // Validate table session
    const session = await prisma.tableSession.findFirst({
      where: {
        token: tableToken,
        tableId,
        active: true
      },
      include: {
        table: {
          include: { restaurant: true }
        }
      }
    });

    if (!session) {
      return res.status(400).json({ success: false, error: 'Invalid or expired table token' });
    }

    // Emit socket event to notify waiter
    const io = getSocket();
    io.to(`restaurant_${session.table.restaurantId}`).emit('waiter_called', {
      tableId,
      tableName: session.table.name,
      message: message || 'Clientul a chemat chelnerul',
      deviceId: deviceId || null,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ 
      success: true, 
      message: 'Chelnerul a fost notificat'
    });
  } catch (error) {
    console.error('Call waiter error:', error);
    res.status(500).json({ success: false, error: 'Failed to call waiter' });
  }
});

export default router;
