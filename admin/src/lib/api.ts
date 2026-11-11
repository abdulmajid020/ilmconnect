import {
  User,
  TeacherProfile,
  MadrassaClass,
  RosterStudentItem,
  ClassSession,
  LearningRequest,
  Question,
  Answer,
  TeacherStatus,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("ilm_admin_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("ilm_admin_token", token);
      } else {
        localStorage.removeItem("ilm_admin_token");
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== "undefined" && !this.token) {
      this.token = localStorage.getItem("ilm_admin_token");
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorBody.error || `HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      // Re-throw so callers know API failed, but UI layer can handle fallback if wanted
      throw err;
    }
  }

  // --- Auth ---
  async login(emailOrPhone: string, password: string): Promise<{ token: string; user: User }> {
    return this.request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: emailOrPhone, password }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  // --- Admin Verification ---
  async getPendingTeachers(): Promise<TeacherProfile[]> {
    return this.request<TeacherProfile[]>("/admin/teachers/pending");
  }

  async reviewTeacher(
    teacherId: string,
    status: TeacherStatus,
    reviewNotes?: string
  ): Promise<{ message: string; status: string }> {
    return this.request<{ message: string; status: string }>(
      `/admin/teachers/${teacherId}/review`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, review_notes: reviewNotes }),
      }
    );
  }

  // --- Madrassa Classes ---
  async getClasses(): Promise<MadrassaClass[]> {
    return this.request<MadrassaClass[]>("/classes");
  }

  async getTeacherClasses(): Promise<MadrassaClass[]> {
    return this.request<MadrassaClass[]>("/teachers/my-classes");
  }

  async getClassDetails(classId: string): Promise<MadrassaClass> {
    return this.request<MadrassaClass>(`/classes/${classId}`);
  }

  async createClass(payload: {
    title: string;
    description: string;
    subject: string;
    language: string;
    level: string;
    capacity: number;
    visibility?: string;
    enrollment_mode?: string;
    recurring_schedule?: string;
    default_meet_link?: string;
  }): Promise<MadrassaClass> {
    return this.request<MadrassaClass>("/classes", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        capacity: Math.min(payload.capacity || 20, 20), // strictly enforce 20
        visibility: payload.visibility || "PUBLIC",
        enrollment_mode: payload.enrollment_mode || "OPEN",
      }),
    });
  }

  async getClassRoster(classId: string): Promise<RosterStudentItem[]> {
    return this.request<RosterStudentItem[]>(`/classes/${classId}/roster`);
  }

  async createSession(
    classId: string,
    payload: {
      title: string;
      session_date: string;
      duration_minutes: number;
      meet_link?: string;
      notes?: string;
    }
  ): Promise<ClassSession> {
    return this.request<ClassSession>(`/classes/${classId}/sessions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getClassSessions(classId: string): Promise<ClassSession[]> {
    return this.request<ClassSession[]>(`/classes/${classId}/sessions`);
  }

  // --- 1-on-1 Requests ---
  async getReceivedRequests(): Promise<LearningRequest[]> {
    return this.request<LearningRequest[]>("/requests/received");
  }

  async respondToRequest(
    requestId: string,
    payload: {
      status: "ACCEPTED" | "DECLINED";
      decline_reason?: string;
      meeting_schedule?: string;
      google_meet_link?: string;
    }
  ): Promise<{ message: string; status: string }> {
    return this.request<{ message: string; status: string }>(
      `/requests/${requestId}/respond`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
  }

  // --- Questions & Answers ---
  async getQuestions(subject?: string): Promise<Question[]> {
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
    return this.request<Question[]>(`/questions${query}`);
  }

  async postAnswer(
    questionId: string,
    content: string
  ): Promise<Answer> {
    return this.request<Answer>(`/questions/${questionId}/answers`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  // --- File Upload ---
  async uploadFile(file: File): Promise<{ file_url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }
    return res.json();
  }
}

export const api = new ApiClient();
