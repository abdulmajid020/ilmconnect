package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to Neon DB: %v", err)
	}
	defer conn.Close(ctx)

	fmt.Println("Connected successfully to Neon PostgreSQL database!")

	// Create schema_migrations table if not exists to track applied migrations
	_, err = conn.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(100) PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		log.Fatalf("Failed to initialize schema_migrations: %v", err)
	}

	// If users table already existed before schema_migrations was created, mark 000001 as applied
	var usersTableExists bool
	_ = conn.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')").Scan(&usersTableExists)
	if usersTableExists {
		_, _ = conn.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ('000001_init_schema.up.sql') ON CONFLICT DO NOTHING")
	}

	// Read migration files
	files, err := os.ReadDir("migrations")
	if err != nil {
		log.Fatalf("Failed to read migrations directory: %v", err)
	}

	var upFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".up.sql") {
			upFiles = append(upFiles, f.Name())
		}
	}
	sort.Strings(upFiles)

	for _, file := range upFiles {
		var applied bool
		err = conn.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)", file).Scan(&applied)
		if err != nil {
			log.Fatalf("Failed to check migration %s: %v", file, err)
		}

		if applied {
			fmt.Printf("Migration %s already applied.\n", file)
			continue
		}

		fmt.Printf("Applying migration %s...\n", file)
		content, err := os.ReadFile(filepath.Join("migrations", file))
		if err != nil {
			log.Fatalf("Failed to read %s: %v", file, err)
		}

		_, err = conn.Exec(ctx, string(content))
		if err != nil {
			log.Fatalf("Failed executing %s: %v", file, err)
		}

		_, err = conn.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", file)
		if err != nil {
			log.Fatalf("Failed recording migration %s: %v", file, err)
		}
		fmt.Printf("✅ Migration %s applied successfully!\n", file)
	}

	// List tables
	rows, err := conn.Query(ctx, "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
	if err != nil {
		log.Fatalf("Failed to list tables: %v", err)
	}
	defer rows.Close()

	fmt.Println("\nPublic tables in Neon DB:")
	for rows.Next() {
		var name string
		_ = rows.Scan(&name)
		fmt.Printf(" - %s\n", name)
	}
}
