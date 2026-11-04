import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const announcementsAdminRouter = Router();

const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
const PRIORITIES = ['NORMAL', 'IMPORTANT', 'URGENT'] as const;

// Admin: list ALL announcements (including draft/archived)
announcementsAdminRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const querySchema = z.object({
        status: z.enum(STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        q: z.string().max(200).optional(),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      });
      const parsed = querySchema.safeParse(req.query);
      if (!parsed.success) throw parsed.error;

      const { status, priority, q, page, pageSize } = parsed.data;

      const where: {
        status?: (typeof STATUSES)[number];
        priority?: (typeof PRIORITIES)[number];
        OR?: Array<{
          title?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
        }>;
      } = {};

      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (q && q.trim()) {
        const term = q.trim();
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.announcement.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.announcement.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          items,
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

// Admin: delete an announcement
announcementsAdminRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const existing = await prisma.announcement.findUnique({
        where: { id: paramsParsed.data.id },
      });
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Announcement not found' },
        });
      }

      await prisma.announcement.delete({ where: { id: existing.id } });

      res.json({ success: true, data: { id: existing.id } });
    } catch (err) {
      next(err);
    }
  },
);