import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminComplaintsRouter = Router();

const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const;
// ---------------------------------------------------------------------------
// List all complaints (admin only, paginated, filterable)
// ---------------------------------------------------------------------------

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(STATUSES).optional(),
  category: z.string().max(50).optional(),
  anonymous: z.enum(['true', 'false']).optional(),
  q: z.string().max(200).optional(),
});

adminComplaintsRouter.get(
  '/complaints',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) throw parsed.error;

      const { page, pageSize, status, category, anonymous, q } = parsed.data;

      const where: {
        status?: (typeof STATUSES)[number];
        category?: string;
        isAnonymous?: boolean;
        OR?: Array<{
          title?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
          user?: {
            email?: { contains: string; mode: 'insensitive' };
            citizenProfile?: {
              is: { fullName?: { contains: string; mode: 'insensitive' } };
            };
          };
        }>;
      } = {};

      if (status) where.status = status;
      if (category) where.category = category;
      if (anonymous) where.isAnonymous = anonymous === 'true';
      if (q && q.trim()) {
        const term = q.trim();
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          {
            user: { email: { contains: term, mode: 'insensitive' } },
          },
          {
            user: {
              citizenProfile: {
                is: { fullName: { contains: term, mode: 'insensitive' } },
              },
            },
          },
        ];
      }

      const [items, total, statusCounts] = await Promise.all([
        prisma.complaint.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                citizenProfile: {
                  select: {
                    fullName: true,
                    phone: true,
                    wardDivision: true,
                  },
                },
              },
            },
          },
        }),
        prisma.complaint.count({ where }),
        prisma.complaint.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          items: items.map((c) => ({
            id: c.id,
            title: c.title,
            category: c.category,
            status: c.status,
            description: c.description,
            photoUrl: c.photoUrl,
            latitude: c.latitude,
            longitude: c.longitude,
            isAnonymous: c.isAnonymous,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            user: c.user
              ? {
                  id: c.user.id,
                  email: c.user.email,
                  fullName: c.user.citizenProfile?.fullName ?? null,
                  phone: c.user.citizenProfile?.phone ?? null,
                  wardDivision: c.user.citizenProfile?.wardDivision ?? null,
                }
              : null,
          })),
          meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
          statusCounts: statusCounts.reduce<Record<string, number>>(
            (acc, row) => {
              acc[row.status] = row._count._all;
              return acc;
            },
            {},
          ),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Get one complaint by id (admin sees any)
// ---------------------------------------------------------------------------

adminComplaintsRouter.get(
  '/complaints/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const complaint = await prisma.complaint.findUnique({
        where: { id: paramsParsed.data.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              citizenProfile: {
                select: {
                  fullName: true,
                  phone: true,
                  wardDivision: true,
                },
              },
            },
          },
        },
      });

      if (!complaint) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Complaint not found' },
        });
      }

      res.json({
        success: true,
        data: {
          id: complaint.id,
          title: complaint.title,
          category: complaint.category,
          status: complaint.status,
          description: complaint.description,
          photoUrl: complaint.photoUrl,
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          isAnonymous: complaint.isAnonymous,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
          user: complaint.user
            ? {
                id: complaint.user.id,
                email: complaint.user.email,
                fullName: complaint.user.citizenProfile?.fullName ?? null,
                phone: complaint.user.citizenProfile?.phone ?? null,
                wardDivision: complaint.user.citizenProfile?.wardDivision ?? null,
              }
            : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Update status
// ---------------------------------------------------------------------------

const statusSchema = z.object({
  status: z.enum(STATUSES),
});

adminComplaintsRouter.patch(
  '/complaints/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = statusSchema.safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const complaint = await prisma.complaint.findUnique({
        where: { id: paramsParsed.data.id },
      });
      if (!complaint) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Complaint not found' },
        });
      }

      const updated = await prisma.complaint.update({
        where: { id: complaint.id },
        data: { status: bodyParsed.data.status },
      });

      res.json({
        success: true,
        data: {
          id: updated.id,
          status: updated.status,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);