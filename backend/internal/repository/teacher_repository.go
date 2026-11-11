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

type TeacherRepository struct {
	db *pgxpool.Pool
}

func NewTeacherRepository(db *pgxpool.Pool) *TeacherRepository {
	return &TeacherRepository{db: db}
}

func (r *TeacherRepository) Apply(ctx context.Context, teacher *domain.TeacherProfile, credentials []domain.TeacherCredential) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if teacher.ID == uuid.Nil {
		teacher.ID = uuid.New()
	}
	now := time.Now()
	teacher.CreatedAt = now
	teacher.UpdatedAt = now
	teacher.Status = domain.TeacherStatusSubmitted

	queryTeacher := `
		INSERT INTO teacher_profiles (
			id, user_id, status, bio, islamic_education, years_experience, 
			expertise_areas, languages_spoken, teaching_format, is_accepting_students, 
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
		ON CONFLICT (user_id) DO UPDATE SET
			status = EXCLUDED.status,
			bio = EXCLUDED.bio,
			islamic_education = EXCLUDED.islamic_education,
			years_experience = EXCLUDED.years_experience,
			expertise_areas = EXCLUDED.expertise_areas,
			languages_spoken = EXCLUDED.languages_spoken,
			teaching_format = EXCLUDED.teaching_format,
			updated_at = EXCLUDED.updated_at
		RETURNING id
	`
	err = tx.QueryRow(ctx, queryTeacher,
		teacher.ID, teacher.UserID, teacher.Status, teacher.Bio, teacher.IslamicEducation,
		teacher.YearsExperience, teacher.ExpertiseAreas, teacher.LanguagesSpoken,
		teacher.TeachingFormat, teacher.IsAcceptingStudents, teacher.CreatedAt, teacher.UpdatedAt,
	).Scan(&teacher.ID)
	if err != nil {
		return err
	}

	for _, cred := range credentials {
		credID := uuid.New()
		queryCred := `
			INSERT INTO teacher_credentials (id, teacher_profile_id, document_title, document_url, document_type, uploaded_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`
		_, err := tx.Exec(ctx, queryCred, credID, teacher.ID, cred.DocumentTitle, cred.DocumentURL, cred.DocumentType, now)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *TeacherRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.TeacherProfile, error) {
	query := `
		SELECT id, user_id, status, bio, islamic_education, years_experience,
		       expertise_areas, languages_spoken, teaching_format, is_accepting_students,
		       review_notes, verified_at, created_at, updated_at
		FROM teacher_profiles
		WHERE user_id = $1
	`
	t := &domain.TeacherProfile{}
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&t.ID, &t.UserID, &t.Status, &t.Bio, &t.IslamicEducation, &t.YearsExperience,
		&t.ExpertiseAreas, &t.LanguagesSpoken, &t.TeachingFormat, &t.IsAcceptingStudents,
		&t.ReviewNotes, &t.VerifiedAt, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return t, nil
}

