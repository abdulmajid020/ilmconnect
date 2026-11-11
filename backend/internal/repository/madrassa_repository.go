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

type MadrassaRepository struct {
	db *pgxpool.Pool
}

func NewMadrassaRepository(db *pgxpool.Pool) *MadrassaRepository {
	return &MadrassaRepository{db: db}
}

func (r *MadrassaRepository) CreateClass(ctx context.Context, class *domain.MadrassaClass) error {
	if class.ID == uuid.Nil {
		class.ID = uuid.New()
	}
	now := time.Now()
	class.CreatedAt = now
	class.UpdatedAt = now
	if class.Capacity <= 0 {
		class.Capacity = 20
	}
	if class.Status == "" {
		class.Status = "PUBLISHED"
	}
	if class.EnrollmentMode == "" {
		class.EnrollmentMode = "OPEN"
	}
	if class.Visibility == "" {
		class.Visibility = "PUBLIC"
	}

	query := `
		INSERT INTO madrassa_classes (
			id, teacher_profile_id, title, description, subject, language, 
			level, capacity, visibility, enrollment_mode, status, 
			recurring_schedule, default_meet_link, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
	`
	_, err := r.db.Exec(ctx, query,
		class.ID, class.TeacherProfileID, class.Title, class.Description, class.Subject,
		class.Language, class.Level, class.Capacity, class.Visibility, class.EnrollmentMode,
		class.Status, class.RecurringSchedule, class.DefaultMeetLink, class.CreatedAt, class.UpdatedAt,
	)
	return err
}

func (r *MadrassaRepository) ListClasses(ctx context.Context, subject, level string) ([]domain.MadrassaClass, error) {
	query := `
		SELECT mc.id, mc.teacher_profile_id, mc.title, mc.description, mc.subject, 
		       mc.language, mc.level, mc.capacity, mc.visibility, mc.enrollment_mode, 
		       mc.status, mc.recurring_schedule, mc.default_meet_link, mc.created_at, mc.updated_at,
		       u.full_name,
		       (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = mc.id AND ce.status = 'ENROLLED') as enrolled_count
		FROM madrassa_classes mc
		JOIN teacher_profiles tp ON tp.id = mc.teacher_profile_id
		JOIN users u ON u.id = tp.user_id
		WHERE mc.status = 'PUBLISHED'
		  AND mc.visibility = 'PUBLIC'
		  AND ($1 = '' OR mc.subject = $1)
		  AND ($2 = '' OR mc.level::text = $2)
		ORDER BY mc.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, subject, level)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []domain.MadrassaClass
	for rows.Next() {
		var c domain.MadrassaClass
		err := rows.Scan(
			&c.ID, &c.TeacherProfileID, &c.Title, &c.Description, &c.Subject,
			&c.Language, &c.Level, &c.Capacity, &c.Visibility, &c.EnrollmentMode,
			&c.Status, &c.RecurringSchedule, &c.DefaultMeetLink, &c.CreatedAt, &c.UpdatedAt,
			&c.TeacherName, &c.EnrolledCount,
		)
		if err != nil {
			return nil, err
		}
		c.IsFree = true // Default free; payment integration deferred
		classes = append(classes, c)
	}
	return classes, nil
}

func (r *MadrassaRepository) GetClassByID(ctx context.Context, classID uuid.UUID) (*domain.MadrassaClass, error) {
	query := `
		SELECT mc.id, mc.teacher_profile_id, mc.title, mc.description, mc.subject, 
		       mc.language, mc.level, mc.capacity, mc.visibility, mc.enrollment_mode, 
		       mc.status, mc.recurring_schedule, mc.default_meet_link, mc.created_at, mc.updated_at,
		       u.full_name,
		       (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = mc.id AND ce.status = 'ENROLLED') as enrolled_count
		FROM madrassa_classes mc
		JOIN teacher_profiles tp ON tp.id = mc.teacher_profile_id
		JOIN users u ON u.id = tp.user_id
		WHERE mc.id = $1
	`
	c := &domain.MadrassaClass{}
	err := r.db.QueryRow(ctx, query, classID).Scan(
		&c.ID, &c.TeacherProfileID, &c.Title, &c.Description, &c.Subject,
		&c.Language, &c.Level, &c.Capacity, &c.Visibility, &c.EnrollmentMode,
		&c.Status, &c.RecurringSchedule, &c.DefaultMeetLink, &c.CreatedAt, &c.UpdatedAt,
		&c.TeacherName, &c.EnrolledCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return c, nil
}

func (r *MadrassaRepository) GetClassesByTeacher(ctx context.Context, teacherProfileID uuid.UUID) ([]domain.MadrassaClass, error) {
	query := `
		SELECT mc.id, mc.teacher_profile_id, mc.title, mc.description, mc.subject, 
		       mc.language, mc.level, mc.capacity, mc.visibility, mc.enrollment_mode, 
		       mc.status, mc.recurring_schedule, mc.default_meet_link, mc.created_at, mc.updated_at,
		       (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = mc.id AND ce.status = 'ENROLLED') as enrolled_count
		FROM madrassa_classes mc
		WHERE mc.teacher_profile_id = $1
		ORDER BY mc.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, teacherProfileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []domain.MadrassaClass
	for rows.Next() {
		var c domain.MadrassaClass
		err := rows.Scan(
			&c.ID, &c.TeacherProfileID, &c.Title, &c.Description, &c.Subject,
			&c.Language, &c.Level, &c.Capacity, &c.Visibility, &c.EnrollmentMode,
			&c.Status, &c.RecurringSchedule, &c.DefaultMeetLink, &c.CreatedAt, &c.UpdatedAt,
			&c.EnrolledCount,
		)
		if err != nil {
			return nil, err
		}
		c.IsFree = true // Default free; payment integration deferred
		classes = append(classes, c)
	}
	return classes, nil
}

