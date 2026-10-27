import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminVehiclesRouter = Router();

/**
 * GET /api/v1/admin/route-alerts
 * Newest route crossings first. Admin uses this to see who is off the route.
 */
adminVehiclesRouter.get(
  '/route-alerts',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const queryParsed = z
        .object({
          limit: z.coerce.number().int().min(1).max(200).default(50),
        })
        .safeParse(req.query);
      if (!queryParsed.success) throw queryParsed.error;

      const alerts = await prisma.routeAlert.findMany({
        orderBy: { recordedAt: 'desc' },
        take: queryParsed.data.limit,
        include: {
          vehicle: { select: { id: true, plateNumber: true, name: true } },
          driver: { select: { id: true, email: true } },
        },
      });

      res.json({
        success: true,
        data: alerts.map((alert) => ({
          id: alert.id,
          kind: alert.kind,
          routeName: alert.routeName,
          latitude: alert.latitude,
          longitude: alert.longitude,
          recordedAt: alert.recordedAt,
          vehicle: alert.vehicle,
          driver: alert.driver,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/admin/vehicles/live
 * Returns, per vehicle:
 *   - latest position
 *   - whether it is "moving" (last ping within 2 minutes)
 *   - last recorded time
 */
adminVehiclesRouter.get(
  '/vehicles/live',
  requireAuth,
  requireRole('ADMIN'),
  async (_req, res, next) => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      const now = Date.now();
      const MOVING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

      const result = await Promise.all(
        vehicles.map(async (v) => {
          const latest = await prisma.vehicleLocation.findFirst({
            where: { vehicleId: v.id },
            orderBy: { recordedAt: 'desc' },
          });

          const isMoving =
            latest !== null &&
            now - latest.recordedAt.getTime() < MOVING_THRESHOLD_MS;

          return {
            id: v.id,
            plateNumber: v.plateNumber,
            name: v.name,
            isMoving,
            lastLocation: latest
              ? {
                  latitude: latest.latitude,
                  longitude: latest.longitude,
                  speed: latest.speed,
                  heading: latest.heading,
                  recordedAt: latest.recordedAt,
                }
              : null,
          };
        }),
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/v1/admin/vehicles/:id/history
 * Returns ordered list of locations within a time window.
 * Query: from, to (ISO strings) — defaults to last 24h.
 */
adminVehiclesRouter.get(
  '/vehicles/:id/history',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const queryParsed = z
        .object({
          from: z.string().datetime().optional(),
          to: z.string().datetime().optional(),
          limit: z.coerce.number().int().min(1).max(5000).default(1000),
        })
        .safeParse(req.query);
      if (!queryParsed.success) throw queryParsed.error;

      const { id } = paramsParsed.data;
      const { from, to, limit } = queryParsed.data;

      const vehicle = await prisma.vehicle.findUnique({ where: { id } });
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Vehicle not found' },
        });
      }

      const now = new Date();
      const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const points = await prisma.vehicleLocation.findMany({
        where: {
          vehicleId: id,
          recordedAt: {
            gte: from ? new Date(from) : defaultFrom,
            ...(to ? { lte: new Date(to) } : {}),
          },
        },
        orderBy: { recordedAt: 'asc' },
        take: limit,
      });

      res.json({
        success: true,
        data: {
          vehicleId: id,
          plateNumber: vehicle.plateNumber,
          name: vehicle.name,
          points: points.map((p) => ({
            latitude: p.latitude,
            longitude: p.longitude,
            speed: p.speed,
            heading: p.heading,
            recordedAt: p.recordedAt,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);