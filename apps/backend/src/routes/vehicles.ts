import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const vehiclesRouter = Router();

/**
 * GET /api/v1/vehicles/me
 * The signed-in driver's assigned vehicle and its latest ping.
 */
vehiclesRouter.get('/me', requireAuth, requireRole('DRIVER', 'ADMIN'), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { driverId: req.user!.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!vehicle) {
      return res.json({ success: true, data: null });
    }

    const latest = await prisma.vehicleLocation.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { recordedAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        name: vehicle.name,
        lastLocation: latest
          ? {
              latitude: latest.latitude,
              longitude: latest.longitude,
              speed: latest.speed,
              heading: latest.heading,
              recordedAt: latest.recordedAt,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

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

      if (req.user?.role === 'DRIVER' && vehicle.driverId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'This vehicle is not assigned to you' },
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

const routeAlertBody = z.object({
  kind: z.enum(['OUTSIDE', 'INSIDE']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  routeName: z.string().trim().min(1).max(120).nullable().optional(),
  recordedAt: z.string().datetime().optional(),
});

function serializeRouteAlert(alert: {
  id: string;
  vehicleId: string;
  kind: 'OUTSIDE' | 'INSIDE';
  routeName: string | null;
  latitude: number;
  longitude: number;
  recordedAt: Date;
}) {
  return {
    id: alert.id,
    vehicleId: alert.vehicleId,
    kind: alert.kind,
    routeName: alert.routeName,
    latitude: alert.latitude,
    longitude: alert.longitude,
    recordedAt: alert.recordedAt,
  };
}

/**
 * POST /api/v1/vehicles/:id/route-alerts
 * The driver reports a change: left the route corridor, or returned to it.
 * A repeat of the latest kind is ignored so one crossing creates one alert.
 */
vehiclesRouter.post(
  '/:id/route-alerts',
  requireAuth,
  requireRole('DRIVER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = routeAlertBody.safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const { id } = paramsParsed.data;
      const { kind, latitude, longitude, routeName, recordedAt } = bodyParsed.data;

      const vehicle = await prisma.vehicle.findUnique({ where: { id } });
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Vehicle not found' },
        });
      }

      if (req.user?.role === 'DRIVER' && vehicle.driverId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'This vehicle is not assigned to you' },
        });
      }

      const latest = await prisma.routeAlert.findFirst({
        where: { vehicleId: id },
        orderBy: { recordedAt: 'desc' },
      });
      if (latest?.kind === kind) {
        return res.json({ success: true, data: { ...serializeRouteAlert(latest), duplicate: true } });
      }

      const alert = await prisma.routeAlert.create({
        data: {
          vehicleId: id,
          driverId: req.user!.id,
          kind,
          routeName: routeName ?? null,
          latitude,
          longitude,
          ...(recordedAt ? { recordedAt: new Date(recordedAt) } : {}),
        },
      });

      res.status(201).json({
        success: true,
        data: { ...serializeRouteAlert(alert), duplicate: false },
      });
    } catch (err) {
      next(err);
    }
  },
);