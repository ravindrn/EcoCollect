import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const areasAdminRouter = Router();

// Admin: list ALL areas (including inactive) with citizen counts
areasAdminRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  async (_req, res, next) => {
    try {
      const areas = await prisma.area.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { citizenProfiles: true, communityUpdates: true },
          },
        },
      });

      res.json({
        success: true,
        data: areas.map((a) => ({
          id: a.id,
          name: a.name,
          isActive: a.isActive,
          createdAt: a.createdAt,
          citizenCount: a._count.citizenProfiles,
          updateCount: a._count.communityUpdates,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

// Admin: create area
areasAdminRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const bodyParsed = z
        .object({
          name: z.string().min(1).max(120),
          isActive: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const name = bodyParsed.data.name.trim();

      const existing = await prisma.area.findUnique({ where: { name } });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'NAME_TAKEN',
            message: 'An area with this name already exists',
          },
        });
      }

      const area = await prisma.area.create({
        data: {
          name,
          isActive: bodyParsed.data.isActive ?? true,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: area.id,
          name: area.name,
          isActive: area.isActive,
          createdAt: area.createdAt,
          citizenCount: 0,
          updateCount: 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// Admin: update area (name, isActive)
areasAdminRouter.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = z
        .object({
          name: z.string().min(1).max(120).optional(),
          isActive: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const existing = await prisma.area.findUnique({
        where: { id: paramsParsed.data.id },
      });
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Area not found' },
        });
      }

      if (bodyParsed.data.name) {
        const trimmed = bodyParsed.data.name.trim();
        if (trimmed !== existing.name) {
          const duplicate = await prisma.area.findUnique({
            where: { name: trimmed },
          });
          if (duplicate) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'NAME_TAKEN',
                message: 'An area with this name already exists',
              },
            });
          }
        }
      }

      const updated = await prisma.area.update({
        where: { id: existing.id },
        data: {
          ...(bodyParsed.data.name
            ? { name: bodyParsed.data.name.trim() }
            : {}),
          ...(bodyParsed.data.isActive !== undefined
            ? { isActive: bodyParsed.data.isActive }
            : {}),
        },
        include: {
          _count: {
            select: { citizenProfiles: true, communityUpdates: true },
          },
        },
      });

      res.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          isActive: updated.isActive,
          createdAt: updated.createdAt,
          citizenCount: updated._count.citizenProfiles,
          updateCount: updated._count.communityUpdates,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// Admin: delete area (blocked if it has citizens or community updates)
areasAdminRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const area = await prisma.area.findUnique({
        where: { id: paramsParsed.data.id },
        include: {
          _count: {
            select: { citizenProfiles: true, communityUpdates: true },
          },
        },
      });
      if (!area) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Area not found' },
        });
      }

      if (area._count.citizenProfiles > 0 || area._count.communityUpdates > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'AREA_IN_USE',
            message: `Cannot delete: area is linked to ${area._count.citizenProfiles} citizens and ${area._count.communityUpdates} community updates`,
          },
        });
      }

      await prisma.area.delete({ where: { id: area.id } });

      res.json({ success: true, data: { id: area.id } });
    } catch (err) {
      next(err);
    }
  },
);