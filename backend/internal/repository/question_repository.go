package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"zoq/backend/internal/domain"
)

type QuestionRepository struct {
	db *pgxpool.Pool
}

func NewQuestionRepository(db *pgxpool.Pool) *QuestionRepository {
	return &QuestionRepository{db: db}
}

func (r *QuestionRepository) Create(ctx context.Context, q *domain.Question) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	now := time.Now()
	q.CreatedAt = now
	q.UpdatedAt = now
	q.Status = "OPEN"

	query := `
		INSERT INTO questions (id, author_id, subject, title, content, scope, is_anonymous, target_teacher_id, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.db.Exec(ctx, query,
		q.ID, q.AuthorID, q.Subject, q.Title, q.Content,
		q.Scope, q.IsAnonymous, q.TargetTeacherID, q.Status, q.CreatedAt, q.UpdatedAt,
	)
	return err
}

func (r *QuestionRepository) ListCommunity(ctx context.Context, subject string) ([]domain.Question, error) {
	query := `
		SELECT q.id, q.author_id, q.subject, q.title, q.content, q.scope, q.is_anonymous, 
		       q.status, q.created_at, q.updated_at,
		       CASE WHEN q.is_anonymous THEN 'Anonymous Learner' ELSE u.full_name END as author_name
		FROM questions q
		JOIN users u ON u.id = q.author_id
		WHERE q.scope = 'COMMUNITY' AND q.status != 'FLAGGED'
		  AND ($1 = '' OR q.subject = $1)
		ORDER BY q.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, subject)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []domain.Question
	for rows.Next() {
		var q domain.Question
		err := rows.Scan(
			&q.ID, &q.AuthorID, &q.Subject, &q.Title, &q.Content, &q.Scope,
			&q.IsAnonymous, &q.Status, &q.CreatedAt, &q.UpdatedAt, &q.AuthorName,
		)
		if err != nil {
			return nil, err
		}
		questions = append(questions, q)
	}
	return questions, nil
}

func (r *QuestionRepository) AddAnswer(ctx context.Context, a *domain.Answer) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	now := time.Now()
	a.CreatedAt = now
	a.UpdatedAt = now
	a.IsApproved = true

	query := `
		INSERT INTO answers (id, question_id, teacher_profile_id, content, is_approved, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(ctx, query, a.ID, a.QuestionID, a.TeacherProfileID, a.Content, a.IsApproved, a.CreatedAt, a.UpdatedAt)
	return err
}

func (r *QuestionRepository) GetAnswersByQuestionID(ctx context.Context, questionID uuid.UUID) ([]domain.Answer, error) {
	query := `
		SELECT a.id, a.question_id, a.teacher_profile_id, a.content, a.is_approved, a.created_at, a.updated_at,
		       u.full_name
		FROM answers a
		JOIN teacher_profiles tp ON tp.id = a.teacher_profile_id
		JOIN users u ON u.id = tp.user_id
		WHERE a.question_id = $1 AND a.is_approved = TRUE
		ORDER BY a.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var answers []domain.Answer
	for rows.Next() {
		var a domain.Answer
		err := rows.Scan(
			&a.ID, &a.QuestionID, &a.TeacherProfileID, &a.Content,
			&a.IsApproved, &a.CreatedAt, &a.UpdatedAt, &a.TeacherName,
		)
		if err != nil {
			return nil, err
		}
		answers = append(answers, a)
	}
	return answers, nil
}

