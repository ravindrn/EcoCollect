
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const areasRouter = Router();

areasRouter.get('/', async (_req, res, next) => {
  try {
    const areas = await prisma.area.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: areas,
    });
  } catch (err) {
    next(err);
  }
});
