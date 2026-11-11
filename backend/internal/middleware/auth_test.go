package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"zoq/backend/internal/domain"
	"zoq/backend/internal/middleware"
)

const testSecret = "test-secret-key-for-auth"

func TestTokenGenerationAndAuthentication(t *testing.T) {
	user := &domain.User{
		ID:    uuid.New(),
		Roles: []domain.UserRole{domain.RoleLearner},
	}
	email := "learner@zoq.org"
	user.Email = &email

	// 1. Generate valid token
	token, err := middleware.GenerateToken(user, testSecret, 1*time.Hour)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	handlerToTest := middleware.Authenticate(testSecret)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := middleware.GetUserFromContext(r.Context())
		if !ok || claims == nil {
			t.Error("expected claims in context")
		}
		if claims.UserID != user.ID {
			t.Errorf("expected user id %s, got %s", user.ID, claims.UserID)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("authenticated"))
	}))

	// Case A: Valid token -> 200 OK
	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	handlerToTest.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	// Case B: Missing header -> 401 Unauthorized
	reqMissing := httptest.NewRequest("GET", "/protected", nil)
	recMissing := httptest.NewRecorder()
	handlerToTest.ServeHTTP(recMissing, reqMissing)

	if recMissing.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for missing header, got %d", recMissing.Code)
	}

	// Case C: Malformed header -> 401 Unauthorized
	reqMalformed := httptest.NewRequest("GET", "/protected", nil)
	reqMalformed.Header.Set("Authorization", "TokenOnlyWithoutBearer")
	recMalformed := httptest.NewRecorder()
	handlerToTest.ServeHTTP(recMalformed, reqMalformed)

	if recMalformed.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for malformed header, got %d", recMalformed.Code)
	}

	// Case D: Expired token -> 401 Unauthorized
	expiredToken, _ := middleware.GenerateToken(user, testSecret, -1*time.Hour)
	reqExpired := httptest.NewRequest("GET", "/protected", nil)
	reqExpired.Header.Set("Authorization", "Bearer "+expiredToken)
	recExpired := httptest.NewRecorder()
	handlerToTest.ServeHTTP(recExpired, reqExpired)

	if recExpired.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for expired token, got %d", recExpired.Code)
	}

	// Case E: Wrong secret -> 401 Unauthorized
	wrongSecretHandler := middleware.Authenticate("different-secret")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	reqWrong := httptest.NewRequest("GET", "/protected", nil)
	reqWrong.Header.Set("Authorization", "Bearer "+token)
	recWrong := httptest.NewRecorder()
	wrongSecretHandler.ServeHTTP(recWrong, reqWrong)

	if recWrong.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for wrong secret, got %d", recWrong.Code)
	}
}

func TestRequireRole(t *testing.T) {
	adminUser := &domain.User{
		ID:    uuid.New(),
		Roles: []domain.UserRole{domain.RoleAdmin, domain.RoleTeacher},
	}
	learnerUser := &domain.User{
		ID:    uuid.New(),
		Roles: []domain.UserRole{domain.RoleLearner},
	}

	adminToken, _ := middleware.GenerateToken(adminUser, testSecret, 1*time.Hour)
	learnerToken, _ := middleware.GenerateToken(learnerUser, testSecret, 1*time.Hour)

	adminOnlyHandler := middleware.Authenticate(testSecret)(
		middleware.RequireRole(domain.RoleAdmin)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("admin-area"))
		})),
	)

	// Admin accesses admin-only endpoint -> 200 OK
	reqAdmin := httptest.NewRequest("GET", "/admin/desk", nil)
	reqAdmin.Header.Set("Authorization", "Bearer "+adminToken)
	recAdmin := httptest.NewRecorder()
	adminOnlyHandler.ServeHTTP(recAdmin, reqAdmin)

	if recAdmin.Code != http.StatusOK {
		t.Errorf("expected admin to get 200, got %d", recAdmin.Code)
	}

	// Learner accesses admin-only endpoint -> 403 Forbidden
	reqLearner := httptest.NewRequest("GET", "/admin/desk", nil)
	reqLearner.Header.Set("Authorization", "Bearer "+learnerToken)
	recLearner := httptest.NewRecorder()
	adminOnlyHandler.ServeHTTP(recLearner, reqLearner)

	if recLearner.Code != http.StatusForbidden {
		t.Errorf("expected learner to get 403, got %d", recLearner.Code)
	}
}

