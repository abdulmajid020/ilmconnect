-- DOWN MIGRATION: Drop all tables and enums in reverse order

DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS class_sessions CASCADE;
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS madrassa_classes CASCADE;
DROP TABLE IF EXISTS teacher_student_relationships CASCADE;
DROP TABLE IF EXISTS learning_requests CASCADE;
DROP TABLE IF EXISTS teacher_credentials CASCADE;
DROP TABLE IF EXISTS teacher_profiles CASCADE;
DROP TABLE IF EXISTS learner_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS question_status;
DROP TYPE IF EXISTS question_scope;
DROP TYPE IF EXISTS session_status;
DROP TYPE IF EXISTS enrollment_status;
DROP TYPE IF EXISTS class_status;
DROP TYPE IF EXISTS enrollment_mode;
DROP TYPE IF EXISTS class_visibility;
DROP TYPE IF EXISTS relationship_status;
DROP TYPE IF EXISTS request_status;
DROP TYPE IF EXISTS teaching_delivery;
DROP TYPE IF EXISTS teacher_status;
DROP TYPE IF EXISTS learning_format;
DROP TYPE IF EXISTS knowledge_level;
DROP TYPE IF EXISTS gender_type;
DROP TYPE IF EXISTS user_role;