func (r *TeacherRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.TeacherProfile, error) {
	query := `
		SELECT tp.id, tp.user_id, tp.status, tp.bio, tp.islamic_education, tp.years_experience,
		       tp.expertise_areas, tp.languages_spoken, tp.teaching_format, tp.is_accepting_students,
		       tp.review_notes, tp.verified_at, tp.created_at, tp.updated_at,
		       u.full_name, u.avatar_url, u.gender
		FROM teacher_profiles tp
		JOIN users u ON u.id = tp.user_id
		WHERE tp.id = $1
	`
	t := &domain.TeacherProfile{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&t.ID, &t.UserID, &t.Status, &t.Bio, &t.IslamicEducation, &t.YearsExperience,
		&t.ExpertiseAreas, &t.LanguagesSpoken, &t.TeachingFormat, &t.IsAcceptingStudents,
		&t.ReviewNotes, &t.VerifiedAt, &t.CreatedAt, &t.UpdatedAt,
		&t.FullName, &t.AvatarURL, &t.Gender,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return t, nil
}

func (r *TeacherRepository) SearchApproved(ctx context.Context, subject, language string) ([]domain.TeacherProfile, error) {
	query := `
		SELECT tp.id, tp.user_id, tp.status, tp.bio, tp.islamic_education, tp.years_experience,
		       tp.expertise_areas, tp.languages_spoken, tp.teaching_format, tp.is_accepting_students,
		       tp.created_at, tp.updated_at,
		       u.full_name, u.avatar_url, u.gender
		FROM teacher_profiles tp
		JOIN users u ON u.id = tp.user_id
		WHERE tp.status = 'APPROVED'
		  AND tp.is_accepting_students = TRUE
		  AND ($1 = '' OR $1 = ANY(tp.expertise_areas))
		  AND ($2 = '' OR $2 = ANY(tp.languages_spoken))
		ORDER BY tp.years_experience DESC, tp.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, subject, language)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	teachers := []domain.TeacherProfile{}
	for rows.Next() {
		t := domain.TeacherProfile{}
		err := rows.Scan(
			&t.ID, &t.UserID, &t.Status, &t.Bio, &t.IslamicEducation, &t.YearsExperience,
			&t.ExpertiseAreas, &t.LanguagesSpoken, &t.TeachingFormat, &t.IsAcceptingStudents,
			&t.CreatedAt, &t.UpdatedAt,
			&t.FullName, &t.AvatarURL, &t.Gender,
		)
		if err != nil {
			return nil, err
		}
		teachers = append(teachers, t)
	}
	return teachers, nil
}

func (r *TeacherRepository) GetPendingApplications(ctx context.Context) ([]domain.TeacherProfile, error) {
	query := `
		SELECT tp.id, tp.user_id, tp.status, tp.bio, tp.islamic_education, tp.years_experience,
		       tp.expertise_areas, tp.languages_spoken, tp.teaching_format, tp.is_accepting_students,
		       tp.created_at, tp.updated_at,
		       u.full_name, u.avatar_url, u.gender
		FROM teacher_profiles tp
		JOIN users u ON u.id = tp.user_id
		WHERE tp.status IN ('SUBMITTED', 'UNDER_REVIEW')
		ORDER BY tp.created_at ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teachers []domain.TeacherProfile
	for rows.Next() {
		var t domain.TeacherProfile
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.Status, &t.Bio, &t.IslamicEducation, &t.YearsExperience,
			&t.ExpertiseAreas, &t.LanguagesSpoken, &t.TeachingFormat, &t.IsAcceptingStudents,
			&t.CreatedAt, &t.UpdatedAt,
			&t.FullName, &t.AvatarURL, &t.Gender,
		); err != nil {
			return nil, err
		}
		teachers = append(teachers, t)
	}
	return teachers, nil
}

func (r *TeacherRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.TeacherStatus, reviewNotes *string) error {
	now := time.Now()
	var verifiedAt *time.Time
	if status == domain.TeacherStatusApproved {
		verifiedAt = &now
	}

	query := `
		UPDATE teacher_profiles
		SET status = $1, review_notes = $2, verified_at = $3, updated_at = $4
		WHERE id = $5
	`
	_, err := r.db.Exec(ctx, query, status, reviewNotes, verifiedAt, now, id)
	return err
}

// ─── Spatial Discovery & PostGIS Radius Queries ───────────────────────────────

