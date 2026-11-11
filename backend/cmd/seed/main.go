package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	_ = godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close(ctx)

	adminHash, _ := bcrypt.GenerateFromPassword([]byte("admin1234"), bcrypt.DefaultCost)
	teacherHash, _ := bcrypt.GenerateFromPassword([]byte("teacher1234"), bcrypt.DefaultCost)
	learnerHash, _ := bcrypt.GenerateFromPassword([]byte("learner1234"), bcrypt.DefaultCost)

	// 1. Insert Admin User if not exists
	var adminID string
	err = conn.QueryRow(ctx, "SELECT id FROM users WHERE email = 'admin@jibreel.app'").Scan(&adminID)
	if err != nil {
		err = conn.QueryRow(ctx, `
			INSERT INTO users (email, phone_number, full_name, password_hash, gender, country, preferred_language, roles)
			VALUES ($1, $2, $3, $4, 'MALE', 'Ghana', 'English', ARRAY['ADMIN'::user_role])
			RETURNING id
		`, "admin@jibreel.app", "+233240000001", "Administrator", string(adminHash)).Scan(&adminID)
		if err != nil {
			log.Fatalf("Failed to insert admin: %v", err)
		}
		fmt.Printf("Created Admin user: admin@jibreel.app (id: %s)\n", adminID)
	} else {
		fmt.Printf("Admin user already exists (id: %s)\n", adminID)
	}

	// 2. Insert Learner User & Profile if not exists
	var learnerUserID string
	err = conn.QueryRow(ctx, "SELECT id FROM users WHERE email = 'learner@jibreel.app'").Scan(&learnerUserID)
	if err != nil {
		err = conn.QueryRow(ctx, `
			INSERT INTO users (email, phone_number, full_name, password_hash, gender, country, preferred_language, roles)
			VALUES ($1, $2, $3, $4, 'MALE', 'Ghana', 'English', ARRAY['LEARNER'::user_role])
			RETURNING id
		`, "learner@jibreel.app", "+233240000003", "Hamza Adam", string(learnerHash)).Scan(&learnerUserID)
		if err != nil {
			log.Fatalf("Failed to insert learner: %v", err)
		}

		var learnerProfileID string
		err = conn.QueryRow(ctx, `
			INSERT INTO learner_profiles (user_id, knowledge_level, learning_goals, preferred_format)
			VALUES ($1, 'BEGINNER', ARRAY['Tajweed', 'Quran Recitation'], 'COMBINATION')
			RETURNING id
		`, learnerUserID).Scan(&learnerProfileID)
		if err != nil {
			log.Fatalf("Failed to insert learner profile: %v", err)
		}
		fmt.Printf("Created Learner user: learner@jibreel.app (id: %s)\n", learnerUserID)
	} else {
		fmt.Printf("Learner user already exists (id: %s)\n", learnerUserID)
	}

	// 3. Insert Teacher User & Profile if not exists
	var teacherUserID string
	err = conn.QueryRow(ctx, "SELECT id FROM users WHERE email = 'teacher@jibreel.app'").Scan(&teacherUserID)
	var teacherProfileID string
	if err != nil {
		err = conn.QueryRow(ctx, `
			INSERT INTO users (email, phone_number, full_name, password_hash, gender, country, preferred_language, roles)
			VALUES ($1, $2, $3, $4, 'MALE', 'Ghana', 'English', ARRAY['TEACHER'::user_role])
			RETURNING id
		`, "teacher@jibreel.app", "+233240000002", "Sheikh Dr. Ibrahim Danlad", string(teacherHash)).Scan(&teacherUserID)
		if err != nil {
			log.Fatalf("Failed to insert teacher: %v", err)
		}

		err = conn.QueryRow(ctx, `
			INSERT INTO teacher_profiles (user_id, status, bio, islamic_education, years_experience, expertise_areas, languages_spoken, teaching_format, is_accepting_students)
			VALUES ($1, 'APPROVED', 'Senior lecturer at Islamic University College Ghana and graduate of Al-Azhar University.', 'Ph.D. in Islamic Jurisprudence (Al-Azhar University, Cairo), Ijazah in Hafs an Asim', 15, ARRAY['Tajweed', 'Fiqh', 'Aqeedah'], ARRAY['English', 'Arabic', 'Hausa'], 'ONLINE', true)
			RETURNING id
		`, teacherUserID).Scan(&teacherProfileID)
		if err != nil {
			log.Fatalf("Failed to insert teacher profile: %v", err)
		}
		fmt.Printf("Created Teacher: teacher@jibreel.app (profile_id: %s)\n", teacherProfileID)
	} else {
		_ = conn.QueryRow(ctx, "SELECT id FROM teacher_profiles WHERE user_id = $1", teacherUserID).Scan(&teacherProfileID)
		fmt.Printf("Teacher user already exists (id: %s)\n", teacherUserID)
	}

	// Insert Sample Madrassa Class
	var classID string
	err = conn.QueryRow(ctx, `
		INSERT INTO madrassa_classes (teacher_profile_id, title, description, subject, language, level, capacity, visibility, enrollment_mode, status, recurring_schedule, default_meet_link)
		VALUES ($1, 'Foundations of Tajweed & Recitation', 'A weekly structured group circle focusing on Makhaarij and Ahkam An-Nun As-Sakinah.', 'Tajweed', 'English', 'BEGINNER', 20, 'PUBLIC', 'OPEN', 'PUBLISHED', 'Saturdays 7:00 PM GMT', 'https://meet.google.com/abc-defg-hij')
		RETURNING id
	`, teacherProfileID).Scan(&classID)
	if err != nil {
		log.Fatalf("Failed to insert sample class: %v", err)
	}
	fmt.Printf("Created Sample Class: %s (id: %s)\n", "Foundations of Tajweed", classID)

	// Insert Sample Question
	var questionID string
	err = conn.QueryRow(ctx, `
		INSERT INTO questions (author_id, subject, title, content, scope, is_anonymous, status)
		VALUES ($1, 'Taharah', 'Ruling on wiping over socks during cold weather in Ghana', 'Assalamu alaykum, is it permissible to wipe over thick leather or wool socks during morning prayers?', 'COMMUNITY', false, 'ANSWERED')
		RETURNING id
	`, adminID).Scan(&questionID)
	if err != nil {
		log.Fatalf("Failed to insert sample question: %v", err)
	}

	// Insert Sample Answer
	_, err = conn.Exec(ctx, `
		INSERT INTO answers (question_id, teacher_profile_id, content, is_approved)
		VALUES ($1, $2, 'Wa alaykumussalam wa Rahmatullah. Yes, it is permissible to wipe over socks (Khuffayn or thick socks fulfilling the conditions) according to the authentic Sunnah of the Prophet (peace be upon him), provided they were put on while in a state of complete purification.', true)
	`, questionID, teacherProfileID)
	if err != nil {
		log.Fatalf("Failed to insert answer: %v", err)
	}
	fmt.Printf("Created Sample Q&A (id: %s)\n", questionID)

	// 4. Seed Physical Teaching Locations for PostGIS Spatial Search
	_, _ = conn.Exec(ctx, `
		INSERT INTO teacher_locations (teacher_profile_id, location_name, address, city, region, location_type, latitude, longitude, is_active)
		VALUES 
		($1, 'Madina Central Madrassa', 'Madina Zongo Junction, Accra', 'Accra', 'Greater Accra', 'MADRASSA', 5.6680, -0.1670, true),
		($1, 'East Legon Islamic Study Hub', 'Lagos Avenue, East Legon', 'Accra', 'Greater Accra', 'ISLAMIC_CENTER', 5.6350, -0.1550, true)
		ON CONFLICT DO NOTHING;
	`, teacherProfileID)
	fmt.Println("Seeded teacher physical teaching locations!")

	fmt.Println("Initial database seed completed successfully!")
}

