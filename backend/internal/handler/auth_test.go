package handler_test

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestPasswordHashingAndVerification(t *testing.T) {
	password := "SecretP@ssw0rd123!"

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	// 1. Correct password should match
	if err := bcrypt.CompareHashAndPassword(hashed, []byte(password)); err != nil {
		t.Errorf("expected correct password to match hash, got error: %v", err)
	}

	// 2. Incorrect password should fail
	if err := bcrypt.CompareHashAndPassword(hashed, []byte("WrongP@ssword")); err == nil {
		t.Error("expected wrong password to fail verification, but it passed")
	}
}

