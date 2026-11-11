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

type QuestionHandler struct {
	questionRepo *repository.QuestionRepository
	teacherRepo  *repository.TeacherRepository
}

func NewQuestionHandler(questionRepo *repository.QuestionRepository, teacherRepo *repository.TeacherRepository) *QuestionHandler {
	return &QuestionHandler{questionRepo: questionRepo, teacherRepo: teacherRepo}
}

type CreateQuestionRequest struct {
	Subject         string     `json:"subject"`
	Title           string     `json:"title"`
	Content         string     `json:"content"`
	Scope           string     `json:"scope"`
	IsAnonymous     bool       `json:"is_anonymous"`
	TargetTeacherID *uuid.UUID `json:"target_teacher_id"`
}

type CreateAnswerRequest struct {
	Content string `json:"content"`
}

func (h *QuestionHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req CreateQuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Subject == "" || req.Title == "" || req.Content == "" {
		http.Error(w, `{"error":"subject, title, and content are required"}`, http.StatusBadRequest)
		return
	}
	if req.Scope == "" {
		req.Scope = "COMMUNITY"
	}

	q := &domain.Question{
		AuthorID:        claims.UserID,
		Subject:         req.Subject,
		Title:           req.Title,
		Content:         req.Content,
		Scope:           req.Scope,
		IsAnonymous:     req.IsAnonymous,
		TargetTeacherID: req.TargetTeacherID,
	}

	if err := h.questionRepo.Create(r.Context(), q); err != nil {
		http.Error(w, `{"error":"failed to create question"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(q)
}

func (h *QuestionHandler) ListCommunity(w http.ResponseWriter, r *http.Request) {
	subject := r.URL.Query().Get("subject")

	questions, err := h.questionRepo.ListCommunity(r.Context(), subject)
	if err != nil {
		http.Error(w, `{"error":"failed to list questions"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

func (h *QuestionHandler) Answer(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Verify user is an approved teacher
	teacher, err := h.teacherRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || teacher == nil || teacher.Status != domain.TeacherStatusApproved {
		http.Error(w, `{"error":"only approved teachers can answer questions"}`, http.StatusForbidden)
		return
	}

	questionIDStr := chi.URLParam(r, "id")
	questionID, err := uuid.Parse(questionIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid question id"}`, http.StatusBadRequest)
		return
	}

	var req CreateAnswerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, `{"error":"answer content cannot be empty"}`, http.StatusBadRequest)
		return
	}

	a := &domain.Answer{
		QuestionID:       questionID,
		TeacherProfileID: teacher.ID,
		Content:          req.Content,
		IsApproved:       true,
	}

	if err := h.questionRepo.AddAnswer(r.Context(), a); err != nil {
		http.Error(w, `{"error":"failed to post answer"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(a)
}

func (h *QuestionHandler) GetAnswers(w http.ResponseWriter, r *http.Request) {
	questionIDStr := chi.URLParam(r, "id")
	questionID, err := uuid.Parse(questionIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid question id"}`, http.StatusBadRequest)
		return
	}

	answers, err := h.questionRepo.GetAnswersByQuestionID(r.Context(), questionID)
	if err != nil {
		http.Error(w, `{"error":"failed to get answers"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(answers)
}

