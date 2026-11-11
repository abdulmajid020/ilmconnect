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

type LearnerRepository struct {
	db *pgxpool.Pool
}

func NewLearnerRepository(db *pgxpool.Pool) *LearnerRepository {
	return &LearnerRepository{db: db}
}

func (r *LearnerRepository) Upsert(ctx context.Context, profile *domain.LearnerProfile) error {
	if profile.ID == uuid.Nil {
		profile.ID = uuid.New()
	}
	now := time.Now()
	profile.CreatedAt = now
	profile.UpdatedAt = now

	query := `
		INSERT INTO learner_profiles (id, user_id, knowledge_level, learning_goals, preferred_format, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			knowledge_level = EXCLUDED.knowledge_level,
			learning_goals = EXCLUDED.learning_goals,
			preferred_format = EXCLUDED.preferred_format,
			updated_at = EXCLUDED.updated_at
		RETURNING id
	`
	return r.db.QueryRow(ctx, query,
		profile.ID, profile.UserID, profile.KnowledgeLevel, profile.LearningGoals,
		profile.PreferredFormat, profile.CreatedAt, profile.UpdatedAt,
	).Scan(&profile.ID)
}

func (r *LearnerRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.LearnerProfile, error) {
	query := `
		SELECT id, user_id, knowledge_level, learning_goals, preferred_format, created_at, updated_at
		FROM learner_profiles
		WHERE user_id = $1
	`
	p := &domain.LearnerProfile{}
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.KnowledgeLevel, &p.LearningGoals, &p.PreferredFormat,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return p, nil
}

func (r *LearnerRepository) GetMyEnrolledClasses(ctx context.Context, learnerProfileID uuid.UUID) ([]domain.EnrolledClassItem, error) {
	query := `
		SELECT ce.class_id, mc.title, mc.subject, u.full_name as teacher_name, 
		       ce.status as enrollment_status, mc.recurring_schedule, mc.default_meet_link,
		       mc.capacity, ce.enrolled_at
		FROM class_enrollments ce
		JOIN madrassa_classes mc ON mc.id = ce.class_id
		JOIN teacher_profiles tp ON tp.id = mc.teacher_profile_id
		JOIN users u ON u.id = tp.user_id
		WHERE ce.learner_profile_id = $1
		ORDER BY ce.enrolled_at DESC
	`
	rows, err := r.db.Query(ctx, query, learnerProfileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.EnrolledClassItem
	for rows.Next() {
		var item domain.EnrolledClassItem
		err := rows.Scan(
			&item.ClassID, &item.Title, &item.Subject, &item.TeacherName,
			&item.EnrollmentStatus, &item.RecurringSchedule, &item.DefaultMeetLink,
			&item.Capacity, &item.EnrolledAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *LearnerRepository) GetMyActiveTeachers(ctx context.Context, learnerProfileID uuid.UUID) ([]domain.ActiveTeacherItem, error) {
	query := `
		SELECT tsr.id as relationship_id, tp.id as teacher_profile_id, u.full_name as teacher_name,
		       tsr.subject, tsr.meeting_schedule, tsr.google_meet_link, tsr.status, u.avatar_url
		FROM teacher_student_relationships tsr
		JOIN teacher_profiles tp ON tp.id = tsr.teacher_profile_id
		JOIN users u ON u.id = tp.user_id
		WHERE tsr.learner_profile_id = $1 AND tsr.status = 'ACTIVE'
		ORDER BY tsr.started_at DESC
	`
	rows, err := r.db.Query(ctx, query, learnerProfileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.ActiveTeacherItem
	for rows.Next() {
		var item domain.ActiveTeacherItem
		err := rows.Scan(
			&item.RelationshipID, &item.TeacherProfileID, &item.TeacherName,
			&item.Subject, &item.MeetingSchedule, &item.GoogleMeetLink,
			&item.Status, &item.AvatarURL,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}
