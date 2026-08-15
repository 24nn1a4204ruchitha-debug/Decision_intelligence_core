import { get, postJson } from './client';
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthMeResponse,
  AuthRegisterRequest,
  AuthRegisterResponse,
  RequestOptions,
} from './types';

export function register(
  body: AuthRegisterRequest,
  options?: RequestOptions,
): Promise<AuthRegisterResponse> {
  return postJson('/api/auth/register', body, options);
}

export function login(
  body: AuthLoginRequest,
  options?: RequestOptions,
): Promise<AuthLoginResponse> {
  return postJson('/api/auth/login', body, options);
}

export function getCurrentUser(options?: RequestOptions): Promise<AuthMeResponse> {
  return get('/api/auth/me', options);
}