func (r *MadrassaRepository) GetClassRoster(ctx context.Context, classID uuid.UUID) ([]domain.RosterStudentItem, error) {
	query := `
		SELECT ce.id, u.id as learner_user_id, u.full_name, u.email, u.phone_number, 
		       u.gender, ce.status, ce.enrolled_at
		FROM class_enrollments ce
		JOIN learner_profiles lp ON lp.id = ce.learner_profile_id
		JOIN users u ON u.id = lp.user_id
		WHERE ce.class_id = $1
		ORDER BY CASE WHEN ce.status = 'ENROLLED' THEN 1 ELSE 2 END, ce.enrolled_at ASC
	`
	rows, err := r.db.Query(ctx, query, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roster []domain.RosterStudentItem
	for rows.Next() {
		var item domain.RosterStudentItem
		err := rows.Scan(
			&item.EnrollmentID, &item.LearnerUserID, &item.FullName, &item.Email,
			&item.PhoneNumber, &item.Gender, &item.Status, &item.EnrolledAt,
		)
		if err != nil {
			return nil, err
		}
		roster = append(roster, item)
	}
	return roster, nil
}

type EnrollmentResult struct {
	EnrollmentID uuid.UUID `json:"enrollment_id"`
	ClassID      uuid.UUID `json:"class_id"`
	Status       string    `json:"status"` // ENROLLED or WAITLISTED
	Message      string    `json:"message"`
}

// EnrollAtomic guarantees race-free capacity management (Max 20 seats)
func (r *MadrassaRepository) EnrollAtomic(ctx context.Context, classID, learnerProfileID uuid.UUID) (*EnrollmentResult, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1. Check if already enrolled or waitlisted
	var existingStatus string
	checkQuery := `SELECT status FROM class_enrollments WHERE class_id = $1 AND learner_profile_id = $2`
	err = tx.QueryRow(ctx, checkQuery, classID, learnerProfileID).Scan(&existingStatus)
	if err == nil {
		return nil, errors.New("already registered for this class with status: " + existingStatus)
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	// 2. Lock class row FOR UPDATE to serialize concurrent enrollment requests
	var capacity int
	var status string
	lockQuery := `SELECT capacity, status FROM madrassa_classes WHERE id = $1 FOR UPDATE`
	err = tx.QueryRow(ctx, lockQuery, classID).Scan(&capacity, &status)
	if err != nil {
		return nil, err
	}

	if status != "PUBLISHED" && status != "ONGOING" {
		return nil, errors.New("class is currently not accepting enrollments")
	}

	// 3. Count confirmed enrollments
	var enrolledCount int
	countQuery := `SELECT COUNT(*) FROM class_enrollments WHERE class_id = $1 AND status = 'ENROLLED'`
	err = tx.QueryRow(ctx, countQuery, classID).Scan(&enrolledCount)
	if err != nil {
		return nil, err
	}

	// 4. Assign status: ENROLLED if seats remain, else WAITLISTED
	assignedStatus := "WAITLISTED"
	message := "Class is at maximum capacity (20). You have been placed on the waiting list."
	if enrolledCount < capacity {
		assignedStatus = "ENROLLED"
		message = "Successfully enrolled in class."
	}

	// 5. Insert enrollment record
	enrollmentID := uuid.New()
	insertQuery := `
		INSERT INTO class_enrollments (id, class_id, learner_profile_id, status, enrolled_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err = tx.Exec(ctx, insertQuery, enrollmentID, classID, learnerProfileID, assignedStatus, time.Now())
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &EnrollmentResult{
		EnrollmentID: enrollmentID,
		ClassID:      classID,
		Status:       assignedStatus,
		Message:      message,
	}, nil
}

func (r *MadrassaRepository) CreateSession(ctx context.Context, session *domain.ClassSession) error {
	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	now := time.Now()
	session.CreatedAt = now
	session.UpdatedAt = now
	if session.Status == "" {
		session.Status = "SCHEDULED"
	}
	if session.DurationMinutes <= 0 {
		session.DurationMinutes = 60
	}

	query := `
		INSERT INTO class_sessions (id, class_id, title, session_date, duration_minutes, meet_link, notes, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.db.Exec(ctx, query,
		session.ID, session.ClassID, session.Title, session.SessionDate,
		session.DurationMinutes, session.MeetLink, session.Notes,
		session.Status, session.CreatedAt, session.UpdatedAt,
	)
	return err
}

func (r *MadrassaRepository) ListSessions(ctx context.Context, classID uuid.UUID) ([]domain.ClassSession, error) {
	query := `
		SELECT id, class_id, title, session_date, duration_minutes, meet_link, notes, status, created_at, updated_at
		FROM class_sessions
		WHERE class_id = $1
		ORDER BY session_date ASC
	`
	rows, err := r.db.Query(ctx, query, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []domain.ClassSession
	for rows.Next() {
		var s domain.ClassSession
		err := rows.Scan(
			&s.ID, &s.ClassID, &s.Title, &s.SessionDate, &s.DurationMinutes,
			&s.MeetLink, &s.Notes, &s.Status, &s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}
