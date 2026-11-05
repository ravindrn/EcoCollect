import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from "../middleware/auth.js";
import { register, login, changePassword } from '../services/authService.js';
import { HttpError } from "../middleware/error.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  fullName: z.string().min(1).max(120),
  phone: z
    .string()
    .regex(/^(\+94|0)[0-9]{9}$/, 'Enter a valid Sri Lankan phone number'),
  placeId: z.string().uuid('Please select your area or road'),
  address: z.string().max(255).optional(),
  wardDivision: z.string().max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordSchema),
  async (req, res, next) => {
    try {
      if (!req.user) {
        throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
      }

      await changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword,
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);