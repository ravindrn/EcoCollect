import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const placesRouter = Router();

/**
 * GET /api/v1/places
 * Public search endpoint for registration.
 * Query: q, areaId, limit
 */
placesRouter.get('/', async (req, res, next) => {
  try {
    const querySchema = z.object({
      q: z.string().max(100).optional(),
      areaId: z.string().uuid().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(100),
    });
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) throw parsed.error;

    const { q, areaId, limit } = parsed.data;

    const where: {
      areaId?: string;
      name?: { contains: string; mode: 'insensitive' };
    } = {};

    if (areaId) where.areaId = areaId;
    if (q && q.trim()) {
      where.name = { contains: q.trim(), mode: 'insensitive' };
    }

    const places = await prisma.place.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
      include: { area: { select: { id: true, name: true } } },
    });

    res.json({
      success: true,
      data: places.map((p) => ({
        id: p.id,
        name: p.name,
        area: { id: p.area.id, name: p.area.name },
      })),
    });
  } catch (err) {
    next(err);
  }
});