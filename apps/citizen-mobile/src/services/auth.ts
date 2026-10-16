import { api } from './http';

export type Role = 'CITIZEN' | 'DRIVER' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  fullName: string | null;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

export type MeResponse = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  profile: {
    fullName: string;
    phone: string | null;
    address: string | null;
    wardDivision: string | null;
  } | null;
};

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address?: string;
  wardDivision?: string;
};

export async function register(input: RegisterInput): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/register', input);
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  return api.post<AuthResult>('/auth/login', { email, password });
}

export async function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>('/users/me', { auth: true });
}