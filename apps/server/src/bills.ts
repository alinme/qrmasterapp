import express, { Router, Response } from 'express';
import prisma from './prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { requireStaffOrAbove } from './middleware/rbac';
import { getSocket } from './socket';

type PaymentLike = { amount?: number; tipAmount?: number };

const router = Router();

// Get all unprocessed bill requests for restaurant
router.get('/requests', authenticateToken, requireStaffOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const billRequests = await prisma.billRequest.findMany({
      where: {
        table: {
          restaurantId: req.user.restaurantId
        },
        processed: false
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: billRequests });
  } catch (error) {
    console.error('Get bill requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bill requests' });
  }
});

// Get all tables with their bills (for server/staff view)
router.get('/tables', authenticateToken, requireStaffOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const tables = await prisma.table.findMany({
      where: { restaurantId: req.user.restaurantId },
      include: {
        category: true,
        server: {
          select: {
            id: true,
            email: true
          }
        },
        orders: {
          where: {
            status: { not: 'CANCELLED' }
            // Orders will be filtered by lastResetAt in the calculation below
          },
          include: {
            items: {
              include: {
                product: true
              }
            },
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            orders: {
              where: {
                status: { not: 'CANCELLED' }
                // Count all orders, not just unpaid
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate totals for each table
    type TableRow = (typeof tables)[number];
    const tablesWithBills = tables.map((table: TableRow) => {
      // Filter orders to only include those created after last reset
      let allOrders = table.orders || [];
      if (table.lastResetAt) {
        allOrders = allOrders.filter((order: { createdAt: Date }) =>
          new Date(order.createdAt) >= new Date(table.lastResetAt!)
        );
      }

      const totalBill = allOrders.reduce((sum: number, order: { total: number }) => sum + order.total, 0);

      // Calculate paid amount (excluding tips) and total tips separately
      let paidAmount = 0;
      let totalTips = 0;

      allOrders.forEach((order: { payments?: PaymentLike[] }) => {
        (order.payments || []).forEach((payment: PaymentLike) => {
          // payment.total includes tip, payment.amount is the base amount
          paidAmount += payment.amount || 0;
          totalTips += payment.tipAmount || 0;
        });
      });

      // Remaining amount is order total minus base payments (tips are extra)
      const remainingAmount = totalBill - paidAmount;

      return {
        ...table,
        totalBill,
        paidAmount,
        totalTips,
        remainingAmount,
        orderCount: allOrders.length
      };
    });

    res.json({ success: true, data: tablesWithBills });
  } catch (error) {
    console.error('Get tables with bills error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tables' });
  }
});

// Get table bill details (all orders for a table)
router.get('/tables/:tableId/bill', authenticateToken, requireStaffOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const tableId = Array.isArray(req.params.tableId) ? req.params.tableId[0] : req.params.tableId;

    // Get table to check lastResetAt timestamp
    const table = await prisma.table.findFirst({
      where: {
        id: tableId as string,
        restaurantId: req.user.restaurantId
      }
    });

    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    // Build where clause - only show orders created after the last reset
    const whereClause: any = {
      tableId: tableId as string,
      status: { not: 'CANCELLED' }
    };

    // If table was reset, only show orders from after the reset
    if (table.lastResetAt) {
      whereClause.createdAt = { gte: table.lastResetAt };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get pending bill requests for this table
    const billRequests = await prisma.billRequest.findMany({
      where: {
        tableId: tableId as string,
        processed: false
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
      (order.payments || []).forEach((payment: PaymentLike) => {
        totalPaid += payment.amount || 0;
        totalTips += payment.tipAmount || 0;
      });
    });

    res.json({
      success: true,
      data: {
        table,
        orders,
        ordersByDevice,
        billRequests,
        totalBill,
        totalPaid,
        totalTips,
        remainingAmount: totalBill - totalPaid
      }
    });
  } catch (error) {
    console.error('Get table bill error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch table bill' });
  }
});

// Create payment (from server/staff)
router.post('/payments', authenticateToken, requireStaffOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const { orderIds, amount, tipType, tipValue, deviceId, paymentType, billRequestId } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Order IDs are required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
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
        status: { not: 'CANCELLED' }
      },
      include: {
        payments: true
      }
    });

    if (orders.length !== orderIds.length) {
      return res.status(400).json({ success: false, error: 'Some orders not found' });
    }

    type OrderWithPmts = (typeof orders)[number];
    // Check if all orders are from same table
    const tableIds = [...new Set(orders.map((o: OrderWithPmts) => o.tableId))];
    if (tableIds.length > 1) {
      return res.status(400).json({ success: false, error: 'All orders must be from the same table' });
    }

    // Calculate remaining amount for selected orders (base amount only, excluding tips)
    const remainingAmount = orders.reduce((sum: number, order: OrderWithPmts) => {
      const paid = order.payments.reduce((pSum: number, payment: PaymentLike) => pSum + (payment.amount || 0), 0);
      return sum + (order.total - paid);
    }, 0);

    if (amount > remainingAmount) {
      return res.status(400).json({ success: false, error: 'Payment amount exceeds remaining balance' });
    }

    // Create payments for each order proportionally
    const payments = [];
    let remainingPayment = total;

    for (const order of orders) {
      const orderPaid = order.payments.reduce((sum: number, p: PaymentLike) => sum + (p.amount || 0), 0);
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
            paymentType: remainingPayment === total ? (paymentType || null) : null,
            total: paymentTotal,
            deviceId: deviceId || null,
            processedBy: req.user?.userId || null
          }
        });

        payments.push(payment);
        remainingPayment -= paymentAmount;

        // Update order payment status (base amount only, tips don't count toward order payment)
        const newPaid = order.payments.reduce((sum: number, p: PaymentLike) => sum + (p.amount || 0), 0) + paymentAmount;
        let paymentStatus = 'UNPAID';
        let orderStatus = order.status;
        if (newPaid >= order.total) {
          paymentStatus = 'PAID';
          // BUGFIX #10: When fully paid, automatically mark order as SERVED
          if (order.status !== 'SERVED' && order.status !== 'CANCELLED') {
            orderStatus = 'SERVED';
          }
        } else if (newPaid > 0) {
          paymentStatus = 'PARTIALLY_PAID';
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { 
            paymentStatus,
            ...(orderStatus !== order.status && { status: orderStatus })
          }
        });
      }
    }

    // Mark bill request as processed if provided
    if (billRequestId) {
      await prisma.billRequest.update({
        where: { id: billRequestId },
        data: { processed: true }
      });
    }

    // Emit socket event to notify clients that payment was processed
    const io = getSocket();
    const tableId = orders[0]?.tableId;
    if (tableId) {
      io.to(`table_${tableId}`).emit('payment_processed', {
        tableId,
        orderIds: orderIds,
        payments: payments
      });
    }

    res.status(201).json({ success: true, data: payments });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

