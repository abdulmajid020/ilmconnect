# Zoq / IlmConnect Backend (Golang & PostgreSQL)

High-performance, complete REST API service for the Zoq / IlmConnect Islamic Education platform.

---

## 1. Quick Start

### Prerequisites
* **Go** (version 1.22+)
* **PostgreSQL** (version 14+)

### Configuration
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `DATABASE_URL` with your local PostgreSQL credentials:
   ```env
   DATABASE_URL=postgres://postgres:password@localhost:5432/zoq_dev?sslmode=disable
   ```

### Run Database Migrations
```bash
psql -d zoq_dev -f migrations/000001_init_schema.up.sql
```

### Run Automated Tests
```powershell
.\run_tests.ps1
```
Or run directly via Go:
```bash
go test -v ./internal/config ./internal/domain ./internal/middleware
```

### Start Server
```bash
go run ./cmd/api
```
The server will start listening on `http://localhost:8080`.

---

## 2. Complete REST API Endpoints Specification

### 🔐 Authentication & Identity
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Service health probe |
| `POST` | `/api/v1/auth/register` | Public | Register new user (email/phone, gender, password) |
| `POST` | `/api/v1/auth/login` | Public | Login with email & password, receives JWT |
| `GET` | `/api/v1/auth/me` | Bearer Token | Authenticated profile & active roles |
| `POST` | `/api/v1/upload` | Bearer Token | Upload credentials/images (PDF, PNG, JPG max 10MB) |

### 📖 Learner Mobile Hub ("My Learning" & Onboarding)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/learners/profile` | Learner | Save 3-step diagnostic goals, knowledge level |
| `GET` | `/api/v1/learners/profile` | Learner | Retrieve learner profile |
| `GET` | `/api/v1/learners/classes` | Learner | List enrolled & waitlisted Madrassa classes |
| `GET` | `/api/v1/learners/teachers`| Learner | List active 1-on-1 Sheikh mentors |

### 🧭 Sheikh Discovery & 1-on-1 Matching
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/teachers` | Public | Search verified teachers (by subject, language) |
| `GET` | `/api/v1/teachers/{id}`| Public | Public teacher profile & bio |
| `POST` | `/api/v1/requests` | Learner | Send 1-on-1 lesson request to a Sheikh |
| `GET` | `/api/v1/requests/received` | Teacher | Teacher views incoming student requests |
| `PATCH`| `/api/v1/requests/{id}/respond` | Teacher | **Accept or decline** (Accepting atomically creates active relationship with Google Meet link) |

### 🏫 Group Madrassa Classes
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/classes` | Public | Browse published classes |
| `GET` | `/api/v1/classes/{id}` | Public | View class details & seats remaining |
| `POST` | `/api/v1/classes/{id}/enroll` | Learner | **Atomic enrollment** (Locks row, assigns `ENROLLED` or `WAITLISTED`) |
| `GET` | `/api/v1/classes/{id}/sessions` | Public | List scheduled class sessions & Google Meet links |
| `GET` | `/api/v1/teachers/my-classes` | Teacher | List classes created by the logged-in teacher |
| `POST` | `/api/v1/classes` | Teacher | Create group class (capacity: 20) |
| `GET` | `/api/v1/classes/{id}/roster` | Teacher | View confirmed student roster & waitlist |
| `POST` | `/api/v1/classes/{id}/sessions` | Teacher | Schedule upcoming class date & Google Meet link |

### 💬 Islamic Q&A Board
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/questions` | Public | Browse community questions |
| `POST` | `/api/v1/questions` | Learner | Post question (community/private, anonymous toggle) |
| `GET` | `/api/v1/questions/{id}/answers` | Public | View verified scholarly answers |
| `POST` | `/api/v1/questions/{id}/answers` | Teacher | Verified teacher posts an answer |

### ✉️ 1-on-1 Coordination Chat
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/conversations` | Bearer Token | Start or get existing conversation with a user |
| `GET` | `/api/v1/conversations` | Bearer Token | List all user's active conversations |
| `POST` | `/api/v1/conversations/{id}/messages` | Bearer Token | Send text message in conversation |
| `GET` | `/api/v1/conversations/{id}/messages` | Bearer Token | List chat history in conversation |

### 🛡️ Admin Verification Desk
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/teachers/pending` | Admin | Review pending teacher applications & credentials |
| `PATCH`| `/api/v1/admin/teachers/{id}/review` | Admin | Approve, reject, or suspend teacher |
