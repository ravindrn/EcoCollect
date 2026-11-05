import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const driverRoutesRouter = Router();

driverRoutesRouter.get('/me', requireAuth, requireRole('DRIVER', 'ADMIN'), async (req, res, next) =>{
    try{
        const vehicle = await prisma.vehicle.findFirst({
            where: { driverId: req.user!.id, isActive: true, areaId: { not: null} },
            orderBy: { createdAt: 'asc'},
        });

        if (!vehicle?.areaId) {
            return res.json({ success: true, data: null });
        }

        const schedule = await prisma.routeSchedule.findUnique({
            where: { areaId_dayOfWeek: { areaId: vehicle.areaId, dayOfWeek: new Date().getDay() } },
            include: {
                area: true,
                stops: { orderBy: { order: 'asc'}, include: { place: true} },
            },
        });

        if (!schedule) {
            return res.json({ success: true, data: null });
        }

        res.json({
            success: true,
            data: {
                routeId: schedule.area.id,
                routeName: schedule.area.name,
                startTime: schedule.startTime,
                vehicle: { id: vehicle.id, plateNumber: vehicle.plateNumber, name: vehicle.name },
                stops: schedule.stops.map((stop) => ({
                    id: stop.id,
                    order: stop.order,
                    placeId: stop.place.id,
                    name: stop.place.name,
                    latitude: stop.place.latitude,
                    longitude: stop.place.longitude,
                })),                
            },
        });
    } catch (err) {
        next(err);
    }
});