import { NearbyTeacher, request } from '../api/client';

export interface NearbyQueryParams {
  latitude: number;
  longitude: number;
  radius?: number;
  subject?: string;
  teaching_format?: string;
  location_type?: string;
}

export interface NearbyTeachersResponse {
  data: NearbyTeacher[];
  count: number;
  radius_km: number;
  center: { latitude: number; longitude: number };
}

export interface TeacherLocationPayload {
  location_name: string;
  location_type: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

export const TeachersService = {
  searchTeachers: (subject = '', language = '') =>
    request<any[]>(`/teachers?subject=${encodeURIComponent(subject)}&language=${encodeURIComponent(language)}`),

  getTeacher: (id: string) => request<any>(`/teachers/${id}`),

  getNearbyTeachers: (params: NearbyQueryParams) => {
    const query = new URLSearchParams();
    query.set('latitude', params.latitude.toString());
    query.set('longitude', params.longitude.toString());
    query.set('radius', (params.radius || 10).toString());
    if (params.subject) query.set('subject', params.subject);
    if (params.teaching_format) query.set('teaching_format', params.teaching_format);
    if (params.location_type) query.set('location_type', params.location_type);

    return request<NearbyTeachersResponse>(`/teachers/nearby?${query.toString()}`);
  },

  addTeacherLocation: (body: TeacherLocationPayload) =>
    request<any>('/teachers/locations', { method: 'POST', body: JSON.stringify(body) }),

  getMyTeacherLocations: () => request<any[]>('/teachers/locations'),

  deleteTeacherLocation: (id: string) =>
    request<any>(`/teachers/locations/${id}`, { method: 'DELETE' }),
};

