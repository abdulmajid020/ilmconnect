package handler

import (
	"encoding/json"
	"net/http"

	"zoq/backend/internal/domain"
	"zoq/backend/internal/middleware"
	"zoq/backend/internal/repository"
)

type LearnerHandler struct {
	learnerRepo *repository.LearnerRepository
}

func NewLearnerHandler(learnerRepo *repository.LearnerRepository) *LearnerHandler {
	return &LearnerHandler{learnerRepo: learnerRepo}
}

type UpdateLearnerProfileRequest struct {
	KnowledgeLevel  string   `json:"knowledge_level"`
	LearningGoals   []string `json:"learning_goals"`
	PreferredFormat string   `json:"preferred_format"`
}

func (h *LearnerHandler) SaveProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req UpdateLearnerProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	profile := &domain.LearnerProfile{
		UserID:          claims.UserID,
		KnowledgeLevel:  req.KnowledgeLevel,
		LearningGoals:   req.LearningGoals,
		PreferredFormat: req.PreferredFormat,
	}
	if profile.KnowledgeLevel == "" {
		profile.KnowledgeLevel = "BEGINNER"
	}

	if err := h.learnerRepo.Upsert(r.Context(), profile); err != nil {
		http.Error(w, `{"error":"failed to save profile"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func (h *LearnerHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	profile, err := h.learnerRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, `{"error":"failed to get profile"}`, http.StatusInternalServerError)
		return
	}
	if profile == nil {
		http.Error(w, `{"error":"profile not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func (h *LearnerHandler) GetMyClasses(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	profile, err := h.learnerRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || profile == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]domain.EnrolledClassItem{})
		return
	}

	classes, err := h.learnerRepo.GetMyEnrolledClasses(r.Context(), profile.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch enrolled classes"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(classes)
}

func (h *LearnerHandler) GetMyTeachers(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	profile, err := h.learnerRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || profile == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]domain.ActiveTeacherItem{})
		return
	}

	teachers, err := h.learnerRepo.GetMyActiveTeachers(r.Context(), profile.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch active teachers"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(teachers)
}
