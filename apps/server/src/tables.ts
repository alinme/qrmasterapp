import express, { Router, Response } from 'express';
import prisma from './prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { getSocket } from './socket';

const router = Router();

// Get all tables for restaurant
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const tables = await prisma.table.findMany({
      where: { restaurantId: req.user.restaurantId },
      include: {
        category: true,
        sessions: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        server: {
          select: {
            id: true,
            email: true
          }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: tables });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tables' });
  }
});

// Get all table categories for restaurant
router.get('/categories', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const categories = await prisma.tableCategory.findMany({
      where: { restaurantId: req.user.restaurantId },
      include: {
        _count: {
          select: { tables: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get table categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch table categories' });
  }
});

// Create table category
router.post('/categories', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, description, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const category = await prisma.tableCategory.create({
      data: {
        name,
        description: description || null,
        sortOrder: sortOrder || 0,
        restaurantId: req.user.restaurantId
      }
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Create table category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create table category' });
  }
});

// Update table category
router.put('/categories/:categoryId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  const { name, description, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const category = await prisma.tableCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category || category.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const updated = await prisma.tableCategory.update({
      where: { id: categoryId },
      data: {
        name,
        description: description || null,
        sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update table category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update table category' });
  }
});

// Delete table category
router.delete('/categories/:categoryId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const category = await prisma.tableCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category || category.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Check if category has tables
    const tablesCount = await prisma.table.count({
      where: { categoryId }
    });

    if (tablesCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete category with tables. Please move or delete tables first.' 
      });
    }

    await prisma.tableCategory.delete({
      where: { id: categoryId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete table category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete table category' });
  }
});

// Create table
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, chairs, form, categoryId } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Table name is required' });
  }

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const table = await prisma.table.create({
      data: {
        name,
        chairs: chairs ? parseInt(chairs) : 4,
        form: form || null,
        categoryId: categoryId || null,
        restaurantId: req.user.restaurantId
      },
      include: {
        category: true
      }
    });

    res.status(201).json({ success: true, data: table });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ success: false, error: 'Failed to create table' });
  }
});

// Update table
router.put('/:tableId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tableId = Array.isArray(req.params.tableId) ? req.params.tableId[0] : req.params.tableId;
  const { name, chairs, form, categoryId } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Table name is required' });
  }

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const table = await prisma.table.findUnique({
      where: { id: tableId as string }
    });

    if (!table || table.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    const updateData: any = { name };
    if (chairs !== undefined) updateData.chairs = parseInt(chairs);
    if (form !== undefined) updateData.form = form || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;

    const updated = await prisma.table.update({
      where: { id: tableId as string },
      data: updateData,
      include: {
        category: true
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ success: false, error: 'Failed to update table' });
  }
});

// Delete table
router.delete('/:tableId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { tableId } = req.params;

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table || table.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    await prisma.table.delete({
      where: { id: tableId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete table' });
  }
});

// View existing QR code (without generating new token)
router.get('/:tableId/qr', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tableId = Array.isArray(req.params.tableId) ? req.params.tableId[0] : req.params.tableId;

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const table = await prisma.table.findUnique({
      where: { id: tableId as string },
      include: { 
        restaurant: true,
        sessions: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!table || table.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    // If no active session, return error
    if (!table.sessions || table.sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'No active QR code. Please generate one first.' });
    }

    const session = table.sessions[0];
    const baseUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5173';
    const qrUrl = `${baseUrl}/r/${table.restaurant.slug}/menu?t=${session.token}`;

    // Generate QR code image (base64)
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1
      });
    } catch (err) {
      console.error('QR code generation error:', err);
    }

    res.json({
      success: true,
      data: {
        token: session.token,
        sessionId: session.id,
        qrUrl,
        qrCodeImage: qrCodeDataUrl,
        expiresAt: session.expiresAt,
        table: {
          id: table.id,
          name: table.name
        }
      }
    });
  } catch (error) {
    console.error('View QR error:', error);
    res.status(500).json({ success: false, error: 'Failed to view QR code' });
  }
});

