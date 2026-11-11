package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"zoq/backend/internal/middleware"
)

type UploadHandler struct {
	uploadDir string
}

func NewUploadHandler(uploadDir string) *UploadHandler {
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		panic("failed to create upload directory: " + err.Error())
	}
	return &UploadHandler{uploadDir: uploadDir}
}

type UploadResponse struct {
	FileURL  string `json:"file_url"`
	FileName string `json:"file_name"`
	FileSize int64  `json:"file_size"`
}

func (h *UploadHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	_, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// 10 MB maximum upload size
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, `{"error":"file exceeds maximum limit of 10MB"}`, http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, `{"error":"missing 'file' in form-data"}`, http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate allowed extensions (PDF, PNG, JPG)
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".pdf" && ext != ".png" && ext != ".jpg" && ext != ".jpeg" {
		http.Error(w, `{"error":"only PDF, PNG, and JPG files are permitted"}`, http.StatusBadRequest)
		return
	}

	// Generate safe unique filename
	uniqueName := uuid.New().String() + ext
	destPath := filepath.Join(h.uploadDir, uniqueName)

	destFile, err := os.Create(destPath)
	if err != nil {
		http.Error(w, `{"error":"failed to store uploaded file"}`, http.StatusInternalServerError)
		return
	}
	defer destFile.Close()

	size, err := io.Copy(destFile, file)
	if err != nil {
		http.Error(w, `{"error":"failed to write file to disk"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(UploadResponse{
		FileURL:  "/uploads/" + uniqueName,
		FileName: header.Filename,
		FileSize: size,
	})
}

