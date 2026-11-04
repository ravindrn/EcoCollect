import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRoutesRouter = Router();

// ---------------------------------------------------------------------------
// List all routes with full details
// ---------------------------------------------------------------------------

adminRoutesRouter.get(
  '/routes',
  requireAuth,
  requireRole('ADMIN'),
  async (_req, res, next) => {
    try {
      const areas = await prisma.area.findMany({
        orderBy: { name: 'asc' },
        include: {
          routeSchedules: {
            orderBy: { dayOfWeek: 'asc' },
            include: {
              stops: {
                orderBy: { order: 'asc' },
                include: {
                  place: { select: { id: true, name: true } },
                },
              },
            },
          },
          _count: {
            select: { citizenProfiles: true, places: true },
          },
        },
      });

      res.json({
        success: true,
        data: areas.map((a) => ({
          id: a.id,
          name: a.name,
          isActive: a.isActive,
          vehicle: a.vehicle,
          driver: a.driver,
          workers: a.workers,
          color: a.color,
          citizenCount: a._count.citizenProfiles,
          placeCount: a._count.places,
          schedules: a.routeSchedules.map((s) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            stops: s.stops.map((st) => ({
              id: st.id,
              order: st.order,
              place: { id: st.place.id, name: st.place.name },
            })),
          })),
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Create route
// ---------------------------------------------------------------------------

const createRouteSchema = z.object({
  name: z.string().min(1).max(120),
  vehicle: z.string().max(120).optional(),
  driver: z.string().max(120).optional(),
  workers: z.string().max(255).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value like #0F766E')
    .optional(),
});

adminRoutesRouter.post(
  '/routes',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const parsed = createRouteSchema.safeParse(req.body);
      if (!parsed.success) throw parsed.error;

      const name = parsed.data.name.trim();
      const existing = await prisma.area.findUnique({ where: { name } });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'NAME_TAKEN',
            message: 'A route with this name already exists',
          },
        });
      }

      const created = await prisma.area.create({
        data: {
          name,
          vehicle: parsed.data.vehicle?.trim() || null,
          driver: parsed.data.driver?.trim() || null,
          workers: parsed.data.workers?.trim() || null,
          color: parsed.data.color ?? null,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: created.id,
          name: created.name,
          isActive: created.isActive,
          vehicle: created.vehicle,
          driver: created.driver,
          workers: created.workers,
          color: created.color,
          citizenCount: 0,
          placeCount: 0,
          schedules: [],
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Update route metadata
// ---------------------------------------------------------------------------

const updateRouteSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  vehicle: z.string().max(120).optional().or(z.literal('')),
  driver: z.string().max(120).optional().or(z.literal('')),
  workers: z.string().max(255).optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value like #0F766E')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
});

adminRoutesRouter.patch(
  '/routes/:id',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const parsed = updateRouteSchema.safeParse(req.body);
      if (!parsed.success) throw parsed.error;

      const area = await prisma.area.findUnique({
        where: { id: paramsParsed.data.id },
      });
      if (!area) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Route not found' },
        });
      }

      if (parsed.data.name && parsed.data.name.trim() !== area.name) {
        const dup = await prisma.area.findUnique({
          where: { name: parsed.data.name.trim() },
        });
        if (dup) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'NAME_TAKEN',
              message: 'A route with this name already exists',
            },
          });
        }
      }

      const updated = await prisma.area.update({
        where: { id: area.id },
        data: {
          ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
          ...(parsed.data.vehicle !== undefined
            ? { vehicle: parsed.data.vehicle || null }
            : {}),
          ...(parsed.data.driver !== undefined
            ? { driver: parsed.data.driver || null }
            : {}),
          ...(parsed.data.workers !== undefined
            ? { workers: parsed.data.workers || null }
            : {}),
          ...(parsed.data.color !== undefined
            ? { color: parsed.data.color || null }
            : {}),
          ...(parsed.data.isActive !== undefined
            ? { isActive: parsed.data.isActive }
            : {}),
        },
      });

      res.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          isActive: updated.isActive,
          vehicle: updated.vehicle,
          driver: updated.driver,
          workers: updated.workers,
          color: updated.color,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Delete route
// ---------------------------------------------------------------------------

adminRoutesRouter.delete(
  '/routes/:id',
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
          _count: { select: { citizenProfiles: true, places: true } },
        },
      });
      if (!area) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Route not found' },
        });
      }

      if (area._count.citizenProfiles > 0 || area._count.places > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ROUTE_IN_USE',
            message: `Cannot delete: ${area._count.citizenProfiles} citizens and ${area._count.places} places are attached`,
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

// ---------------------------------------------------------------------------
// Add a schedule day
// ---------------------------------------------------------------------------

const addScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(6),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
});

