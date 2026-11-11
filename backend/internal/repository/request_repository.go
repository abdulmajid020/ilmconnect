package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"zoq/backend/internal/domain"
)

type RequestRepository struct {
	db *pgxpool.Pool
}

func NewRequestRepository(db *pgxpool.Pool) *RequestRepository {
	return &RequestRepository{db: db}
}

func (r *RequestRepository) CreateRequest(ctx context.Context, req *domain.LearningRequest) error {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	now := time.Now()
	req.CreatedAt = now
	req.UpdatedAt = now
	req.Status = "PENDING"
	if req.ExpiresAt.IsZero() {
		req.ExpiresAt = now.Add(7 * 24 * time.Hour) // 7 days expiry
	}

	query := `
		INSERT INTO learning_requests (id, learner_id, teacher_profile_id, subject, learner_message, status, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.db.Exec(ctx, query,
		req.ID, req.LearnerID, req.TeacherProfileID, req.Subject,
		req.LearnerMessage, req.Status, req.ExpiresAt, req.CreatedAt, req.UpdatedAt,
	)
	return err
}

func (r *RequestRepository) ListByTeacher(ctx context.Context, teacherProfileID uuid.UUID) ([]domain.LearningRequest, error) {
	query := `
		SELECT lr.id, lr.learner_id, lr.teacher_profile_id, lr.subject, lr.learner_message, 
		       lr.status, lr.decline_reason, lr.expires_at, lr.created_at, lr.updated_at,
		       u.full_name as learner_name
		FROM learning_requests lr
		JOIN users u ON u.id = lr.learner_id
		WHERE lr.teacher_profile_id = $1
		ORDER BY lr.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, teacherProfileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reqs []domain.LearningRequest
	for rows.Next() {
		var req domain.LearningRequest
		err := rows.Scan(
			&req.ID, &req.LearnerID, &req.TeacherProfileID, &req.Subject,
			&req.LearnerMessage, &req.Status, &req.DeclineReason,
			&req.ExpiresAt, &req.CreatedAt, &req.UpdatedAt,
			&req.LearnerName,
		)
		if err != nil {
			return nil, err
		}
		reqs = append(reqs, req)
	}
	return reqs, nil
}

// RespondAndActivate handles accept/decline. If ACCEPTED, it atomically provisions an active relationship.
func (r *RequestRepository) RespondAndActivate(ctx context.Context, requestID uuid.UUID, teacherProfileID uuid.UUID, status string, declineReason, meetingSchedule, googleMeetLink *string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Fetch request details
	var learnerUserID uuid.UUID
	var reqTeacherProfileID uuid.UUID
	var subject string
	var currentStatus string

	queryReq := `
		SELECT learner_id, teacher_profile_id, subject, status
		FROM learning_requests
		WHERE id = $1
		FOR UPDATE
	`
	err = tx.QueryRow(ctx, queryReq, requestID).Scan(&learnerUserID, &reqTeacherProfileID, &subject, &currentStatus)
	if err != nil {
		return err
	}

	if reqTeacherProfileID != teacherProfileID {
		return errors.New("unauthorized: this request does not belong to your teacher profile")
	}
	if currentStatus != "PENDING" {
		return errors.New("request has already been answered: " + currentStatus)
	}

	// 2. Update request status
	now := time.Now()
	_, err = tx.Exec(ctx, `
		UPDATE learning_requests
		SET status = $1, decline_reason = $2, updated_at = $3
		WHERE id = $4
	`, status, declineReason, now, requestID)
	if err != nil {
		return err
	}

	// 3. If ACCEPTED, ensure learner profile exists and establish relationship
	if status == "ACCEPTED" {
		var learnerProfileID uuid.UUID
		err = tx.QueryRow(ctx, `SELECT id FROM learner_profiles WHERE user_id = $1`, learnerUserID).Scan(&learnerProfileID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				// Auto-create learner profile
				learnerProfileID = uuid.New()
				_, err = tx.Exec(ctx, `
					INSERT INTO learner_profiles (id, user_id, knowledge_level, created_at, updated_at)
					VALUES ($1, $2, 'BEGINNER', $3, $3)
				`, learnerProfileID, learnerUserID, now)
				if err != nil {
					return err
				}
			} else {
				return err
			}
		}

		// Enforce: One active Sheikh per subject rule
		var countActive int
		err = tx.QueryRow(ctx, `
			SELECT COUNT(*) FROM teacher_student_relationships
			WHERE learner_profile_id = $1 AND subject = $2 AND status = 'ACTIVE'
		`, learnerProfileID, subject).Scan(&countActive)
		if err != nil {
			return err
		}
		if countActive > 0 {
			return errors.New("learner already has an active Sheikh for this subject (" + subject + ")")
		}

		// Insert active relationship
		relID := uuid.New()
		_, err = tx.Exec(ctx, `
			INSERT INTO teacher_student_relationships (
				id, learner_profile_id, teacher_profile_id, subject, status, 
				meeting_schedule, google_meet_link, started_at
			) VALUES (
				$1, $2, $3, $4, 'ACTIVE', $5, $6, $7
			)
		`, relID, learnerProfileID, teacherProfileID, subject, meetingSchedule, googleMeetLink, now)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