// Generate QR token for table
router.post('/:tableId/generate-token', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tableId = Array.isArray(req.params.tableId) ? req.params.tableId[0] : req.params.tableId;
  const { expiresInHours } = req.body; // Optional: default to 24 hours

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const table = await prisma.table.findUnique({
      where: { id: tableId as string },
      include: { restaurant: true }
    });

    if (!table || table.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    // Deactivate existing active sessions for this table
    await prisma.tableSession.updateMany({
      where: {
        tableId: tableId as string,
        active: true
      },
      data: {
        active: false
      }
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

    const session = await prisma.tableSession.create({
      data: {
        tableId: tableId as string,
        token,
        expiresAt,
        active: true
      }
    });

    // Generate QR code URL
    const baseUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5173';
    console.log('CUSTOMER_APP_URL from env:', process.env.CUSTOMER_APP_URL); 
    console.log('ADMIN_APP_URL from env:', process.env.ADMIN_APP_URL); 
    console.log('Using baseUrl:', baseUrl);
    const qrUrl = `${baseUrl}/r/${table.restaurant.slug}/menu?t=${token}`;
    console.log('Generated QR URL:', qrUrl);

    // Generate QR code image (base64)
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1
      });
    } catch (err) {
      console.error('QR code generation error:', err);
    }

    res.json({
      success: true,
      data: {
        token,
        sessionId: session.id,
        qrUrl,
        qrCodeImage: qrCodeDataUrl,
        expiresAt: session.expiresAt,
        table: {
          id: table.id,
          name: table.name
        }
      }
    });
  } catch (error) {
    console.error('Generate token error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate token' });
  }
});

// Revoke token
router.post('/:tableId/revoke-token', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tableId = Array.isArray(req.params.tableId) ? req.params.tableId[0] : req.params.tableId;

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const table = await prisma.table.findUnique({
      where: { id: tableId as string }
    });

    if (!table || table.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    await prisma.tableSession.updateMany({
      where: {
        tableId: tableId as string,
        active: true
      },
      data: {
        active: false
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Revoke token error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke token' });
  }
});

// Update table status
router.patch('/:tableId/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tableId = Array.isArray(req.params.tableId) ? req.params.tableId[0] : req.params.tableId;
  const { status } = req.body;

  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const validStatuses = ['AVAILABLE', 'BUSY', 'BILL_REQUESTED', 'READY'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId as string }
    });

    if (!table || table.restaurantId !== req.user.restaurantId) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    // When resetting to AVAILABLE, record the reset timestamp
    // This allows filtering out old orders from previous customers
    const updateData: any = { status };
    if (status === 'AVAILABLE') {
      updateData.lastResetAt = new Date();
    }

    const updatedTable = await prisma.table.update({
      where: { id: tableId as string },
      data: updateData
    });

    // Emit socket event for table status change
    const io = getSocket();
    io.to(`restaurant_${req.user.restaurantId}`).emit('table_status_changed', {
      tableId,
      status
    });

    // If resetting to AVAILABLE, notify current customers to clear their session
    // IMPORTANT: We DO NOT deactivate the QR token - the QR code remains valid and reusable
    // This allows the same QR code to be used by new customers after reset
    if (status === 'AVAILABLE') {
      io.to(`table_${tableId}`).emit('table_session_revoked', {
        tableId,
        message: 'Masă resetată. Te rugăm să scanezi din nou codul QR pentru a continua.'
      });
    }

    res.json({ success: true, data: updatedTable });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update table status' });
  }
});

// Assign table to current server (take ownership)
router.patch('/:tableId/assign', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { tableId } = req.params;
    
    // Check if user has server role or above (STAFF, SERVER, KITCHEN, ADMIN)
    if (!['STAFF', 'SERVER', 'KITCHEN', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only staff can take ownership of tables' });
    }
    
    // Verify table exists and belongs to same restaurant
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId: req.user.restaurantId
      }
    });
    
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }
    
    // Fetch user to get email
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Update table to assign to current user
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { serverId: req.user.userId },
      include: {
        server: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    // Emit socket event for table status change
    const io = getSocket();
    io.to(`restaurant_${req.user.restaurantId}`).emit('table_status_changed', {
      tableId,
      serverId: req.user.userId,
      serverEmail: user.email
    });
    
    res.json({ success: true, data: updatedTable });
  } catch (error) {
    console.error('Assign table error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign table' });
  }
});

// Release table (make it free)
router.patch('/:tableId/release', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const { tableId } = req.params;
    
    // Check if user has staff role or above
    if (!['STAFF', 'SERVER', 'KITCHEN', 'RESTAURANT_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only staff can release tables' });
    }
    
    // Verify table exists, belongs to same restaurant, and is owned by current user (or admin)
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId: req.user.restaurantId
      }
    });
    
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }
    
    // Only allow release if user owns the table or is admin
    if (table.serverId !== req.user.userId && !['RESTAURANT_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'You can only release tables you own' });
    }
    
    // Update table to remove server assignment
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { serverId: null }
    });
    
    // Emit socket event for table status change
    const io = getSocket();
    io.to(`restaurant_${req.user.restaurantId}`).emit('table_status_changed', {
      tableId,
      serverId: null
    });
    
    res.json({ success: true, data: updatedTable });
  } catch (error) {
    console.error('Release table error:', error);
    res.status(500).json({ success: false, error: 'Failed to release table' });
  }
});

export default router;
