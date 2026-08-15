import type { JsonBody, RequestOptions } from './types';

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
export const API_BASE_URL = configuredApiUrl ? configuredApiUrl.replace(/\/+$/, '') : 'http://127.0.0.1:8000';

export class ApiError extends Error {
  readonly status?: number;
  readonly body?: unknown;

  constructor(message: string, status?: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API paths must start with "/": ${path}`);
  }
  return `${API_BASE_URL}${path}`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
  const text = await response.text();
  return text || undefined;
}

function errorMessage(body: unknown, status: number): string {
  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    for (const key of ['detail', 'message', 'error']) {
      if (typeof record[key] === 'string' && record[key].trim()) return record[key];
    }
  }
  return `API request failed with status ${status}`;
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });
  const body = await readResponseBody(response);
  if (!response.ok) throw new ApiError(errorMessage(body, response.status), response.status, body);
  return body as T;
}

export function get<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, {
    method: 'GET',
    signal: options.signal,
    headers: options.headers,
  });
}

export function postJson<T>(
  path: string,
  body: JsonBody | undefined,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal,
    headers: options.headers,
  });
}

export function postText<T>(
  path: string,
  body: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'text/plain');
  return request<T>(path, {
    method: 'POST',
    body,
    signal: options.signal,
    headers,
  });
}

export function postFormData<T>(
  path: string,
  body: FormData,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body,
    signal: options.signal,
    headers: options.headers,
  });
}