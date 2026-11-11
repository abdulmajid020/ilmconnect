package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"zoq/backend/internal/domain"
	"zoq/backend/internal/middleware"
	"zoq/backend/internal/repository"
)

type MadrassaHandler struct {
	madrassaRepo *repository.MadrassaRepository
	teacherRepo  *repository.TeacherRepository
	learnerRepo  *repository.LearnerRepository
}

func NewMadrassaHandler(madrassaRepo *repository.MadrassaRepository, teacherRepo *repository.TeacherRepository, learnerRepo *repository.LearnerRepository) *MadrassaHandler {
	return &MadrassaHandler{madrassaRepo: madrassaRepo, teacherRepo: teacherRepo, learnerRepo: learnerRepo}
}

type CreateClassRequest struct {
	Title             string  `json:"title"`
	Description       string  `json:"description"`
	Subject           string  `json:"subject"`
	Language          string  `json:"language"`
	Level             string  `json:"level"`
	Capacity          int     `json:"capacity"`
	Visibility        string  `json:"visibility"`
	EnrollmentMode    string  `json:"enrollment_mode"`
	RecurringSchedule *string `json:"recurring_schedule"`
	DefaultMeetLink   *string `json:"default_meet_link"`
}

type CreateSessionRequest struct {
	Title           string    `json:"title"`
	SessionDate     time.Time `json:"session_date"`
	DurationMinutes int       `json:"duration_minutes"`
	MeetLink        *string   `json:"meet_link"`
	Notes           *string   `json:"notes"`
}

func (h *MadrassaHandler) CreateClass(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	teacher, err := h.teacherRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || teacher == nil || teacher.Status != domain.TeacherStatusApproved {
		http.Error(w, `{"error":"only approved teachers can create Madrassa classes"}`, http.StatusForbidden)
		return
	}

	var req CreateClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Title == "" || req.Description == "" || req.Subject == "" {
		http.Error(w, `{"error":"title, description, and subject are required"}`, http.StatusBadRequest)
		return
	}

	capacity := req.Capacity
	if capacity <= 0 {
		capacity = 20 // Default strict limit
	}

	class := &domain.MadrassaClass{
		TeacherProfileID:  teacher.ID,
		Title:             req.Title,
		Description:       req.Description,
		Subject:           req.Subject,
		Language:          req.Language,
		Level:             req.Level,
		Capacity:          capacity,
		Visibility:        req.Visibility,
		EnrollmentMode:    req.EnrollmentMode,
		Status:            "PUBLISHED",
		RecurringSchedule: req.RecurringSchedule,
		DefaultMeetLink:   req.DefaultMeetLink,
	}

	if err := h.madrassaRepo.CreateClass(r.Context(), class); err != nil {
		http.Error(w, `{"error":"failed to create class: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(class)
}

func (h *MadrassaHandler) ListClasses(w http.ResponseWriter, r *http.Request) {
	subject := r.URL.Query().Get("subject")
	level := r.URL.Query().Get("level")

	classes, err := h.madrassaRepo.ListClasses(r.Context(), subject, level)
	if err != nil {
		log.Printf("ListClasses error: %v", err)
		http.Error(w, fmt.Sprintf(`{"error":"failed to list classes: %v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(classes)
}

func (h *MadrassaHandler) GetClass(w http.ResponseWriter, r *http.Request) {
	classIDStr := chi.URLParam(r, "id")
	classID, err := uuid.Parse(classIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid class id"}`, http.StatusBadRequest)
		return
	}

	class, err := h.madrassaRepo.GetClassByID(r.Context(), classID)
	if err != nil || class == nil {
		http.Error(w, `{"error":"class not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(class)
}

func (h *MadrassaHandler) GetTeacherClasses(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	teacher, err := h.teacherRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || teacher == nil {
		http.Error(w, `{"error":"teacher profile not found"}`, http.StatusNotFound)
		return
	}

	classes, err := h.madrassaRepo.GetClassesByTeacher(r.Context(), teacher.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch teacher classes"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(classes)
}

func (h *MadrassaHandler) GetClassRoster(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	teacher, err := h.teacherRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || teacher == nil {
		http.Error(w, `{"error":"teacher profile not found"}`, http.StatusNotFound)
		return
	}

	classIDStr := chi.URLParam(r, "id")
	classID, err := uuid.Parse(classIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid class id"}`, http.StatusBadRequest)
		return
	}

	// Verify teacher owns the class
	class, err := h.madrassaRepo.GetClassByID(r.Context(), classID)
	if err != nil || class == nil {
		http.Error(w, `{"error":"class not found"}`, http.StatusNotFound)
		return
	}
	if class.TeacherProfileID != teacher.ID {
		http.Error(w, `{"error":"unauthorized: you do not own this class"}`, http.StatusForbidden)
		return
	}

	roster, err := h.madrassaRepo.GetClassRoster(r.Context(), classID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch roster"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roster)
}

// Enroll handles atomic capacity-controlled enrollment
func (h *MadrassaHandler) Enroll(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	classIDStr := chi.URLParam(r, "id")
	classID, err := uuid.Parse(classIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid class id"}`, http.StatusBadRequest)
		return
	}

	// Ensure learner profile exists
	learner, err := h.learnerRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, `{"error":"database error"}`, http.StatusInternalServerError)
		return
	}
	if learner == nil {
		learner = &domain.LearnerProfile{
			UserID:         claims.UserID,
			KnowledgeLevel: "BEGINNER",
		}
		if err := h.learnerRepo.Upsert(r.Context(), learner); err != nil {
			http.Error(w, `{"error":"failed to initialize learner profile"}`, http.StatusInternalServerError)
			return
		}
	}

	// Run atomic enrollment transaction with row-level locking
	result, err := h.madrassaRepo.EnrollAtomic(r.Context(), classID, learner.ID)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusConflict)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *MadrassaHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	teacher, err := h.teacherRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || teacher == nil {
		http.Error(w, `{"error":"teacher profile not found"}`, http.StatusNotFound)
		return
	}

	classIDStr := chi.URLParam(r, "id")
	classID, err := uuid.Parse(classIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid class id"}`, http.StatusBadRequest)
		return
	}

	class, err := h.madrassaRepo.GetClassByID(r.Context(), classID)
	if err != nil || class == nil {
		http.Error(w, `{"error":"class not found"}`, http.StatusNotFound)
		return
	}
	if class.TeacherProfileID != teacher.ID {
		http.Error(w, `{"error":"unauthorized: you do not own this class"}`, http.StatusForbidden)
		return
	}

	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Title == "" || req.SessionDate.IsZero() {
		http.Error(w, `{"error":"title and valid session_date are required"}`, http.StatusBadRequest)
		return
	}

	session := &domain.ClassSession{
		ClassID:         classID,
		Title:           req.Title,
		SessionDate:     req.SessionDate,
		DurationMinutes: req.DurationMinutes,
		MeetLink:        req.MeetLink,
		Notes:           req.Notes,
		Status:          "SCHEDULED",
	}

	if err := h.madrassaRepo.CreateSession(r.Context(), session); err != nil {
		http.Error(w, `{"error":"failed to create session: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(session)
}

func (h *MadrassaHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	classIDStr := chi.URLParam(r, "id")
	classID, err := uuid.Parse(classIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid class id"}`, http.StatusBadRequest)
		return
	}

	sessions, err := h.madrassaRepo.ListSessions(r.Context(), classID)
	if err != nil {
		http.Error(w, `{"error":"failed to list sessions"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}
