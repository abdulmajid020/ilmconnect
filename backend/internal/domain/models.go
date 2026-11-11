package domain

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleLearner UserRole = "LEARNER"
	RoleTeacher UserRole = "TEACHER"
	RoleAdmin   UserRole = "ADMIN"
)

type User struct {
	ID                uuid.UUID  `json:"id"`
	Email             *string    `json:"email"`
	PhoneNumber       *string    `json:"phone_number"`
	FullName          string     `json:"full_name"`
	PasswordHash      string     `json:"-"`
	AvatarURL         *string    `json:"avatar_url"`
	Gender            string     `json:"gender"`
	Country           string     `json:"country"`
	PreferredLanguage string     `json:"preferred_language"`
	Roles             []UserRole `json:"roles"`
	IsActive          bool       `json:"is_active"`
	IsSuspended       bool       `json:"is_suspended"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type LearnerProfile struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	KnowledgeLevel  string    `json:"knowledge_level"`
	LearningGoals   []string  `json:"learning_goals"`
	PreferredFormat string    `json:"preferred_format"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type TeacherStatus string

const (
	TeacherStatusDraft       TeacherStatus = "DRAFT"
	TeacherStatusSubmitted   TeacherStatus = "SUBMITTED"
	TeacherStatusUnderReview TeacherStatus = "UNDER_REVIEW"
	TeacherStatusApproved    TeacherStatus = "APPROVED"
	TeacherStatusRejected    TeacherStatus = "REJECTED"
	TeacherStatusSuspended   TeacherStatus = "SUSPENDED"
)

type TeacherProfile struct {
	ID                  uuid.UUID     `json:"id"`
	UserID              uuid.UUID     `json:"user_id"`
	Status              TeacherStatus `json:"status"`
	Bio                 *string       `json:"bio"`
	IslamicEducation    string        `json:"islamic_education"`
	YearsExperience     int           `json:"years_experience"`
	ExpertiseAreas      []string      `json:"expertise_areas"`
	LanguagesSpoken     []string      `json:"languages_spoken"`
	TeachingFormat      string        `json:"teaching_format"`
	IsAcceptingStudents bool          `json:"is_accepting_students"`
	ReviewNotes         *string       `json:"review_notes,omitempty"`
	VerifiedAt          *time.Time    `json:"verified_at,omitempty"`
	CreatedAt           time.Time     `json:"created_at"`
	UpdatedAt           time.Time     `json:"updated_at"`

	// Populated for discovery views
	FullName  string  `json:"full_name,omitempty"`
	AvatarURL *string `json:"avatar_url,omitempty"`
	Gender    string  `json:"gender,omitempty"`
}

type TeacherCredential struct {
	ID               uuid.UUID `json:"id"`
	TeacherProfileID uuid.UUID `json:"teacher_profile_id"`
	DocumentTitle    string    `json:"document_title"`
	DocumentURL      string    `json:"document_url"`
	DocumentType     string    `json:"document_type"`
	UploadedAt       time.Time `json:"uploaded_at"`
}

type TeacherLocation struct {
	ID               uuid.UUID `json:"id"`
	TeacherProfileID uuid.UUID `json:"teacher_profile_id"`
	LocationName     string    `json:"location_name"`
	Address          string    `json:"address"`
	City             string    `json:"city"`
	Region           string    `json:"region"`
	LocationType     string    `json:"location_type"` // MADRASSA, MOSQUE, ISLAMIC_CENTER, HOME_STUDY
	Latitude         float64   `json:"latitude"`
	Longitude        float64   `json:"longitude"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type NearbyTeacherResult struct {
	LocationID          uuid.UUID `json:"location_id"`
	TeacherProfileID    uuid.UUID `json:"teacher_profile_id"`
	TeacherUserID       uuid.UUID `json:"teacher_user_id"`
	TeacherName         string    `json:"teacher_name"`
	AvatarURL           *string   `json:"avatar_url,omitempty"`
	Gender              string    `json:"gender"`
	IslamicEducation    string    `json:"islamic_education"`
	YearsExperience     int       `json:"years_experience"`
	ExpertiseAreas      []string  `json:"expertise_areas"`
	LanguagesSpoken     []string  `json:"languages_spoken"`
	TeachingFormat      string    `json:"teaching_format"`
	IsAcceptingStudents bool      `json:"is_accepting_students"`
	LocationName        string    `json:"location_name"`
	Address             string    `json:"address"`
	City                string    `json:"city"`
	LocationType        string    `json:"location_type"`
	Latitude            float64   `json:"latitude"`
	Longitude           float64   `json:"longitude"`
	DistanceKm          float64   `json:"distance_km"`
}

type LearningRequest struct {
	ID               uuid.UUID `json:"id"`
	LearnerID        uuid.UUID `json:"learner_id"`
	TeacherProfileID uuid.UUID `json:"teacher_profile_id"`
	Subject          string    `json:"subject"`
	LearnerMessage   *string   `json:"learner_message"`
	Status           string    `json:"status"`
	DeclineReason    *string   `json:"decline_reason,omitempty"`
	ExpiresAt        time.Time `json:"expires_at"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	LearnerName  string `json:"learner_name,omitempty"`
	TeacherName  string `json:"teacher_name,omitempty"`
}

type TeacherStudentRelationship struct {
	ID               uuid.UUID  `json:"id"`
	LearnerProfileID uuid.UUID  `json:"learner_profile_id"`
	TeacherProfileID uuid.UUID  `json:"teacher_profile_id"`
	Subject          string     `json:"subject"`
	Status           string     `json:"status"` // ACTIVE, PAUSED, TERMINATED
	MeetingSchedule  *string    `json:"meeting_schedule"`
	GoogleMeetLink   *string    `json:"google_meet_link"`
	StartedAt        time.Time  `json:"started_at"`
	EndedAt          *time.Time `json:"ended_at,omitempty"`
}

type ActiveTeacherItem struct {
	RelationshipID   uuid.UUID `json:"relationship_id"`
	TeacherProfileID uuid.UUID `json:"teacher_profile_id"`
	TeacherName      string    `json:"teacher_name"`
	Subject          string    `json:"subject"`
	MeetingSchedule  *string   `json:"meeting_schedule"`
	GoogleMeetLink   *string   `json:"google_meet_link"`
	Status           string    `json:"status"`
	AvatarURL        *string   `json:"avatar_url"`
}

type MadrassaClass struct {
	ID                uuid.UUID `json:"id"`
	TeacherProfileID  uuid.UUID `json:"teacher_profile_id"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	Subject           string    `json:"subject"`
	Language          string    `json:"language"`
	Level             string    `json:"level"`
	Capacity          int       `json:"capacity"`
	Visibility        string    `json:"visibility"`
	EnrollmentMode    string    `json:"enrollment_mode"`
	Status            string    `json:"status"`
	RecurringSchedule *string   `json:"recurring_schedule"`
	DefaultMeetLink   *string   `json:"default_meet_link"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	EnrolledCount int    `json:"enrolled_count,omitempty"`
	TeacherName   string `json:"teacher_name,omitempty"`
	IsFree        bool   `json:"is_free"`
}

type EnrolledClassItem struct {
	ClassID           uuid.UUID `json:"class_id"`
	Title             string    `json:"title"`
	Subject           string    `json:"subject"`
	TeacherName       string    `json:"teacher_name"`
	EnrollmentStatus  string    `json:"enrollment_status"` // ENROLLED or WAITLISTED
	RecurringSchedule *string   `json:"recurring_schedule"`
	DefaultMeetLink   *string   `json:"default_meet_link"`
	Capacity          int       `json:"capacity"`
	EnrolledAt        time.Time `json:"enrolled_at"`
}

type RosterStudentItem struct {
	EnrollmentID   uuid.UUID `json:"enrollment_id"`
	LearnerUserID  uuid.UUID `json:"learner_user_id"`
	FullName       string    `json:"full_name"`
	Email          *string   `json:"email"`
	PhoneNumber    *string   `json:"phone_number"`
	Gender         string    `json:"gender"`
	Status         string    `json:"status"` // ENROLLED or WAITLISTED
	EnrolledAt     time.Time `json:"enrolled_at"`
}

type ClassEnrollment struct {
	ID               uuid.UUID `json:"id"`
	ClassID          uuid.UUID `json:"class_id"`
	LearnerProfileID uuid.UUID `json:"learner_profile_id"`
	Status           string    `json:"status"` // ENROLLED or WAITLISTED
	EnrolledAt       time.Time `json:"enrolled_at"`
}

type ClassSession struct {
	ID              uuid.UUID `json:"id"`
	ClassID         uuid.UUID `json:"class_id"`
	Title           string    `json:"title"`
	SessionDate     time.Time `json:"session_date"`
	DurationMinutes int       `json:"duration_minutes"`
	MeetLink        *string   `json:"meet_link"`
	Notes           *string   `json:"notes"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Question struct {
	ID              uuid.UUID  `json:"id"`
	AuthorID        uuid.UUID  `json:"author_id"`
	Subject         string     `json:"subject"`
	Title           string     `json:"title"`
	Content         string     `json:"content"`
	Scope           string     `json:"scope"` // COMMUNITY or PRIVATE_SHEIKH
	IsAnonymous     bool       `json:"is_anonymous"`
	TargetTeacherID *uuid.UUID `json:"target_teacher_id,omitempty"`
	Status          string     `json:"status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	AuthorName string   `json:"author_name,omitempty"`
	Answers    []Answer `json:"answers,omitempty"`
}

type Answer struct {
	ID               uuid.UUID `json:"id"`
	QuestionID       uuid.UUID `json:"question_id"`
	TeacherProfileID uuid.UUID `json:"teacher_profile_id"`
	Content          string    `json:"content"`
	IsApproved       bool      `json:"is_approved"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	TeacherName string `json:"teacher_name,omitempty"`
}

type Conversation struct {
	ID             uuid.UUID `json:"id"`
	ParticipantOne uuid.UUID `json:"participant_one"`
	ParticipantTwo uuid.UUID `json:"participant_two"`
	Subject        *string   `json:"subject"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ConversationItem struct {
	ID             uuid.UUID `json:"id"`
	OtherUserID    uuid.UUID `json:"other_user_id"`
	OtherUserName  string    `json:"other_user_name"`
	OtherAvatarURL *string   `json:"other_avatar_url"`
	Subject        *string   `json:"subject"`
	LastMessage    *string   `json:"last_message"`
	LastMessageAt  time.Time `json:"last_message_at"`
}

type Message struct {
	ID             uuid.UUID `json:"id"`
	ConversationID uuid.UUID `json:"conversation_id"`
	SenderID       uuid.UUID `json:"sender_id"`
	Content        string    `json:"content"`
	IsRead         bool      `json:"is_read"`
	CreatedAt      time.Time `json:"created_at"`
}
