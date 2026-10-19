import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type Role = 'CITIZEN' | 'DRIVER' | 'ADMIN';

export type JwtPayload = {
  sub: string; // user id
  role: Role;
};

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as { sub?: unknown }).sub !== 'string' ||
    typeof (decoded as { role?: unknown }).role !== 'string'
  ) {
    throw new Error('Invalid token payload');
  }

  return {
    sub: (decoded as { sub: string }).sub,
    role: (decoded as { role: Role }).role,
  };
}