package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"zoq/backend/internal/domain"
	"zoq/backend/internal/repository"
)

type AdminHandler struct {
	teacherRepo *repository.TeacherRepository
}

func NewAdminHandler(teacherRepo *repository.TeacherRepository) *AdminHandler {
	return &AdminHandler{teacherRepo: teacherRepo}
}

type ReviewTeacherPayload struct {
	Status      domain.TeacherStatus `json:"status"` // APPROVED, REJECTED, MORE_INFO_REQUIRED, SUSPENDED
	ReviewNotes *string              `json:"review_notes"`
}

func (h *AdminHandler) ListPendingTeachers(w http.ResponseWriter, r *http.Request) {
	teachers, err := h.teacherRepo.GetPendingApplications(r.Context())
	if err != nil {
		http.Error(w, `{"error":"failed to fetch pending teacher applications"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(teachers)
}

func (h *AdminHandler) ReviewTeacher(w http.ResponseWriter, r *http.Request) {
	teacherIDStr := chi.URLParam(r, "id")
	teacherID, err := uuid.Parse(teacherIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid teacher id"}`, http.StatusBadRequest)
		return
	}

	var payload ReviewTeacherPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if payload.Status == "" {
		http.Error(w, `{"error":"status is required"}`, http.StatusBadRequest)
		return
	}

	if err := h.teacherRepo.UpdateStatus(r.Context(), teacherID, payload.Status, payload.ReviewNotes); err != nil {
		http.Error(w, `{"error":"failed to update teacher status: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "teacher status updated successfully",
		"status":  payload.Status,
	})
}

