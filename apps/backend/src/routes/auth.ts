import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { register, login } from '../services/authService.js';

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