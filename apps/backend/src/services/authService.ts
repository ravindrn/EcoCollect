import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken, type Role } from '../lib/jwt.js';
import { HttpError } from '../middleware/error.js';

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address?: string;
  wardDivision?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult = {
  token: string;
  user: {
    id: string;
    email: string;
    role: Role;
    fullName: string | null;
  };
};

export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Email already registered', 'EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'CITIZEN',
      citizenProfile: {
  create: {
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    address: input.address?.trim() || null,
    wardDivision: input.wardDivision?.trim() || null,
  },
},
    },
    include: { citizenProfile: true },
  });

  const token = signAccessToken({ sub: user.id, role: user.role as Role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.citizenProfile?.fullName ?? null,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { citizenProfile: true },
  });

  if (!user || !user.isActive) {
    throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = signAccessToken({ sub: user.id, role: user.role as Role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.citizenProfile?.fullName ?? null,
    },
  };
}