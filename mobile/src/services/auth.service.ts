import { getAuthToken, removeAuthToken, request, setAuthToken } from '../api/client';

export interface RegisterPayload {
  email?: string;
  phone_number?: string;
  password: string;
  full_name: string;
  gender: string;
  role?: string;
  country?: string;
  preferred_language?: string;
}

export interface LoginPayload {
  email?: string;
  phone_number?: string;
  password: string;
}

export const AuthService = {
  register: (body: RegisterPayload) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: LoginPayload) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<any>('/auth/me'),

  getToken: getAuthToken,
  setToken: setAuthToken,
  removeToken: removeAuthToken,
};
