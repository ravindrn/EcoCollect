import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const healthDbRouter = Router();

healthDbRouter.get('/', async (_req, res, next) => {
  try {
    const row = await prisma.healthCheck.create({ data: {} });
    await prisma.healthCheck.delete({ where: { id: row.id } });

    res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'ecocollect_dev',
        time: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});