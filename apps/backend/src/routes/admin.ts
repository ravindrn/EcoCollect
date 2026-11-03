import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

adminRouter.get(
  '/stats',
  requireAuth,
  requireRole('ADMIN'),
  async (_req, res, next) => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        citizens,
        drivers,
        admins,
        activeUsers,
        totalComplaints,
        complaintsByStatus,
        complaintsByCategory,
        totalAnnouncements,
        publishedAnnouncements,
        totalVehicles,
        recentComplaints,
        last30Days,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'CITIZEN' } }),
        prisma.user.count({ where: { role: 'DRIVER' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.complaint.count(),
        prisma.complaint.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        prisma.complaint.groupBy({
          by: ['category'],
          _count: { _all: true },
        }),
        prisma.announcement.count(),
        prisma.announcement.count({ where: { status: 'PUBLISHED' } }),
        prisma.vehicle.count({ where: { isActive: true } }),
        prisma.complaint.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                citizenProfile: { select: { fullName: true } },
              },
            },
          },
        }),
        prisma.complaint.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { createdAt: true },
        }),
      ]);

      // Build status counts map
      const statusMap: Record<string, number> = {};
      for (const row of complaintsByStatus) {
        statusMap[row.status] = row._count._all;
      }

      // Build category counts map
      const categoryMap: Record<string, number> = {};
      for (const row of complaintsByCategory) {
        categoryMap[row.category] = row._count._all;
      }

      // Aggregate complaints per day for last 30 days
      const perDayBuckets: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(thirtyDaysAgo);
        d.setDate(thirtyDaysAgo.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        perDayBuckets[key] = 0;
      }
      for (const c of last30Days) {
        const key = c.createdAt.toISOString().slice(0, 10);
        if (key in perDayBuckets) perDayBuckets[key]! += 1;
      }

      const complaintsPerDay = Object.entries(perDayBuckets).map(
        ([date, count]) => ({ date, count }),
      );

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            citizens,
            drivers,
            admins,
            active: activeUsers,
          },
          complaints: {
            total: totalComplaints,
            pending: statusMap.PENDING ?? 0,
            open: statusMap.OPEN ?? 0,
            inProgress: statusMap.IN_PROGRESS ?? 0,
            resolved: statusMap.RESOLVED ?? 0,
            rejected: statusMap.REJECTED ?? 0,
          },
          announcements: {
            total: totalAnnouncements,
            published: publishedAnnouncements,
          },
          vehicles: {
            active: totalVehicles,
          },
          complaintsByStatus: Object.entries(statusMap).map(([status, count]) => ({
            status,
            count,
          })),
          complaintsByCategory: Object.entries(categoryMap).map(
            ([category, count]) => ({ category, count }),
          ),
          complaintsPerDay,
          recentComplaints: recentComplaints.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            category: c.category,
            createdAt: c.createdAt,
            isAnonymous: c.isAnonymous,
            reporterName: c.user?.citizenProfile?.fullName ?? null,
            reporterEmail: c.user?.email ?? null,
          })),
          generatedAt: now.toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
// ---------------------------------------------------------------------------
// Users management
// ---------------------------------------------------------------------------

const usersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(120).optional(),
  role: z.enum(['CITIZEN', 'DRIVER', 'ADMIN']).optional(),
});

adminRouter.get(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const parsed = usersQuerySchema.safeParse(req.query);
      if (!parsed.success) throw parsed.error;

      const { page, pageSize, q, role } = parsed.data;

      const where: {
        role?: 'CITIZEN' | 'DRIVER' | 'ADMIN';
        OR?: Array<{
          email?: { contains: string; mode: 'insensitive' };
          citizenProfile?: {
            is: { fullName?: { contains: string; mode: 'insensitive' } };
          };
        }>;
      } = {};

      if (role) where.role = role;
      if (q && q.trim()) {
        const term = q.trim();
        where.OR = [
          { email: { contains: term, mode: 'insensitive' } },
          {
            citizenProfile: {
              is: { fullName: { contains: term, mode: 'insensitive' } },
            },
          },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { citizenProfile: true },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          items: items.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            createdAt: u.createdAt,
            fullName: u.citizenProfile?.fullName ?? null,
            phone: u.citizenProfile?.phone ?? null,
            wardDivision: u.citizenProfile?.wardDivision ?? null,
          })),
          meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  '/users/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });
      const paramsParsed = paramsSchema.safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodySchema = z.object({ isActive: z.boolean() });
      const bodyParsed = bodySchema.safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const user = await prisma.user.findUnique({
        where: { id: paramsParsed.data.id },
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
      }

      if (req.user?.id === user.id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DEACTIVATE_SELF',
            message: 'You cannot deactivate your own account',
          },
        });
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { isActive: bodyParsed.data.isActive },
      });

      res.json({
        success: true,
        data: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          isActive: updated.isActive,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Create user
// ---------------------------------------------------------------------------

const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  role: z.enum(['CITIZEN', 'DRIVER', 'ADMIN']),
  fullName: z.string().min(1).max(120),
  phone: z
    .string()
    .regex(/^(\+94|0)[0-9]{9}$/, 'Enter a valid Sri Lankan phone number')
    .optional(),
  wardDivision: z.string().max(120).optional(),
  areaId: z.string().uuid().optional(),
});

