package domain_test

import (
	"sync"
	"testing"
)

// ClassEnrollmentSimulator mirrors the PostgreSQL atomic locking logic in memory
type ClassEnrollmentSimulator struct {
	mu           sync.Mutex
	Capacity     int
	EnrolledList []string
	Waitlist     []string
}

func (s *ClassEnrollmentSimulator) EnrollStudent(studentID string) string {
	// Mutex represents PostgreSQL "SELECT ... FOR UPDATE" row-level locking
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.EnrolledList) < s.Capacity {
		s.EnrolledList = append(s.EnrolledList, studentID)
		return "ENROLLED"
	}

	s.Waitlist = append(s.Waitlist, studentID)
	return "WAITLISTED"
}

func TestAtomicCapacityConcurrency(t *testing.T) {
	const classCapacity = 20
	const totalApplicants = 50

	simulator := &ClassEnrollmentSimulator{
		Capacity:     classCapacity,
		EnrolledList: make([]string, 0, classCapacity),
		Waitlist:     make([]string, 0, totalApplicants-classCapacity),
	}

	var wg sync.WaitGroup
	results := make([]string, totalApplicants)

	// Launch 50 concurrent goroutines to simulate simultaneous enrollments
	for i := 0; i < totalApplicants; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			studentID := string(rune('A' + idx))
			results[idx] = simulator.EnrollStudent(studentID)
		}(i)
	}

	wg.Wait()

	// Verify exact boundary constraints
	enrolledCount := 0
	waitlistCount := 0

	for _, res := range results {
		if res == "ENROLLED" {
			enrolledCount++
		} else if res == "WAITLISTED" {
			waitlistCount++
		}
	}

	if enrolledCount != classCapacity {
		t.Fatalf("expected exactly %d enrolled students, got %d", classCapacity, enrolledCount)
	}

	if waitlistCount != (totalApplicants - classCapacity) {
		t.Fatalf("expected exactly %d waitlisted students, got %d", totalApplicants-classCapacity, waitlistCount)
	}

	if len(simulator.EnrolledList) != classCapacity {
		t.Errorf("internal enrolled slice length mismatch: expected %d, got %d", classCapacity, len(simulator.EnrolledList))
	}
}

