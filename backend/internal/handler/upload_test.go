package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/google/uuid"
	"zoq/backend/internal/domain"
	"zoq/backend/internal/handler"
	"zoq/backend/internal/middleware"
)

func TestUploadHandler(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "zoq-uploads-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	uploadHandler := handler.NewUploadHandler(tempDir)

	mockUser := &middleware.AuthClaims{
		UserID: uuid.New(),
		Email:  "teacher@zoq.org",
		Roles:  []domain.UserRole{domain.RoleTeacher},
	}

	// Helper to attach user context
	withAuth := func(req *http.Request) *http.Request {
		ctx := context.WithValue(req.Context(), middleware.UserContextKey, mockUser)
		return req.WithContext(ctx)
	}

	// 1. Valid PDF Upload
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "ijazah_certificate.pdf")
	io.WriteString(part, "%PDF-1.4 mock pdf content for testing")
	writer.Close()

	req := httptest.NewRequest("POST", "/api/v1/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req = withAuth(req)
	rec := httptest.NewRecorder()

	uploadHandler.UploadFile(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created for valid PDF, got %d: %s", rec.Code, rec.Body.String())
	}

	var res handler.UploadResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if res.FileName != "ijazah_certificate.pdf" {
		t.Errorf("expected filename 'ijazah_certificate.pdf', got '%s'", res.FileName)
	}

	// Verify file is saved in tempDir
	savedFiles, _ := os.ReadDir(tempDir)
	if len(savedFiles) != 1 {
		t.Errorf("expected 1 file stored on disk, found %d", len(savedFiles))
	}
	if filepath.Ext(savedFiles[0].Name()) != ".pdf" {
		t.Errorf("expected stored file to have .pdf extension, got %s", savedFiles[0].Name())
	}

	// 2. Reject Disallowed Extension (.exe)
	bodyBad := &bytes.Buffer{}
	writerBad := multipart.NewWriter(bodyBad)
	partBad, _ := writerBad.CreateFormFile("file", "malicious_script.exe")
	io.WriteString(partBad, "binary-content")
	writerBad.Close()

	reqBad := httptest.NewRequest("POST", "/api/v1/upload", bodyBad)
	reqBad.Header.Set("Content-Type", writerBad.FormDataContentType())
	reqBad = withAuth(reqBad)
	recBad := httptest.NewRecorder()

	uploadHandler.UploadFile(recBad, reqBad)

	if recBad.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for .exe file, got %d", recBad.Code)
	}
}

