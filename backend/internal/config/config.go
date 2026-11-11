package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DatabaseURL  string
	JWTSecret    string
	JWTExpiresIn string
	CORSOrigin   string
	Environment  string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		Port:         getEnv("PORT", "8080"),
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/zoq_dev?sslmode=disable"),
		JWTSecret:    getEnv("JWT_SECRET", "super-secret-dev-key-change-in-production"),
		JWTExpiresIn: getEnv("JWT_EXPIRES_IN", "7d"),
		CORSOrigin:   getEnv("CORS_ORIGIN", "*"),
		Environment:  getEnv("ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}

