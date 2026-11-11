package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"zoq/backend/internal/domain"
	"zoq/backend/internal/middleware"
	"zoq/backend/internal/repository"
)

type TeacherHandler struct {
	teacherRepo *repository.TeacherRepository
	userRepo    *repository.UserRepository
}

func NewTeacherHandler(teacherRepo *repository.TeacherRepository, userRepo *repository.UserRepository) *TeacherHandler {
	return &TeacherHandler{teacherRepo: teacherRepo, userRepo: userRepo}
}

type TeacherApplicationRequest struct {
	Bio                 *string                    `json:"bio"`
	IslamicEducation    string                     `json:"islamic_education"`
	YearsExperience     int                        `json:"years_experience"`
	ExpertiseAreas      []string                   `json:"expertise_areas"`
	LanguagesSpoken     []string                   `json:"languages_spoken"`
	TeachingFormat      string                     `json:"teaching_format"`
	Credentials         []domain.TeacherCredential `json:"credentials"`
}

func (h *TeacherHandler) Apply(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req TeacherApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.IslamicEducation == "" || len(req.ExpertiseAreas) == 0 {
		http.Error(w, `{"error":"islamic_education and expertise_areas are required"}`, http.StatusBadRequest)
		return
	}

	profile := &domain.TeacherProfile{
		UserID:              claims.UserID,
		Bio:                 req.Bio,
		IslamicEducation:    req.IslamicEducation,
		YearsExperience:     req.YearsExperience,
		ExpertiseAreas:      req.ExpertiseAreas,
		LanguagesSpoken:     req.LanguagesSpoken,
		TeachingFormat:      req.TeachingFormat,
		IsAcceptingStudents: true,
	}

	if err := h.teacherRepo.Apply(r.Context(), profile, req.Credentials); err != nil {
		http.Error(w, `{"error":"failed to submit teacher application: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	// Add TEACHER role to user
	_ = h.userRepo.AddRole(r.Context(), claims.UserID, domain.RoleTeacher)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Teacher application submitted for review",
		"status":  domain.TeacherStatusSubmitted,
	})
}

func (h *TeacherHandler) Search(w http.ResponseWriter, r *http.Request) {
	subject := r.URL.Query().Get("subject")
	language := r.URL.Query().Get("language")

	teachers, err := h.teacherRepo.SearchApproved(r.Context(), subject, language)
	if err != nil {
		http.Error(w, `{"error":"failed to search teachers"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(teachers)
}

func (h *TeacherHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid teacher id"}`, http.StatusBadRequest)
		return
	}

	teacher, err := h.teacherRepo.GetByID(r.Context(), id)
	if err != nil || teacher == nil {
		http.Error(w, `{"error":"teacher not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(teacher)
}

// ─── PostGIS Spatial Discovery & Nearby Teachers ──────────────────────────────

func (h *TeacherHandler) Nearby(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	latStr := q.Get("latitude")
	lngStr := q.Get("longitude")

	if latStr == "" || lngStr == "" {
		http.Error(w, `{"error":"latitude and longitude query parameters are required"}`, http.StatusBadRequest)
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil || lat < -90 || lat > 90 {
		http.Error(w, `{"error":"invalid latitude value (-90 to 90)"}`, http.StatusBadRequest)
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil || lng < -180 || lng > 180 {
		http.Error(w, `{"error":"invalid longitude value (-180 to 180)"}`, http.StatusBadRequest)
		return
	}

	radiusKm := 10.0 // default 10km
	if rStr := q.Get("radius"); rStr != "" {
		if parsedR, err := strconv.ParseFloat(rStr, 64); err == nil && parsedR > 0 && parsedR <= 200 {
			radiusKm = parsedR
		}
	}

	subject := q.Get("subject")
	teachingFormat := q.Get("teaching_format")
	locationType := q.Get("location_type")

	results, err := h.teacherRepo.FindNearbyTeachers(r.Context(), lat, lng, radiusKm, subject, teachingFormat, locationType)
	if err != nil {
		http.Error(w, `{"error":"failed to query nearby teachers: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	if results == nil {
		results = []domain.NearbyTeacherResult{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data":      results,
		"count":     len(results),
		"radius_km": radiusKm,
		"center": map[string]float64{
			"latitude":  lat,
			"longitude": lng,
		},
	})
}

type AddLocationRequest struct {
	LocationName string  `json:"location_name"`
	Address      string  `json:"address"`
	City         string  `json:"city"`
	Region       string  `json:"region"`
	LocationType string  `json:"location_type"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
}

func (h *TeacherHandler) AddLocation(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	profile, err := h.teacherRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || profile == nil {
		http.Error(w, `{"error":"teacher profile not found"}`, http.StatusForbidden)
		return
	}

	var req AddLocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.LocationName == "" || req.Address == "" || req.Latitude == 0 || req.Longitude == 0 {
		http.Error(w, `{"error":"location_name, address, latitude, and longitude are required"}`, http.StatusBadRequest)
		return
	}

	if req.City == "" {
		req.City = "Accra"
	}
	if req.Region == "" {
		req.Region = "Greater Accra"
	}
	if req.LocationType == "" {
		req.LocationType = "MADRASSA"
	}

	loc := &domain.TeacherLocation{
		TeacherProfileID: profile.ID,
		LocationName:     req.LocationName,
		Address:          req.Address,
		City:             req.City,
		Region:           req.Region,
		LocationType:     req.LocationType,
		Latitude:         req.Latitude,
		Longitude:        req.Longitude,
	}

	if err := h.teacherRepo.AddLocation(r.Context(), loc); err != nil {
		http.Error(w, `{"error":"failed to save teaching location: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(loc)
}

func (h *TeacherHandler) GetMyLocations(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	profile, err := h.teacherRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || profile == nil {
		http.Error(w, `{"error":"teacher profile not found"}`, http.StatusForbidden)
		return
	}

	locs, err := h.teacherRepo.GetLocationsByTeacherProfileID(r.Context(), profile.ID)
	if err != nil {
		http.Error(w, `{"error":"failed to retrieve locations"}`, http.StatusInternalServerError)
		return
	}
	if locs == nil {
		locs = []domain.TeacherLocation{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(locs)
}

func (h *TeacherHandler) DeleteLocation(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	profile, err := h.teacherRepo.GetByUserID(r.Context(), claims.UserID)
	if err != nil || profile == nil {
		http.Error(w, `{"error":"teacher profile not found"}`, http.StatusForbidden)
		return
	}

	locIDStr := chi.URLParam(r, "id")
	locID, err := uuid.Parse(locIDStr)
	if err != nil {
		http.Error(w, `{"error":"invalid location id"}`, http.StatusBadRequest)
		return
	}

	if err := h.teacherRepo.DeleteLocation(r.Context(), locID, profile.ID); err != nil {
		http.Error(w, `{"error":"failed to delete location"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Location removed successfully"})
}

