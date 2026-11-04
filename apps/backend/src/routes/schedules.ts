import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const schedulesRouter = Router();

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday',
];

/**
 * GET /api/v1/schedules/me
 * Returns the logged-in citizen's collection schedule based on their area (route).
 */
schedulesRouter.get(
  '/me',
  requireAuth,
  requireRole('CITIZEN'),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          citizenProfile: {
            include: {
              area: true,
              place: true,
            },
          },
        },
      });

      if (!user || !user.citizenProfile) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_PROFILE',
            message: 'Citizen profile not found',
          },
        });
      }

      const profile = user.citizenProfile;
      const area = profile.area;

      if (!area) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_AREA',
            message: 'No area assigned to this profile',
          },
        });
      }

      // Fetch schedules for the area
      const schedules = await prisma.collectionSchedule.findMany({
        where: { areaId: area.id },
        orderBy: { dayOfWeek: 'asc' },
      });

      if (schedules.length === 0) {
        return res.json({
          success: true,
          data: {
            placeName: profile.place?.name ?? null,
            areaName: area.name,
            available: false,
            message: 'No schedule available for your area yet',
          },
        });
      }

      // Find next collection day (today or next N days)
      const today = new Date();
      const todayDow = today.getDay();
      const schedulesByDow = new Map(schedules.map((s) => [s.dayOfWeek, s]));

      let nextSchedule = null;
      let daysUntil = 0;

      for (let offset = 0; offset <= 7; offset++) {
        const dow = (todayDow + offset) % 7;
        const s = schedulesByDow.get(dow);
        if (s) {
          nextSchedule = s;
          daysUntil = offset;
          break;
        }
      }

      // Get today's schedule (if any) for "Collected today" hint
      const todaysSchedule = schedulesByDow.get(todayDow) ?? null;

      // Build the next date
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysUntil);

      const primarySchedule = schedules[0]!; // any row for vehicle/driver info

      res.json({
        success: true,
        data: {
          placeName: profile.place?.name ?? null,
          areaName: area.name,
          available: true,
          vehicle: primarySchedule.vehicle,
          driver: primarySchedule.driver,
          workers: primarySchedule.workers,
          startTime: primarySchedule.startTime,
          weeklyDays: schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            dayName: DAY_NAMES[s.dayOfWeek] ?? 'Unknown',
          })),
          todaysCollection: todaysSchedule
            ? {
                active: true,
                startTime: todaysSchedule.startTime,
                dayName: DAY_NAMES[todayDow],
              }
            : null,
          nextCollection: nextSchedule
            ? {
                dayOfWeek: nextSchedule.dayOfWeek,
                dayName: DAY_NAMES[nextSchedule.dayOfWeek] ?? 'Unknown',
                date: nextDate.toISOString().slice(0, 10),
                startTime: nextSchedule.startTime,
                isToday: daysUntil === 0,
                daysUntil,
              }
            : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);