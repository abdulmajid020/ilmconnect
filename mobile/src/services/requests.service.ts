import { request } from '../api/client';

export interface SendRequestPayload {
  teacher_profile_id: string;
  subject: string;
  learner_message?: string;
}

export interface RespondRequestPayload {
  status: 'ACCEPTED' | 'DECLINED';
  meeting_schedule?: string;
  google_meet_link?: string;
  decline_reason?: string;
}

export const RequestsService = {
  sendRequest: (body: SendRequestPayload) =>
    request<any>('/requests', { method: 'POST', body: JSON.stringify(body) }),

  getReceivedRequests: () => request<any[]>('/requests/received'),

  respondToRequest: (id: string, body: RespondRequestPayload) =>
    request<any>(`/requests/${id}/respond`, { method: 'PATCH', body: JSON.stringify(body) }),
};
