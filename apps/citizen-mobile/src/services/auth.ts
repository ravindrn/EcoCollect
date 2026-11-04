import { api } from "./http";

export type Role = "CITIZEN" | "DRIVER" | "ADMIN";


export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  fullName: string | null;
  areaName?: string | null;
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
    area: {
      id: string;
      name: string;
    } | null;
  } | null;
};


export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  placeId: string;
  address?: string;
  wardDivision?: string;
};

export type Area = {
  id: string;
  name: string;
};

export async function getAreas(): Promise<Area[]> {
  return api.get<Area[]>("/areas");
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  return api.post<AuthResult>("/auth/register", input);
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  return api.post<AuthResult>("/auth/login", { email, password });
}

export async function getMe(): Promise<MeResponse> {
  return api.get<MeResponse>("/users/me", { auth: true });
}

export type Place = {
  id: string;
  name: string;
  area: { id: string; name: string };
};

export async function getPlaces(
  params: { q?: string; areaId?: string; limit?: number } = {},
): Promise<Place[]> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.areaId) search.set('areaId', params.areaId);
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return api.get<Place[]>(`/places${qs ? `?${qs}` : ''}`);
}

export type ScheduleDay = {
  dayOfWeek: number;
  dayName: string;
};

export type NextCollection = {
  dayOfWeek: number;
  dayName: string;
  date: string;
  startTime: string;
  isToday: boolean;
  daysUntil: number;
};

export type TodaysCollection = {
  active: boolean;
  startTime: string;
  dayName: string;
};

export type MySchedule = {
  placeName: string | null;
  areaName: string;
  available: boolean;
  message?: string;
  vehicle?: string | null;
  driver?: string | null;
  workers?: string | null;
  startTime?: string;
  weeklyDays?: ScheduleDay[];
  todaysCollection?: TodaysCollection | null;
  nextCollection?: NextCollection | null;
};

export async function getMySchedule(): Promise<MySchedule> {
  return api.get<MySchedule>('/schedules/me', { auth: true });
}
