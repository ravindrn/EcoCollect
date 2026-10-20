import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

adminRouter.get(
  '/stats',
  requireAuth,
  requireRole('ADMIN'),
  async (_req, res, next) => {
    try {
      const [totalUsers, citizens, drivers, admins, openComplaints, totalComplaints] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: 'CITIZEN' } }),
          prisma.user.count({ where: { role: 'DRIVER' } }),
          prisma.user.count({ where: { role: 'ADMIN' } }),
          prisma.complaint.count({ where: { status: 'OPEN' } }),
          prisma.complaint.count(),
        ]);

      res.json({
        success: true,
        data: {
          users: { total: totalUsers, citizens, drivers, admins },
          complaints: { total: totalComplaints, open: openComplaints },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);