adminRouter.post(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) throw parsed.error;

      const { email, password, role, fullName, phone, wardDivision, areaId } =
        parsed.data;

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_TAKEN',
            message: 'A user with this email already exists',
          },
        });
      }

      const { hashPassword } = await import('../lib/password.js');
      const passwordHash = await hashPassword(password);

      // Only citizens get a profile in our data model
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role,
          ...(role === 'CITIZEN'
            ? {
                citizenProfile: {
                  create: {
                    fullName: fullName.trim(),
                    phone: phone?.trim() ?? null,
                    wardDivision: wardDivision?.trim() ?? null,
                    ...(areaId ? { areaId } : {}),
                  },
                },
              }
            : {}),
        },
        include: { citizenProfile: true },
      });

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          fullName: user.citizenProfile?.fullName ?? null,
          phone: user.citizenProfile?.phone ?? null,
          wardDivision: user.citizenProfile?.wardDivision ?? null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Update user
// ---------------------------------------------------------------------------

const updateUserSchema = z.object({
  email: z.string().email().max(255).optional(),
  role: z.enum(['CITIZEN', 'DRIVER', 'ADMIN']).optional(),
  fullName: z.string().min(1).max(120).optional(),
  phone: z
    .string()
    .regex(/^(\+94|0)[0-9]{9}$/, 'Enter a valid Sri Lankan phone number')
    .optional()
    .or(z.literal('')),
  wardDivision: z.string().max(120).optional().or(z.literal('')),
});

adminRouter.patch(
  '/users/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = updateUserSchema.safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const { id } = paramsParsed.data;
      const { email, role, fullName, phone, wardDivision } = bodyParsed.data;

      const user = await prisma.user.findUnique({
        where: { id },
        include: { citizenProfile: true },
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
      }

      // Ensure email uniqueness if changed
      if (email && email.toLowerCase().trim() !== user.email) {
        const taken = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (taken) {
          return res.status(409).json({
            success: false,
            error: { code: 'EMAIL_TAKEN', message: 'Email already in use' },
          });
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id },
          data: {
            ...(email ? { email: email.toLowerCase().trim() } : {}),
            ...(role ? { role } : {}),
          },
        });

        // Upsert or update profile
        if (fullName !== undefined || phone !== undefined || wardDivision !== undefined) {
          if (user.citizenProfile) {
            await tx.citizenProfile.update({
              where: { userId: id },
              data: {
                ...(fullName !== undefined ? { fullName } : {}),
                ...(phone !== undefined
                  ? { phone: phone === '' ? null : phone }
                  : {}),
                ...(wardDivision !== undefined
                  ? { wardDivision: wardDivision === '' ? null : wardDivision }
                  : {}),
              },
            });
          } else if (u.role === 'CITIZEN' && fullName) {
            await tx.citizenProfile.create({
              data: {
                userId: id,
                fullName,
                phone: phone && phone !== '' ? phone : null,
                wardDivision:
                  wardDivision && wardDivision !== '' ? wardDivision : null,
              },
            });
          }
        }

        return tx.user.findUnique({
          where: { id },
          include: { citizenProfile: true },
        });
      });

      if (!updated) throw new Error('Update failed');

      res.json({
        success: true,
        data: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          isActive: updated.isActive,
          createdAt: updated.createdAt,
          fullName: updated.citizenProfile?.fullName ?? null,
          phone: updated.citizenProfile?.phone ?? null,
          wardDivision: updated.citizenProfile?.wardDivision ?? null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Delete user
// ---------------------------------------------------------------------------

adminRouter.delete(
  '/users/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const { id } = paramsParsed.data;

      if (req.user?.id === id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'You cannot delete your own account',
          },
        });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
      }

      await prisma.user.delete({ where: { id } });

      res.json({ success: true, data: { id } });
    } catch (err) {
      next(err);
    }
  },
);