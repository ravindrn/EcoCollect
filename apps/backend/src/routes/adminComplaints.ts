import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminComplaintsRouter = Router();

const CATEGORIES = [
  'OVERFLOW',
  'MISSED_PICKUP',
  'ILLEGAL_DUMPING',
  'BURNING',
  'DAMAGED_BIN',
  'OTHER',
] as const;

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const;

// ---------------------------------------------------------------------------
// List all complaints (admin only, paginated, filterable)
// ---------------------------------------------------------------------------

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
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

      const { page, pageSize, status, category, q } = parsed.data;

      const where: {
        status?: (typeof STATUSES)[number];
        category?: (typeof CATEGORIES)[number];
        OR?: Array<{
          description?: { contains: string; mode: 'insensitive' };
          reporter?: {
            email?: { contains: string; mode: 'insensitive' };
            citizenProfile?: {
              is: { fullName?: { contains: string; mode: 'insensitive' } };
            };
          };
        }>;
      } = {};

      if (status) where.status = status;
      if (category) where.category = category;
      if (q && q.trim()) {
        const term = q.trim();
        where.OR = [
          { description: { contains: term, mode: 'insensitive' } },
          {
            reporter: {
              email: { contains: term, mode: 'insensitive' },
            },
          },
          {
            reporter: {
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
            reporter: {
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
        // Global counts per status (unfiltered) for the tab badges
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
            category: c.category,
            status: c.status,
            description: c.description,
            photoUrl: c.photoUrl,
            latitude: c.latitude,
            longitude: c.longitude,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            reporter: {
              id: c.reporter.id,
              email: c.reporter.email,
              fullName: c.reporter.citizenProfile?.fullName ?? null,
              phone: c.reporter.citizenProfile?.phone ?? null,
              wardDivision: c.reporter.citizenProfile?.wardDivision ?? null,
            },
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
          reporter: {
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
          category: complaint.category,
          status: complaint.status,
          description: complaint.description,
          photoUrl: complaint.photoUrl,
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
          reporter: {
            id: complaint.reporter.id,
            email: complaint.reporter.email,
            fullName: complaint.reporter.citizenProfile?.fullName ?? null,
            phone: complaint.reporter.citizenProfile?.phone ?? null,
            wardDivision: complaint.reporter.citizenProfile?.wardDivision ?? null,
          },
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
          category: updated.category,
          status: updated.status,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);