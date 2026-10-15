import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, 'Not authenticated', 'UNAUTHORIZED');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { citizenProfile: true },
    });

    if (!user) throw new HttpError(404, 'User not found', 'NOT_FOUND');

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        profile: user.citizenProfile
          ? {
              fullName: user.citizenProfile.fullName,
              phone: user.citizenProfile.phone,
              address: user.citizenProfile.address,
              wardDivision: user.citizenProfile.wardDivision,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
});