package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"zoq/backend/internal/domain"
	"zoq/backend/internal/middleware"
	"zoq/backend/internal/repository"
)

type RequestHandler struct {
	requestRepo *repository.RequestRepository
	teacherRepo *repository.TeacherRepository
}

func NewRequestHandler(requestRepo *repository.RequestRepository, teacherRepo *repository.TeacherRepository) *RequestHandler {
	return &RequestHandler{requestRepo: requestRepo, teacherRepo: teacherRepo}
}

type SendRequestPayload struct {
	TeacherProfileID uuid.UUID `json:"teacher_profile_id"`
	Subject          string    `json:"subject"`
	LearnerMessage   *string   `json:"learner_message"`
}

type RespondPayload struct {
	Status          string  `json:"status"` // ACCEPTED or DECLINED
	DeclineReason   *string `json:"decline_reason,omitempty"`
	MeetingSchedule *string `json:"meeting_schedule,omitempty"`
	GoogleMeetLink  *string `json:"google_meet_link,omitempty"`
}

func (h *RequestHandler) SendRequest(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var payload SendRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if payload.Subject == "" || payload.TeacherProfileID == uuid.Nil {
		http.Error(w, `{"error":"subject and teacher_profile_id are required"}`, http.StatusBadRequest)
		return
	}

	req := &domain.LearningRequest{
		LearnerID:        claims.UserID,
		TeacherProfileID: payload.TeacherProfileID,
		Subject:          payload.Subject,
		LearnerMessage:   payload.LearnerMessage,
	}

	if err := h.requestRepo.CreateRequest(r.Context(), req); err != nil {
		http.Error(w, `{"error":"failed to send learning request: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(req)
}

func (h *RequestHandler) ListReceived(w http.ResponseWriter, r *http.Request) {
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

	requests, err := h.requestRepo.ListByTeacher(r.Context(), teacher.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to list requests"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

func (h *RequestHandler) Respond(w http.ResponseWriter, r *http.Request) {
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

	requestIDStr := chi.URLParam(r, "id")
	requestID, err := uuid.Parse(requestIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid request id"}`, http.StatusBadRequest)
		return
	}

	var payload RespondPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if payload.Status != "ACCEPTED" && payload.Status != "DECLINED" {
		http.Error(w, `{"error":"status must be ACCEPTED or DECLINED"}`, http.StatusBadRequest)
		return
	}

	err = h.requestRepo.RespondAndActivate(
		r.Context(),
		requestID,
		teacher.ID,
		payload.Status,
		payload.DeclineReason,
		payload.MeetingSchedule,
		payload.GoogleMeetLink,
	)
	if err != nil {
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "request responded successfully: " + payload.Status,
	})
}
