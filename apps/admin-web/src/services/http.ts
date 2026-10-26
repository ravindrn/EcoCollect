import { env } from '../config/env';
import { adminSession } from './session';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Options = { auth?: boolean };

export async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  opts: Options = {},
): Promise<T> {
  const url = `${env.apiBaseUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (opts.auth) {
    const token = adminSession.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (res.status === 401 && opts.auth) {
    adminSession.clear();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired', 401, 'UNAUTHORIZED');
  }

  if (!res.ok) {
    const message =
      json?.error?.message ?? json?.message ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json?.error?.code, json?.error);
  }

  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, opts?: Options) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: Options) => request<T>('POST', path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: Options) => request<T>('PATCH', path, body, opts),
  delete: <T>(path: string, opts?: Options) => request<T>('DELETE', path, undefined, opts),
};