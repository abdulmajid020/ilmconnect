export type UserRole = "LEARNER" | "TEACHER" | "ADMIN";

export type TeacherStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface User {
  id: string;
  email?: string;
  phone_number?: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
  gender: string;
  country: string;
  preferred_language: string;
  roles: UserRole[];
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  status: TeacherStatus;
  bio?: string;
  islamic_education: string;
  years_experience: number;
  expertise_areas: string[];
  languages_spoken: string[];
  teaching_format: string;
  is_accepting_students: boolean;
  review_notes?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  avatar_url?: string;
  gender?: string;
  credentials?: TeacherCredential[];
}

export interface TeacherCredential {
  id: string;
  teacher_profile_id: string;
  document_title: string;
  document_url: string;
  document_type: string;
  uploaded_at: string;
}

export interface MadrassaClass {
  id: string;
  teacher_profile_id: string;
  title: string;
  description: string;
  subject: string;
  language: string;
  level: string;
  capacity: number;
  visibility: string;
  enrollment_mode: string;
  status: string;
  recurring_schedule?: string;
  default_meet_link?: string;
  created_at: string;
  updated_at: string;
  enrolled_count?: number;
  waitlisted_count?: number;
  teacher_name?: string;
}

export interface RosterStudentItem {
  enrollment_id: string;
  learner_user_id: string;
  // The backend serializes user full_name here; accept both field names for compatibility
  full_name: string;
  email?: string;
  phone_number?: string;
  gender: string;
  status: "ENROLLED" | "WAITLISTED";
  enrolled_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  title: string;
  session_date: string;
  duration_minutes: number;
  meet_link?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LearningRequest {
  id: string;
  learner_id: string;
  teacher_profile_id: string;
  subject: string;
  learner_message?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  decline_reason?: string;
  meeting_schedule?: string;
  google_meet_link?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  learner_name?: string;
  teacher_name?: string;
}

export interface Question {
  id: string;
  author_id: string;
  subject: string;
  title: string;
  content: string;
  scope: "COMMUNITY" | "PRIVATE_SHEIKH";
  is_anonymous: boolean;
  target_teacher_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  teacher_profile_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  teacher_name?: string;
}
