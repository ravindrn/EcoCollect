import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './error.js';
import { verifyAccessToken, type Role } from '../lib/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing or invalid Authorization header', 'UNAUTHORIZED'));
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
  }
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Not authenticated', 'UNAUTHORIZED'));
    }
    if (!allowed.includes(req.user.role)) {
      return next(new HttpError(403, 'Forbidden', 'FORBIDDEN'));
    }
    next();
  };
}