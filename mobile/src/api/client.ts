import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

declare const process: { env?: Record<string, string | undefined> };

// Dynamically determine the backend host.
// Priority:
//   1. EXPO_PUBLIC_API_URL (set in .env — production Render URL or local override)
//   2. LAN IP derived from Metro's hostUri (only used when running local dev without .env)
const hostUri = Constants.expoConfig?.hostUri;
const rawHost = hostUri ? hostUri.split(':')[0] : null;
const isLanIpv4 = rawHost && /^(\d{1,3}\.){3}\d{1,3}$/.test(rawHost);

const configuredUrl = process.env?.EXPO_PUBLIC_API_URL;

const HOST =
  configuredUrl ||
  (isLanIpv4 ? `http://${rawHost}:8080` : null) ||
  'http://localhost:8080';

export const API_BASE_URL = HOST.endsWith('/api/v1') ? HOST : `${HOST}/api/v1`;

const TOKEN_KEY = 'zoq_auth_token';

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeAuthToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 15-second request timeout to handle cold database queries
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out reaching backend at ${API_BASE_URL}. Is the Go server running?`);
    }
    if (err.message && (err.message.includes('Network request failed') || err.message.includes('ConnectException') || err.message.includes('Failed to connect'))) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the Go server is running.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface NearbyTeacher {
  location_id: string;
  teacher_profile_id: string;
  teacher_user_id: string;
  teacher_name: string;
  avatar_url?: string;
  gender: string;
  islamic_education: string;
  years_experience: number;
  expertise_areas: string[];
  languages_spoken: string[];
  teaching_format: string;
  is_accepting_students: boolean;
  location_name: string;
  address: string;
  city: string;
  location_type: string;
  latitude: number;
  longitude: number;
  distance_km: number;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<any>('/auth/me'),

  // Learner Hub
  saveProfile: (body: any) => request<any>('/learners/profile', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request<any>('/learners/profile'),
  getMyClasses: () => request<any[]>('/learners/classes'),
  getMyTeachers: () => request<any[]>('/learners/teachers'),

  // Sheikhs & 1-on-1
  searchTeachers: (subject = '', language = '') => 
    request<any[]>(`/teachers?subject=${encodeURIComponent(subject)}&language=${encodeURIComponent(language)}`),
  getTeacher: (id: string) => request<any>(`/teachers/${id}`),
  sendRequest: (body: any) => request<any>('/requests', { method: 'POST', body: JSON.stringify(body) }),

  // Group Madrassa
  listClasses: (subject = '', level = '') => 
    request<any[]>(`/classes?subject=${encodeURIComponent(subject)}&level=${encodeURIComponent(level)}`),
  getClass: (id: string) => request<any>(`/classes/${id}`),
  enrollClass: (id: string) => request<any>(`/classes/${id}/enroll`, { method: 'POST' }),
  getClassSessions: (id: string) => request<any[]>(`/classes/${id}/sessions`),

  // Teacher Hub & Management
  getTeacherMyClasses: () => request<any[]>('/teachers/my-classes'),
  createClass: (body: any) => request<any>('/classes', { method: 'POST', body: JSON.stringify(body) }),
  getClassRoster: (id: string) => request<any[]>(`/classes/${id}/roster`),
  createSession: (classId: string, body: any) => request<any>(`/classes/${classId}/sessions`, { method: 'POST', body: JSON.stringify(body) }),
  getReceivedRequests: () => request<any[]>('/requests/received'),
  respondToRequest: (id: string, body: { status: 'ACCEPTED' | 'DECLINED'; meeting_schedule?: string; google_meet_link?: string; decline_reason?: string }) => 
    request<any>(`/requests/${id}/respond`, { method: 'PATCH', body: JSON.stringify(body) }),
  answerQuestion: (questionId: string, content: string) => 
    request<any>(`/questions/${questionId}/answers`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Q&A Board
  listQuestions: (subject = '') => request<any[]>(`/questions?subject=${encodeURIComponent(subject)}`),
  createQuestion: (body: any) => request<any>('/questions', { method: 'POST', body: JSON.stringify(body) }),
  getAnswers: (id: string) => request<any[]>(`/questions/${id}/answers`),

  // PostGIS Spatial Discovery & Nearby Teachers
  getNearbyTeachers: (params: {
    latitude: number;
    longitude: number;
    radius?: number;
    subject?: string;
    teaching_format?: string;
    location_type?: string;
  }) => {
    const query = new URLSearchParams();
    query.set('latitude', params.latitude.toString());
    query.set('longitude', params.longitude.toString());
    query.set('radius', (params.radius || 10).toString());
    if (params.subject) query.set('subject', params.subject);
    if (params.teaching_format) query.set('teaching_format', params.teaching_format);
    if (params.location_type) query.set('location_type', params.location_type);

    return request<{
      data: NearbyTeacher[];
      count: number;
      radius_km: number;
      center: { latitude: number; longitude: number };
    }>(`/teachers/nearby?${query.toString()}`);
  },
  addTeacherLocation: (body: any) =>
    request<any>('/teachers/locations', { method: 'POST', body: JSON.stringify(body) }),
  getMyTeacherLocations: () => request<any[]>('/teachers/locations'),
  deleteTeacherLocation: (id: string) =>
    request<any>(`/teachers/locations/${id}`, { method: 'DELETE' }),
};