// Get server/waiter earnings stats (today, yesterday, comparison)
router.get('/server-stats', authenticateToken, requireStaffOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const serverId = req.user.userId;

    // Helper to get start/end of a date in local timezone
    function getDateBounds(offsetDays: number) {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    const today = getDateBounds(0);
    const yesterday = getDateBounds(1);

    const [todayPayments, yesterdayPayments] = await Promise.all([
      prisma.payment.findMany({
        where: {
          processedBy: serverId,
          createdAt: { gte: today.start, lte: today.end }
        }
      }),
      prisma.payment.findMany({
        where: {
          processedBy: serverId,
          createdAt: { gte: yesterday.start, lte: yesterday.end }
        }
      })
    ]);

    const todayGross = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const todayTips = todayPayments.reduce((sum, p) => sum + (p.tipAmount || 0), 0);
    const yesterdayGross = yesterdayPayments.reduce((sum, p) => sum + p.amount, 0);
    const yesterdayTips = yesterdayPayments.reduce((sum, p) => sum + (p.tipAmount || 0), 0);

    const grossDelta = todayGross - yesterdayGross;
    const tipsDelta = todayTips - yesterdayTips;

    res.json({
      success: true,
      data: {
        today: {
          gross: todayGross,
          tips: todayTips,
          total: todayGross + todayTips,
          orderCount: todayPayments.length
        },
        yesterday: {
          gross: yesterdayGross,
          tips: yesterdayTips,
          total: yesterdayGross + yesterdayTips,
          orderCount: yesterdayPayments.length
        },
        comparison: {
          grossDelta,
          tipsDelta,
          totalDelta: (todayGross + todayTips) - (yesterdayGross + yesterdayTips),
          grossPercentChange: yesterdayGross > 0 ? ((grossDelta / yesterdayGross) * 100) : (todayGross > 0 ? 100 : 0),
          tipsPercentChange: yesterdayTips > 0 ? ((tipsDelta / yesterdayTips) * 100) : (todayTips > 0 ? 100 : 0)
        }
      }
    });
  } catch (error) {
    console.error('Get server stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch server stats' });
  }
});

export default router;
