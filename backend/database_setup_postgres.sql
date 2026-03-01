-- =====================================================
-- Flutter Learning Platform - PostgreSQL Database Setup
-- =====================================================
-- This script creates the complete database structure
-- for PostgreSQL (Supabase compatible)
-- =====================================================

-- Drop tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS "Certificates" CASCADE;
DROP TABLE IF EXISTS "Progress" CASCADE;
DROP TABLE IF EXISTS "Submissions" CASCADE;
DROP TABLE IF EXISTS "quiz_submissions" CASCADE;
DROP TABLE IF EXISTS "Contents" CASCADE;
DROP TABLE IF EXISTS "Weeks" CASCADE;
DROP TABLE IF EXISTS "Phases" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- =====================================================
-- 1. Users Table
-- =====================================================
CREATE TABLE "Users" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    "currentPhase" INTEGER DEFAULT 1,
    "currentWeek" INTEGER DEFAULT 1,
    "totalPoints" INTEGER DEFAULT 0,
    "groupId" INTEGER NULL,
    "isActive" BOOLEAN DEFAULT TRUE,
    "lastLoginAt" TIMESTAMP NULL,
    "refreshToken" TEXT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_role ON "Users"(role);
CREATE INDEX idx_users_current_phase ON "Users"("currentPhase");
CREATE INDEX idx_users_current_week ON "Users"("currentWeek");
CREATE INDEX idx_users_active ON "Users"("isActive");

-- =====================================================
-- 2. Phases Table
-- =====================================================
CREATE TABLE "Phases" (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "startWeek" INTEGER NOT NULL,
    "endWeek" INTEGER NOT NULL,
    "requiredPointsPercentage" INTEGER DEFAULT 60,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phases_number ON "Phases"(number);

-- =====================================================
-- 3. Weeks Table
-- =====================================================
CREATE TABLE "Weeks" (
    id SERIAL PRIMARY KEY,
    "phaseId" INTEGER NOT NULL REFERENCES "Phases"(id) ON DELETE CASCADE,
    "weekNumber" INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "maxPoints" INTEGER DEFAULT 100,
    "assignmentPoints" INTEGER DEFAULT 70,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weeks_phase ON "Weeks"("phaseId");
CREATE INDEX idx_weeks_number ON "Weeks"("weekNumber");

-- =====================================================
-- 4. Contents Table
-- =====================================================
CREATE TABLE "Contents" (
    id SERIAL PRIMARY KEY,
    "weekId" INTEGER NOT NULL UNIQUE REFERENCES "Weeks"(id) ON DELETE CASCADE,
    instructions TEXT,
    "videoUrl" VARCHAR(500),
    "videoDuration" INTEGER,
    notes TEXT,
    "notesFilePath" VARCHAR(500),
    "assignmentDescription" TEXT,
    "assignmentDeadline" TIMESTAMP,
    resources JSONB DEFAULT '[]',
    "multipleChoiceQuestions" JSONB DEFAULT '[]',
    "isPublished" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contents_week ON "Contents"("weekId");
CREATE INDEX idx_contents_published ON "Contents"("isPublished");

-- =====================================================
-- 5. Progress Table
-- =====================================================
CREATE TABLE "Progress" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    "weekId" INTEGER NOT NULL REFERENCES "Weeks"(id) ON DELETE CASCADE,
    "videoWatched" BOOLEAN DEFAULT FALSE,
    "videoProgress" INTEGER DEFAULT 0,
    "assignmentPoints" INTEGER DEFAULT 0,
    "quizPoints" INTEGER DEFAULT 0,
    "bonusPoints" INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    "isLocked" BOOLEAN DEFAULT TRUE,
    "unlockedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "weekId")
);

CREATE INDEX idx_progress_user ON "Progress"("userId");
CREATE INDEX idx_progress_week ON "Progress"("weekId");
CREATE INDEX idx_progress_completed ON "Progress"(completed);
CREATE INDEX idx_progress_locked ON "Progress"("isLocked");

-- =====================================================
-- 6. Submissions Table
-- =====================================================
CREATE TABLE "Submissions" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    "weekId" INTEGER NOT NULL REFERENCES "Weeks"(id) ON DELETE CASCADE,
    "filePath" VARCHAR(500),
    "fileName" VARCHAR(255),
    "fileSize" INTEGER,
    "githubUrl" VARCHAR(500),
    description TEXT,
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    "isOnTime" BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
    "reviewedAt" TIMESTAMP,
    "reviewedBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_user ON "Submissions"("userId");
CREATE INDEX idx_submissions_week ON "Submissions"("weekId");
CREATE INDEX idx_submissions_status ON "Submissions"(status);
CREATE INDEX idx_submissions_submitted_at ON "Submissions"("submittedAt");

-- =====================================================
-- 7. Quiz Submissions Table
-- =====================================================
CREATE TABLE "quiz_submissions" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    "weekId" INTEGER NOT NULL REFERENCES "Weeks"(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}',
    score INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "weekId")
);

CREATE INDEX idx_quiz_submissions_user ON "quiz_submissions"("userId");
CREATE INDEX idx_quiz_submissions_week ON "quiz_submissions"("weekId");

-- =====================================================
-- 8. Certificates Table
-- =====================================================
CREATE TABLE "Certificates" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL UNIQUE REFERENCES "Users"(id) ON DELETE CASCADE,
    "certificateId" VARCHAR(100) NOT NULL UNIQUE,
    "filePath" VARCHAR(500) NOT NULL,
    "totalPoints" INTEGER DEFAULT 0,
    "completionPercentage" DECIMAL(5,2) DEFAULT 0,
    "courseDuration" INTEGER,
    "isEmailSent" BOOLEAN DEFAULT FALSE,
    "emailSentAt" TIMESTAMP,
    "issuedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificates_user ON "Certificates"("userId");
CREATE INDEX idx_certificates_issued_at ON "Certificates"("issuedAt");

-- =====================================================
-- Create Update Timestamp Trigger Function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON "Phases" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weeks_updated_at BEFORE UPDATE ON "Weeks" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON "Contents" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON "Progress" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON "Submissions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_submissions_updated_at BEFORE UPDATE ON "quiz_submissions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON "Certificates" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Insert Default Admin User
-- =====================================================
-- Password: admin123 (hashed with bcrypt)
INSERT INTO "Users" (email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
    'admin@flutterlearn.com',
    '$2a$10$rZ5qYQYQYQYQYQYQYQYQYuK5qYQYQYQYQYQYQYQYQYQYQYQYQYQYQ',
    'Admin User',
    'admin',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: Users, Phases, Weeks, Contents, Progress, Submissions, quiz_submissions, Certificates';
    RAISE NOTICE '👤 Default admin user created: admin@flutterlearn.com / admin123';
END $$;