func (r *TeacherRepository) FindNearbyTeachers(ctx context.Context, lat, lng, radiusKm float64, subject, format, locationType string) ([]domain.NearbyTeacherResult, error) {
	radiusMeters := radiusKm * 1000.0
	if radiusMeters <= 0 {
		radiusMeters = 10000.0 // default 10km
	}

	query := `
		SELECT 
			tl.id,
			tl.teacher_profile_id,
			u.id,
			u.full_name,
			u.avatar_url,
			u.gender,
			tp.islamic_education,
			tp.years_experience,
			tp.expertise_areas,
			tp.languages_spoken,
			tp.teaching_format,
			tp.is_accepting_students,
			tl.location_name,
			tl.address,
			tl.city,
			tl.location_type,
			tl.latitude,
			tl.longitude,
			ROUND((ST_Distance(tl.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0)::numeric, 2) AS distance_km
		FROM teacher_locations tl
		JOIN teacher_profiles tp ON tl.teacher_profile_id = tp.id
		JOIN users u ON tp.user_id = u.id
		WHERE tl.is_active = TRUE
		  AND tp.status = 'APPROVED'
		  AND ST_DWithin(tl.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
		  AND ($4 = '' OR $4 = ANY(tp.expertise_areas))
		  AND ($5 = '' OR tp.teaching_format = $5)
		  AND ($6 = '' OR tl.location_type = $6)
		ORDER BY distance_km ASC
		LIMIT 100
	`

	rows, err := r.db.Query(ctx, query, lng, lat, radiusMeters, subject, format, locationType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []domain.NearbyTeacherResult
	for rows.Next() {
		var res domain.NearbyTeacherResult
		if err := rows.Scan(
			&res.LocationID,
			&res.TeacherProfileID,
			&res.TeacherUserID,
			&res.TeacherName,
			&res.AvatarURL,
			&res.Gender,
			&res.IslamicEducation,
			&res.YearsExperience,
			&res.ExpertiseAreas,
			&res.LanguagesSpoken,
			&res.TeachingFormat,
			&res.IsAcceptingStudents,
			&res.LocationName,
			&res.Address,
			&res.City,
			&res.LocationType,
			&res.Latitude,
			&res.Longitude,
			&res.DistanceKm,
		); err != nil {
			return nil, err
		}
		results = append(results, res)
	}

	return results, nil
}

func (r *TeacherRepository) AddLocation(ctx context.Context, loc *domain.TeacherLocation) error {
	if loc.ID == uuid.Nil {
		loc.ID = uuid.New()
	}
	now := time.Now()
	loc.CreatedAt = now
	loc.UpdatedAt = now
	loc.IsActive = true

	query := `
		INSERT INTO teacher_locations (
			id, teacher_profile_id, location_name, address, city, region,
			location_type, latitude, longitude, is_active, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
		RETURNING id
	`
	return r.db.QueryRow(ctx, query,
		loc.ID, loc.TeacherProfileID, loc.LocationName, loc.Address, loc.City, loc.Region,
		loc.LocationType, loc.Latitude, loc.Longitude, loc.IsActive, loc.CreatedAt, loc.UpdatedAt,
	).Scan(&loc.ID)
}

func (r *TeacherRepository) GetLocationsByTeacherProfileID(ctx context.Context, profileID uuid.UUID) ([]domain.TeacherLocation, error) {
	query := `
		SELECT id, teacher_profile_id, location_name, address, city, region,
		       location_type, latitude, longitude, is_active, created_at, updated_at
		FROM teacher_locations
		WHERE teacher_profile_id = $1 AND is_active = TRUE
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, profileID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var locs []domain.TeacherLocation
	for rows.Next() {
		var l domain.TeacherLocation
		if err := rows.Scan(
			&l.ID, &l.TeacherProfileID, &l.LocationName, &l.Address, &l.City, &l.Region,
			&l.LocationType, &l.Latitude, &l.Longitude, &l.IsActive, &l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			return nil, err
		}
		locs = append(locs, l)
	}
	return locs, nil
}

func (r *TeacherRepository) DeleteLocation(ctx context.Context, locID, profileID uuid.UUID) error {
	query := `DELETE FROM teacher_locations WHERE id = $1 AND teacher_profile_id = $2`
	_, err := r.db.Exec(ctx, query, locID, profileID)
	return err
}

