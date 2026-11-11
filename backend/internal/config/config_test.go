package config_test

import (
	"os"
	"testing"

	"zoq/backend/internal/config"
)

func TestConfigDefaults(t *testing.T) {
	os.Clearenv()

	cfg := config.Load()

	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.CORSOrigin != "*" {
		t.Errorf("expected default CORSOrigin '*', got %s", cfg.CORSOrigin)
	}
	if cfg.Environment != "development" {
		t.Errorf("expected default environment 'development', got %s", cfg.Environment)
	}
	if cfg.JWTSecret == "" {
		t.Error("expected non-empty default JWTSecret")
	}
}

func TestConfigEnvOverrides(t *testing.T) {
	os.Setenv("PORT", "9090")
	os.Setenv("CORS_ORIGIN", "https://ilmconnect.org")
	os.Setenv("ENV", "production")
	os.Setenv("JWT_SECRET", "custom-production-secret")
	defer os.Clearenv()

	cfg := config.Load()

	if cfg.Port != "9090" {
		t.Errorf("expected port 9090, got %s", cfg.Port)
	}
	if cfg.CORSOrigin != "https://ilmconnect.org" {
		t.Errorf("expected CORSOrigin 'https://ilmconnect.org', got %s", cfg.CORSOrigin)
	}
	if cfg.Environment != "production" {
		t.Errorf("expected environment 'production', got %s", cfg.Environment)
	}
	if cfg.JWTSecret != "custom-production-secret" {
		t.Errorf("expected custom JWTSecret, got %s", cfg.JWTSecret)
	}
}

