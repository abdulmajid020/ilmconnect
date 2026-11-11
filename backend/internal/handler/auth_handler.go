package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
	"zoq/backend/internal/config"
	"zoq/backend/internal/domain"
	"zoq/backend/internal/middleware"
	"zoq/backend/internal/repository"
)

type AuthHandler struct {
	userRepo *repository.UserRepository
	cfg      *config.Config
}

func NewAuthHandler(userRepo *repository.UserRepository, cfg *config.Config) *AuthHandler {
	return &AuthHandler{userRepo: userRepo, cfg: cfg}
}

type RegisterRequest struct {
	FullName          string   `json:"full_name"`
	Email             *string  `json:"email"`
	PhoneNumber       *string  `json:"phone_number"`
	Password          string   `json:"password"`
	Gender            string   `json:"gender"`
	Country           string   `json:"country"`
	PreferredLanguage string   `json:"preferred_language"`
	Role              string   `json:"role"` // Optional initial role
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *domain.User `json:"user"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.FullName == "" || req.Password == "" || req.Gender == "" {
		http.Error(w, `{"error":"full_name, password, and gender are required"}`, http.StatusBadRequest)
		return
	}
	if req.Email == nil && req.PhoneNumber == nil {
		http.Error(w, `{"error":"either email or phone_number must be provided"}`, http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error":"failed to hash password"}`, http.StatusInternalServerError)
		return
	}

	user := &domain.User{
		FullName:          req.FullName,
		Email:             req.Email,
		PhoneNumber:       req.PhoneNumber,
		PasswordHash:      string(hashedPassword),
		Gender:            req.Gender,
		Country:           req.Country,
		PreferredLanguage: req.PreferredLanguage,
		Roles:             []domain.UserRole{domain.RoleLearner},
	}

	if user.Country == "" {
		user.Country = "Ghana"
	}
	if user.PreferredLanguage == "" {
		user.PreferredLanguage = "English"
	}
	if req.Role == "TEACHER" {
		user.Roles = append(user.Roles, domain.RoleTeacher)
	}

	if err := h.userRepo.Create(r.Context(), user); err != nil {
		log.Printf("User Create error: %v", err)
		http.Error(w, fmt.Sprintf(`{"error":"failed to create user: %v"}`, err), http.StatusInternalServerError)
		return
	}

	token, err := middleware.GenerateToken(user, h.cfg.JWTSecret, 7*24*time.Hour)
	if err != nil {
		http.Error(w, `{"error":"failed to generate authentication token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(AuthResponse{Token: token, User: user})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		log.Printf("GetByEmail error: %v", err)
		http.Error(w, fmt.Sprintf(`{"error":"login error: %v"}`, err), http.StatusUnauthorized)
		return
	}
	if user == nil {
		http.Error(w, `{"error":"invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, `{"error":"invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	token, err := middleware.GenerateToken(user, h.cfg.JWTSecret, 7*24*time.Hour)
	if err != nil {
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{Token: token, User: user})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), claims.UserID)
	if err != nil || user == nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

