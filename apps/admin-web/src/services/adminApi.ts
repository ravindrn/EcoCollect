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

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

export type ComplaintCategory =
  | 'OVERFLOW'
  | 'MISSED_PICKUP'
  | 'ILLEGAL_DUMPING'
  | 'BURNING'
  | 'DAMAGED_BIN'
  | 'OTHER';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export type AdminComplaintItem = {
  id: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  description: string;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    wardDivision: string | null;
  };
};

export type ComplaintsListResult = {
  items: AdminComplaintItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<string, number>;
};

export type ComplaintsQuery = {
  page?: number;
  pageSize?: number;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  q?: string;
};

export async function getComplaints(
  params: ComplaintsQuery = {},
): Promise<ComplaintsListResult> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.status) search.set('status', params.status);
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  return api.get<ComplaintsListResult>(
    `/admin/complaints${qs ? `?${qs}` : ''}`,
    { auth: true },
  );
}

export async function getComplaint(id: string): Promise<AdminComplaintItem> {
  return api.get<AdminComplaintItem>(`/admin/complaints/${id}`, { auth: true });
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
): Promise<{ id: string; status: ComplaintStatus; updatedAt: string }> {
  return api.patch(
    `/admin/complaints/${id}/status`,
    { status },
    { auth: true },
  );
}

/** Resolve a complaint photo URL from the backend into an absolute URL. */
export function resolvePhotoUrl(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  // Backend returns relative paths like /uploads/xxx.jpg
  // env.apiBaseUrl is like http://localhost:4000/api/v1
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const origin = base.replace(/\/api\/v1\/?$/, '');
  return `${origin}${photoUrl}`;
}

// ---------------------------------------------------------------------------
// Announcements (admin)
// ---------------------------------------------------------------------------

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type Announcement = {
  id: string;
  title: string;
  description: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementListResult = {
  items: Announcement[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CreateAnnouncementInput = {
  title: string;
  description: string;
  priority?: AnnouncementPriority;
};

export type UpdateAnnouncementInput = {
  title?: string;
  description?: string;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
};

export async function getAnnouncementsAdmin(params: {
  page?: number;
  pageSize?: number;
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  q?: string;
} = {}): Promise<AnnouncementListResult> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.status) search.set('status', params.status);
  if (params.priority) search.set('priority', params.priority);
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  return api.get(`/admin/announcements${qs ? `?${qs}` : ''}`, { auth: true });
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<Announcement> {
  return api.post('/announcements', input, { auth: true });
}

export async function updateAnnouncement(
  id: string,
  input: UpdateAnnouncementInput,
): Promise<Announcement> {
  return api.patch(`/announcements/${id}`, input, { auth: true });
}

export async function deleteAnnouncement(id: string): Promise<{ id: string }> {
  return api.delete(`/admin/announcements/${id}`, { auth: true });
}

// ---------------------------------------------------------------------------
// Areas (admin)
// ---------------------------------------------------------------------------

export type AdminArea = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  citizenCount: number;
  updateCount: number;
};

export async function getAreasAdmin(): Promise<AdminArea[]> {
  return api.get('/admin/areas', { auth: true });
}

export async function createArea(input: {
  name: string;
  isActive?: boolean;
}): Promise<AdminArea> {
  return api.post('/admin/areas', input, { auth: true });
}

export async function updateArea(
  id: string,
  input: { name?: string; isActive?: boolean },
): Promise<AdminArea> {
  return api.patch(`/admin/areas/${id}`, input, { auth: true });
}

export async function deleteArea(id: string): Promise<{ id: string }> {
  return api.delete(`/admin/areas/${id}`, { auth: true });
}