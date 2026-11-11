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

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (
			id, email, phone_number, full_name, password_hash, gender, 
			country, preferred_language, roles, is_active, is_suspended, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9::text[]::user_role[], $10, $11, $12, $13
		)
	`
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now
	user.IsActive = true
	user.IsSuspended = false

	if len(user.Roles) == 0 {
		user.Roles = []domain.UserRole{domain.RoleLearner}
	}

	roleStrs := make([]string, len(user.Roles))
	for i, role := range user.Roles {
		roleStrs[i] = string(role)
	}

	_, err := r.db.Exec(ctx, query,
		user.ID, user.Email, user.PhoneNumber, user.FullName, user.PasswordHash,
		user.Gender, user.Country, user.PreferredLanguage, roleStrs,
		user.IsActive, user.IsSuspended, user.CreatedAt, user.UpdatedAt,
	)
	return err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, email, phone_number, full_name, password_hash, avatar_url, gender, 
		       country, preferred_language, roles::text[], is_active, is_suspended, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	user := &domain.User{}
	var roleStrs []string
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PhoneNumber, &user.FullName, &user.PasswordHash,
		&user.AvatarURL, &user.Gender, &user.Country, &user.PreferredLanguage,
		&roleStrs, &user.IsActive, &user.IsSuspended, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	user.Roles = make([]domain.UserRole, len(roleStrs))
	for i, s := range roleStrs {
		user.Roles[i] = domain.UserRole(s)
	}
	return user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, email, phone_number, full_name, password_hash, avatar_url, gender, 
		       country, preferred_language, roles::text[], is_active, is_suspended, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	user := &domain.User{}
	var roleStrs []string
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PhoneNumber, &user.FullName, &user.PasswordHash,
		&user.AvatarURL, &user.Gender, &user.Country, &user.PreferredLanguage,
		&roleStrs, &user.IsActive, &user.IsSuspended, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	user.Roles = make([]domain.UserRole, len(roleStrs))
	for i, s := range roleStrs {
		user.Roles[i] = domain.UserRole(s)
	}
	return user, nil
}

func (r *UserRepository) AddRole(ctx context.Context, userID uuid.UUID, role domain.UserRole) error {
	query := `
		UPDATE users
		SET roles = array_append(roles, $1::text::user_role)
		WHERE id = $2 AND NOT ($1::text::user_role = ANY(roles))
	`
	_, err := r.db.Exec(ctx, query, string(role), userID)
	return err
}