adminRoutesRouter.post(
  '/routes/:id/schedules',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({ id: z.string().uuid() })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = addScheduleSchema.safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const area = await prisma.area.findUnique({
        where: { id: paramsParsed.data.id },
      });
      if (!area) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Route not found' },
        });
      }

      const existing = await prisma.routeSchedule.findUnique({
        where: {
          areaId_dayOfWeek: {
            areaId: area.id,
            dayOfWeek: bodyParsed.data.dayOfWeek,
          },
        },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DAY_TAKEN',
            message: 'This route already has a schedule for that day',
          },
        });
      }

      const schedule = await prisma.routeSchedule.create({
        data: {
          areaId: area.id,
          dayOfWeek: bodyParsed.data.dayOfWeek,
          startTime: bodyParsed.data.startTime,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          stops: [],
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Update a schedule day
// ---------------------------------------------------------------------------

adminRoutesRouter.patch(
  '/routes/:id/schedules/:scheduleId',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({
          id: z.string().uuid(),
          scheduleId: z.string().uuid(),
        })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = z
        .object({
          startTime: z
            .string()
            .regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM')
            .optional(),
        })
        .safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const schedule = await prisma.routeSchedule.findUnique({
        where: { id: paramsParsed.data.scheduleId },
      });
      if (!schedule || schedule.areaId !== paramsParsed.data.id) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Schedule not found' },
        });
      }

      const updated = await prisma.routeSchedule.update({
        where: { id: schedule.id },
        data: {
          ...(bodyParsed.data.startTime
            ? { startTime: bodyParsed.data.startTime }
            : {}),
        },
      });

      res.json({
        success: true,
        data: {
          id: updated.id,
          dayOfWeek: updated.dayOfWeek,
          startTime: updated.startTime,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Delete a schedule day
// ---------------------------------------------------------------------------

adminRoutesRouter.delete(
  '/routes/:id/schedules/:scheduleId',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({
          id: z.string().uuid(),
          scheduleId: z.string().uuid(),
        })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const schedule = await prisma.routeSchedule.findUnique({
        where: { id: paramsParsed.data.scheduleId },
      });
      if (!schedule || schedule.areaId !== paramsParsed.data.id) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Schedule not found' },
        });
      }

      await prisma.routeSchedule.delete({ where: { id: schedule.id } });
      res.json({ success: true, data: { id: schedule.id } });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Add stop to a schedule day
// ---------------------------------------------------------------------------

const addStopSchema = z.object({
  placeId: z.string().uuid(),
});

adminRoutesRouter.post(
  '/routes/:id/schedules/:scheduleId/stops',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({
          id: z.string().uuid(),
          scheduleId: z.string().uuid(),
        })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = addStopSchema.safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const schedule = await prisma.routeSchedule.findUnique({
        where: { id: paramsParsed.data.scheduleId },
        include: { stops: { orderBy: { order: 'desc' }, take: 1 } },
      });
      if (!schedule || schedule.areaId !== paramsParsed.data.id) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Schedule not found' },
        });
      }

      const place = await prisma.place.findUnique({
        where: { id: bodyParsed.data.placeId },
      });
      if (!place) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Place not found' },
        });
      }

      const alreadyInSchedule = await prisma.routeStop.findFirst({
        where: {
          scheduleId: schedule.id,
          placeId: place.id,
        },
      });
      if (alreadyInSchedule) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'STOP_EXISTS',
            message: 'This place is already on this day',
          },
        });
      }

      const nextOrder =
        schedule.stops.length > 0 ? (schedule.stops[0]!.order ?? 0) + 1 : 1;

      const stop = await prisma.routeStop.create({
        data: {
          scheduleId: schedule.id,
          placeId: place.id,
          order: nextOrder,
        },
        include: {
          place: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: stop.id,
          order: stop.order,
          place: { id: stop.place.id, name: stop.place.name },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Delete stop
// ---------------------------------------------------------------------------

adminRoutesRouter.delete(
  '/routes/:id/schedules/:scheduleId/stops/:stopId',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({
          id: z.string().uuid(),
          scheduleId: z.string().uuid(),
          stopId: z.string().uuid(),
        })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const stop = await prisma.routeStop.findUnique({
        where: { id: paramsParsed.data.stopId },
        include: { schedule: true },
      });
      if (
        !stop ||
        stop.schedule.id !== paramsParsed.data.scheduleId ||
        stop.schedule.areaId !== paramsParsed.data.id
      ) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Stop not found' },
        });
      }

      await prisma.routeStop.delete({ where: { id: stop.id } });
      res.json({ success: true, data: { id: stop.id } });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Reorder stops
// ---------------------------------------------------------------------------

const reorderSchema = z.object({
  stopIds: z.array(z.string().uuid()).min(1),
});

adminRoutesRouter.patch(
  '/routes/:id/schedules/:scheduleId/stops/reorder',
  requireAuth,
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const paramsParsed = z
        .object({
          id: z.string().uuid(),
          scheduleId: z.string().uuid(),
        })
        .safeParse(req.params);
      if (!paramsParsed.success) throw paramsParsed.error;

      const bodyParsed = reorderSchema.safeParse(req.body);
      if (!bodyParsed.success) throw bodyParsed.error;

      const schedule = await prisma.routeSchedule.findUnique({
        where: { id: paramsParsed.data.scheduleId },
        include: { stops: true },
      });
      if (!schedule || schedule.areaId !== paramsParsed.data.id) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Schedule not found' },
        });
      }

      // Validate the provided IDs match this schedule's stops
      const existingIds = new Set(schedule.stops.map((s) => s.id));
      for (const id of bodyParsed.data.stopIds) {
        if (!existingIds.has(id)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_STOP',
              message: 'One of the stop IDs does not belong to this schedule',
            },
          });
        }
      }

      // Apply new order
      await prisma.$transaction(
        bodyParsed.data.stopIds.map((stopId, index) =>
          prisma.routeStop.update({
            where: { id: stopId },
            data: { order: index + 1 },
          }),
        ),
      );

      res.json({ success: true, data: { reordered: true } });
    } catch (err) {
      next(err);
    }
  },
);