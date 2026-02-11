import { fetchApi } from '@/lib/api/client';
import type {
  SignupResponse,
  LoginResponse,
  MessageResponse,
  GetMeResponse,
} from '../types';

/**
 * API client for Auth module
 */
export const authApi = {
  signup: (email: string, password: string) =>
    fetchApi<SignupResponse>('/api/users/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    fetchApi<LoginResponse>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyEmail: (token: string) =>
    fetchApi<MessageResponse>('/api/users/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  forgotPassword: (email: string) =>
    fetchApi<MessageResponse>('/api/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    fetchApi<MessageResponse>('/api/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  getMe: (token: string) =>
    fetchApi<GetMeResponse>('/api/users/me', {
      method: 'GET',
      token,
    }),

  updateProfile: (data: { email?: string; password?: string }, token: string) =>
    fetchApi<GetMeResponse>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
};
