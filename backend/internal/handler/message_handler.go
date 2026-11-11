package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"zoq/backend/internal/middleware"
	"zoq/backend/internal/repository"
)

type MessageHandler struct {
	messageRepo *repository.MessageRepository
}

func NewMessageHandler(messageRepo *repository.MessageRepository) *MessageHandler {
	return &MessageHandler{messageRepo: messageRepo}
}

type StartConversationRequest struct {
	RecipientID uuid.UUID `json:"recipient_id"`
	Subject     *string   `json:"subject"`
}

type SendMessageRequest struct {
	Content string `json:"content"`
}

func (h *MessageHandler) StartOrGetConversation(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req StartConversationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.RecipientID == uuid.Nil || req.RecipientID == claims.UserID {
		http.Error(w, `{"error":"valid recipient_id is required"}`, http.StatusBadRequest)
		return
	}

	conv, err := h.messageRepo.GetOrCreateConversation(r.Context(), claims.UserID, req.RecipientID, req.Subject)
	if err != nil {
		http.Error(w, `{"error":"failed to create conversation: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conv)
}

func (h *MessageHandler) ListConversations(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	convs, err := h.messageRepo.ListUserConversations(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, `{"error":"failed to list conversations"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(convs)
}

func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	convIDStr := chi.URLParam(r, "id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid conversation id"}`, http.StatusBadRequest)
		return
	}

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, `{"error":"message content cannot be empty"}`, http.StatusBadRequest)
		return
	}

	msg, err := h.messageRepo.SendMessage(r.Context(), convID, claims.UserID, req.Content)
	if err != nil {
		http.Error(w, `{"error":"failed to send message"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(msg)
}

func (h *MessageHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	convIDStr := chi.URLParam(r, "id")
	convID, err := uuid.Parse(convIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid conversation id"}`, http.StatusBadRequest)
		return
	}

	messages, err := h.messageRepo.ListMessages(r.Context(), convID)
	if err != nil {
		http.Error(w, `{"error":"failed to list messages"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

