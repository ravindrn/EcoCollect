import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const vehiclesRouter = Router();

/**
 * POST /api/v1/vehicles/:id/ping
 * Driver apps (or IoT trackers) post location updates here.
 * Requires DRIVER or ADMIN role.
 */
vehiclesRouter.post(
  '/:id/ping',
  requireAuth,
  requireRole('DRIVER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = z
        .object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          speed: z.number().min(0).max(300).optional(),
          heading: z.number().min(0).max(360).optional(),
        })
        .safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const { id } = paramsParsed.data;
      const { latitude, longitude, speed, heading } = bodyParsed.data;

      const vehicle = await prisma.vehicle.findUnique({ where: { id } });
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Vehicle not found' },
        });
      }

      const location = await prisma.vehicleLocation.create({
        data: {
          vehicleId: id,
          latitude,
          longitude,
          speed: speed ?? null,
          heading: heading ?? null,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: location.id,
          vehicleId: location.vehicleId,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          recordedAt: location.recordedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);