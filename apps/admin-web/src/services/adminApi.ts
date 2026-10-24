import { api } from './http';

export type AdminRole = 'CITIZEN' | 'DRIVER' | 'ADMIN';

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  fullName?: string | null;
};

export type LoginResult = {
  token: string;
  user: AdminUser;
};

export type StatsResult = {
  users: {
    total: number;
    citizens: number;
    drivers: number;
    admins: number;
  };
  complaints: {
    total: number;
    open: number;
  };
};

export type AdminUserListItem = {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  fullName: string | null;
  phone: string | null;
  wardDivision: string | null;
};

export type AdminUserListResult = {
  items: AdminUserListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type UsersQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: AdminRole;
};

export async function adminLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  return api.post<LoginResult>('/auth/login', { email, password });
}

export async function getMe(): Promise<AdminUser & { profile?: unknown }> {
  return api.get('/users/me', { auth: true });
}

export async function getStats(): Promise<StatsResult> {
  return api.get<StatsResult>('/admin/stats', { auth: true });
}

export async function getUsers(params: UsersQuery = {}): Promise<AdminUserListResult> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.q) search.set('q', params.q);
  if (params.role) search.set('role', params.role);
  const qs = search.toString();
  return api.get<AdminUserListResult>(`/admin/users${qs ? `?${qs}` : ''}`, {
    auth: true,
  });
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<{ id: string; email: string; role: AdminRole; isActive: boolean }> {
  return api.patch(`/admin/users/${userId}/status`, { isActive }, { auth: true });
}

export type CreateUserInput = {
  email: string;
  password: string;
  role: AdminRole;
  fullName: string;
  phone?: string;
  wardDivision?: string;
  areaId?: string;
};

export type UpdateUserInput = {
  email?: string;
  role?: AdminRole;
  fullName?: string;
  phone?: string;
  wardDivision?: string;
};

export async function createUser(input: CreateUserInput): Promise<AdminUserListItem> {
  return api.post('/admin/users', input, { auth: true });
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<AdminUserListItem> {
  return api.patch(`/admin/users/${id}`, input, { auth: true });
}

export async function deleteUser(id: string): Promise<{ id: string }> {
  return api.delete(`/admin/users/${id}`, { auth: true });
}

export type VehicleLastLocation = {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recordedAt: string;
};

export type LiveVehicle = {
  id: string;
  plateNumber: string;
  name: string | null;
  isMoving: boolean;
  lastLocation: VehicleLastLocation | null;
};

export type VehicleHistoryPoint = {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recordedAt: string;
};

export type VehicleHistory = {
  vehicleId: string;
  plateNumber: string;
  name: string | null;
  points: VehicleHistoryPoint[];
};

export async function getLiveVehicles(): Promise<LiveVehicle[]> {
  return api.get<LiveVehicle[]>('/admin/vehicles/live', { auth: true });
}

export async function getVehicleHistory(
  vehicleId: string,
  opts?: { from?: string; to?: string; limit?: number },
): Promise<VehicleHistory> {
  const search = new URLSearchParams();
  if (opts?.from) search.set('from', opts.from);
  if (opts?.to) search.set('to', opts.to);
  if (opts?.limit) search.set('limit', String(opts.limit));
  const qs = search.toString();
  return api.get<VehicleHistory>(
    `/admin/vehicles/${vehicleId}/history${qs ? `?${qs}` : ''}`,
    { auth: true },
  );
}