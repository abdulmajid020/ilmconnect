-- =====================================================================
-- ILMCONNECT / ZOQ DATABASE INITIALIZATION SCHEMA (POSTGRESQL)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('LEARNER', 'TEACHER', 'ADMIN');
CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE');
CREATE TYPE knowledge_level AS ENUM ('BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'PREFER_ASSESSMENT');
CREATE TYPE learning_format AS ENUM ('ONE_ON_ONE', 'GROUP_MADRASSA', 'SELF_PACED', 'COMBINATION');
CREATE TYPE teacher_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED', 'SUSPENDED');
CREATE TYPE teaching_delivery AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');
CREATE TYPE request_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');
CREATE TYPE relationship_status AS ENUM ('ACTIVE', 'PAUSED', 'TERMINATED');
CREATE TYPE class_visibility AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');
CREATE TYPE enrollment_mode AS ENUM ('OPEN', 'APPROVAL_REQUIRED');
CREATE TYPE class_status AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE enrollment_status AS ENUM ('ENROLLED', 'WAITLISTED', 'PENDING_APPROVAL', 'REJECTED', 'DROPPED');
CREATE TYPE session_status AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE question_scope AS ENUM ('PRIVATE_SHEIKH', 'COMMUNITY');
CREATE TYPE question_status AS ENUM ('OPEN', 'ANSWERED', 'CLOSED', 'FLAGGED');

-- 3. USERS (SINGLE IDENTITY MODEL)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    gender gender_type NOT NULL,
    country VARCHAR(100) DEFAULT 'Ghana',
    preferred_language VARCHAR(50) DEFAULT 'English',
    roles user_role[] DEFAULT ARRAY['LEARNER'::user_role],
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);

-- 4. LEARNER PROFILES
CREATE TABLE learner_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    knowledge_level knowledge_level DEFAULT 'BEGINNER',
    learning_goals TEXT[] DEFAULT '{}',
    preferred_format learning_format DEFAULT 'COMBINATION',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. TEACHER PROFILES & CREDENTIALS
CREATE TABLE teacher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status teacher_status DEFAULT 'DRAFT',
    bio TEXT,
    islamic_education TEXT NOT NULL,
    years_experience INT DEFAULT 0,
    expertise_areas TEXT[] DEFAULT '{}',
    languages_spoken TEXT[] DEFAULT '{"English"}',
    teaching_format teaching_delivery DEFAULT 'ONLINE',
    is_accepting_students BOOLEAN DEFAULT TRUE,
    review_notes TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_status ON teacher_profiles(status);

CREATE TABLE teacher_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_profile_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    document_title VARCHAR(150) NOT NULL,
    document_url TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'Ijazah', 'Certificate', 'ID'
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. 1-ON-1 SHEIKH MATCHING
CREATE TABLE learning_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_profile_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    learner_message TEXT,
    status request_status DEFAULT 'PENDING',
    decline_reason TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_learner ON learning_requests(learner_id, status);
CREATE INDEX idx_requests_teacher ON learning_requests(teacher_profile_id, status);

CREATE TABLE teacher_student_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_profile_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    teacher_profile_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    status relationship_status DEFAULT 'ACTIVE',
    meeting_schedule VARCHAR(255),
    google_meet_link TEXT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    CONSTRAINT uq_learner_subject_active UNIQUE (learner_profile_id, subject, status)
);

-- 7. GROUP MADRASSA CLASSES & SESSIONS
CREATE TABLE madrassa_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_profile_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    language VARCHAR(50) DEFAULT 'English',
    level knowledge_level DEFAULT 'BEGINNER',
    capacity INT DEFAULT 20, -- Default strict cap
    visibility class_visibility DEFAULT 'PUBLIC',
    enrollment_mode enrollment_mode DEFAULT 'APPROVAL_REQUIRED',
    status class_status DEFAULT 'DRAFT',
    recurring_schedule VARCHAR(255),
    default_meet_link TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_status ON madrassa_classes(status, visibility);
CREATE INDEX idx_classes_subject ON madrassa_classes(subject);

CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES madrassa_classes(id) ON DELETE CASCADE,
    learner_profile_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'PENDING_APPROVAL',
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_learner UNIQUE (class_id, learner_profile_id)
);

CREATE INDEX idx_enrollments_class ON class_enrollments(class_id, status);

CREATE TABLE class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES madrassa_classes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    session_date TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 60,
    meet_link TEXT,
    notes TEXT,
    status session_status DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_class_date ON class_sessions(class_id, session_date);

-- 8. ISLAMIC QUESTIONS & COMMUNITY BOARD
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    scope question_scope DEFAULT 'COMMUNITY',
    is_anonymous BOOLEAN DEFAULT FALSE,
    target_teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE SET NULL,
    status question_status DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_scope_status ON questions(scope, status);
CREATE INDEX idx_questions_author ON questions(author_id);

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    teacher_profile_id UUID NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answers_question ON answers(question_id);

-- 9. MESSAGING & NOTIFICATIONS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_one UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_two UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_participants UNIQUE (participant_one, participant_two)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- 'QUESTION', 'TEACHER', 'MESSAGE'
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

