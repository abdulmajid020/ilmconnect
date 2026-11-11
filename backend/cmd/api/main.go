package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"zoq/backend/internal/config"
	"zoq/backend/internal/database"
	"zoq/backend/internal/domain"
	"zoq/backend/internal/handler"
	"zoq/backend/internal/middleware"
	"zoq/backend/internal/repository"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. Database Connection Pool
	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	defer pool.Close()

	// 2. Repositories
	userRepo := repository.NewUserRepository(pool)
	teacherRepo := repository.NewTeacherRepository(pool)
	learnerRepo := repository.NewLearnerRepository(pool)
	madrassaRepo := repository.NewMadrassaRepository(pool)
	questionRepo := repository.NewQuestionRepository(pool)
	requestRepo := repository.NewRequestRepository(pool)
	messageRepo := repository.NewMessageRepository(pool)

	// 3. Handlers
	authHandler := handler.NewAuthHandler(userRepo, cfg)
	teacherHandler := handler.NewTeacherHandler(teacherRepo, userRepo)
	learnerHandler := handler.NewLearnerHandler(learnerRepo)
	madrassaHandler := handler.NewMadrassaHandler(madrassaRepo, teacherRepo, learnerRepo)
	questionHandler := handler.NewQuestionHandler(questionRepo, teacherRepo)
	requestHandler := handler.NewRequestHandler(requestRepo, teacherRepo)
	adminHandler := handler.NewAdminHandler(teacherRepo)
	messageHandler := handler.NewMessageHandler(messageRepo)

	uploadDir := filepath.Join(".", "uploads")
	uploadHandler := handler.NewUploadHandler(uploadDir)

	// 4. Router Setup
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(60 * time.Second))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin, "http://localhost:3000", "http://localhost:8081"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health Check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy","service":"zoq-backend"}`))
	})

	// Static Uploads File Server
	fileServer := http.FileServer(http.Dir(uploadDir))
	r.Handle("/uploads/*", http.StripPrefix("/uploads", fileServer))

	// API v1 Subrouter
	r.Route("/api/v1", func(r chi.Router) {
		// Public Auth
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)

		// Public Discovery
		r.Get("/teachers", teacherHandler.Search)
		r.Get("/teachers/nearby", teacherHandler.Nearby)
		r.Get("/teachers/{id}", teacherHandler.GetByID)
		r.Get("/classes", madrassaHandler.ListClasses)
		r.Get("/classes/{id}", madrassaHandler.GetClass)
		r.Get("/classes/{id}/sessions", madrassaHandler.ListSessions)
		r.Get("/questions", questionHandler.ListCommunity)
		r.Get("/questions/{id}/answers", questionHandler.GetAnswers)

		// Protected Routes (Require JWT)
		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))

			// Auth User
			r.Get("/auth/me", authHandler.Me)

			// File Upload
			r.Post("/upload", uploadHandler.UploadFile)

			// Learner Profile & "My Learning" Mobile Hub
			r.Post("/learners/profile", learnerHandler.SaveProfile)
			r.Get("/learners/profile", learnerHandler.GetProfile)
			r.Get("/learners/classes", learnerHandler.GetMyClasses)
			r.Get("/learners/teachers", learnerHandler.GetMyTeachers)

			// 1-on-1 Matching
			r.Post("/requests", requestHandler.SendRequest)
			r.Get("/requests/received", requestHandler.ListReceived)
			r.Patch("/requests/{id}/respond", requestHandler.Respond)

			// Group Madrassa (Atomic Enrollment)
			r.Post("/classes/{id}/enroll", madrassaHandler.Enroll)

			// Q&A Posting
			r.Post("/questions", questionHandler.Create)

			// Teacher Dashboard & Class Management
			r.Post("/teachers/apply", teacherHandler.Apply)
			r.Post("/teachers/locations", teacherHandler.AddLocation)
			r.Get("/teachers/locations", teacherHandler.GetMyLocations)
			r.Delete("/teachers/locations/{id}", teacherHandler.DeleteLocation)
			r.Get("/teachers/my-classes", madrassaHandler.GetTeacherClasses)
			r.Post("/classes", madrassaHandler.CreateClass)
			r.Get("/classes/{id}/roster", madrassaHandler.GetClassRoster)
			r.Post("/classes/{id}/sessions", madrassaHandler.CreateSession)
			r.Post("/questions/{id}/answers", questionHandler.Answer)

			// 1-on-1 Coordination Messages
			r.Post("/conversations", messageHandler.StartOrGetConversation)
			r.Get("/conversations", messageHandler.ListConversations)
			r.Post("/conversations/{id}/messages", messageHandler.SendMessage)
			r.Get("/conversations/{id}/messages", messageHandler.ListMessages)

			// Admin Desk (Requires ADMIN role)
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole(domain.RoleAdmin))
				r.Get("/admin/teachers/pending", adminHandler.ListPendingTeachers)
				r.Patch("/admin/teachers/{id}/review", adminHandler.ReviewTeacher)
			})
		})
	})

	// 5. Server & Graceful Shutdown
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("🚀 Zoq Backend API server listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down Zoq API server gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server gracefully exited")
}
