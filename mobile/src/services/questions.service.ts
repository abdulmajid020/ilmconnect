import { request } from '../api/client';

export interface CreateQuestionPayload {
  subject: string;
  title: string;
  content: string;
  scope?: string;
  is_anonymous?: boolean;
}

export const QuestionsService = {
  listQuestions: (subject = '') =>
    request<any[]>(`/questions?subject=${encodeURIComponent(subject)}`),

  createQuestion: (body: CreateQuestionPayload) =>
    request<any>('/questions', { method: 'POST', body: JSON.stringify(body) }),

  answerQuestion: (questionId: string, content: string) =>
    request<any>(`/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getAnswers: (id: string) => request<any[]>(`/questions/${id}/answers`),
};

