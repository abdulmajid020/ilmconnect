import { request } from '../api/client';

export const LearnersService = {
  saveProfile: (body: any) =>
    request<any>('/learners/profile', { method: 'POST', body: JSON.stringify(body) }),

  getProfile: () => request<any>('/learners/profile'),

  getMyClasses: () => request<any[]>('/learners/classes'),

  getMyTeachers: () => request<any[]>('/learners/teachers'),
};

