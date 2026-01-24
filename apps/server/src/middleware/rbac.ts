import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireRestaurantAdmin = requireRole('RESTAURANT_ADMIN', 'SUPER_ADMIN');
export const requireStaffOrAbove = requireRole('RESTAURANT_ADMIN', 'STAFF', 'KITCHEN', 'SUPER_ADMIN');
