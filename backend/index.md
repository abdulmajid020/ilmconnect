# Backend & DB Architecture (Golang & PostgreSQL)

## 1. Overview
The backend is a high-performance RESTful API written in **Go (Golang)** backed by **PostgreSQL**. It resides in the `backend&db/` directory and handles all business logic, single-identity authentication, 1-on-1 Sheikh matching, atomic Madrassa class enrollment, and Q&A.

---

## 2. Directory Layout (`backend&db/`)

```
backend&db/
├── cmd/
│   └── api/
│       └── main.go                 # Application entry point, server startup
├── internal/
│   ├── config/                     # Environment configuration loader
│   ├── database/                   # PostgreSQL connection pool (pgxpool)
│   ├── domain/                     # Core domain models & custom types
│   ├── handler/                    # HTTP request handlers (Chi / Gin)
│   │   ├── auth_handler.go
│   │   ├── teacher_handler.go
│   │   ├── learner_handler.go
│   │   ├── request_handler.go
│   │   ├── madrassa_handler.go
│   │   ├── question_handler.go
│   │   └── admin_handler.go
│   ├── middleware/                 # Auth JWT, RBAC guards, logging, CORS
│   │   ├── auth_middleware.go
│   │   └── rbac_middleware.go
│   ├── repository/                 # Database queries & transactions
│   │   ├── user_repo.go
│   │   ├── teacher_repo.go
│   │   ├── madrassa_repo.go        # Atomic enrollment with FOR UPDATE
│   │   └── question_repo.go
│   ├── service/                    # Business use-cases
│   └── validator/                  # Request payload validation
├── migrations/                     # SQL migration files
│   ├── 000001_init_schema.up.sql
│   └── 000001_init_schema.down.sql
├── go.mod
├── go.sum
└── .env.example
```

---

## 3. High-Performance Atomic Concurrency in Go
To enforce line 70 of `engineering.md` (*"Enrolment must be atomic; prevent two learners from claiming the final 20th space"*), the repository uses a PostgreSQL transaction with row-level locking via `pgx`:

```go
package repository

import (
    "context"
    "errors"
    "github.com/jackc/pgx/v5/pgxpool"
)

type EnrollmentResult struct {
    EnrollmentID string
    Status       string // "ENROLLED" or "WAITLISTED"
}

func (r *MadrassaRepository) EnrollStudentAtomic(ctx context.Context, classID, learnerProfileID string) (*EnrollmentResult, error) {
    tx, err := r.db.Begin(ctx)
    if err != nil {
        return nil, err
    }
    defer tx.Rollback(ctx)

    // 1. Lock the class row for update
    var capacity int
    var classStatus string
    err = tx.QueryRow(ctx, `
        SELECT capacity, status 
        FROM madrassa_classes 
        WHERE id = $1 
        FOR UPDATE
    `, classID).Scan(&capacity, &classStatus)
    if err != nil {
        return nil, err
    }

    if classStatus != "PUBLISHED" {
        return nil, errors.New("class is not open for enrollment")
    }

    // 2. Count existing confirmed students
    var currentCount int
    err = tx.QueryRow(ctx, `
        SELECT COUNT(*) 
        FROM class_enrollments 
        WHERE class_id = $1 AND status = 'ENROLLED'
    `, classID).Scan(&currentCount)
    if err != nil {
        return nil, err
    }

    // 3. Atomically assign status based on remaining capacity
    targetStatus := "WAITLISTED"
    if currentCount < capacity {
        targetStatus = "ENROLLED"
    }

    // 4. Insert enrollment record
    var enrollmentID string
    err = tx.QueryRow(ctx, `
        INSERT INTO class_enrollments (class_id, learner_profile_id, status)
        VALUES ($1, $2, $3)
        RETURNING id
    `, classID, learnerProfileID, targetStatus).Scan(&enrollmentID)
    if err != nil {
        return nil, err
    }

    if err := tx.Commit(ctx); err != nil {
        return nil, err
    }

    return &EnrollmentResult{
        EnrollmentID: enrollmentID,
        Status:       targetStatus,
    }, nil
}
```

---

## 4. Key Libraries
* **Driver:** `github.com/jackc/pgx/v5` (Native PostgreSQL driver with connection pooling)
* **Router:** `github.com/go-chi/chi/v5` (Lightweight, idiomatic, 100% net/http compatible)
* **Auth:** `github.com/golang-jwt/jwt/v5` + `golang.org/x/crypto/bcrypt`
* **Migrations:** `github.com/golang-migrate/migrate/v4`
