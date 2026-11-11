import { request } from '../api/client';

export interface CreateClassPayload {
  title: string;
  subject: string;
  description?: string;
  recurring_schedule: string;
  default_meet_link: string;
  capacity?: number;
  level?: string;
  visibility?: string;
  enrollment_mode?: string;
}

export const ClassesService = {
  listClasses: (subject = '', level = '') =>
    request<any[]>(`/classes?subject=${encodeURIComponent(subject)}&level=${encodeURIComponent(level)}`),

  getClass: (id: string) => request<any>(`/classes/${id}`),

  enrollClass: (id: string) =>
    request<{ status: string; message: string }>(`/classes/${id}/enroll`, { method: 'POST' }),

  getClassSessions: (id: string) => request<any[]>(`/classes/${id}/sessions`),

  getTeacherMyClasses: () => request<any[]>('/teachers/my-classes'),

  createClass: (body: CreateClassPayload) =>
    request<any>('/classes', { method: 'POST', body: JSON.stringify(body) }),

  getClassRoster: (id: string) => request<any[]>(`/classes/${id}/roster`),

  createSession: (classId: string, body: any) =>
    request<any>(`/classes/${classId}/sessions`, { method: 'POST', body: JSON.stringify(body) }),
};

