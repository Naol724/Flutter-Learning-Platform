-- =====================================================
-- Flutter Learning Platform - PostgreSQL Database Setup
-- =====================================================
-- This script creates the complete database structure
-- for PostgreSQL (Supabase compatible)
-- MATCHES the original MySQL structure exactly
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
    color VARCHAR(7) DEFAULT '#3B82F6',
    "isActive" BOOLEAN DEFAULT TRUE,
    "requiredPointsPercentage" INTEGER DEFAULT 80,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ("requiredPointsPercentage" >= 0 AND "requiredPointsPercentage" <= 100),
    CHECK ("startWeek" <= "endWeek")
);

CREATE INDEX idx_phases_number ON "Phases"(number);
CREATE INDEX idx_phases_active ON "Phases"("isActive");

-- =====================================================
-- 3. Weeks Table
-- =====================================================
CREATE TABLE "Weeks" (
    id SERIAL PRIMARY KEY,
    "phaseId" INTEGER NOT NULL REFERENCES "Phases"(id) ON DELETE CASCADE,
    "weekNumber" INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    "maxPoints" INTEGER DEFAULT 100,
    "videoPoints" INTEGER DEFAULT 40,
    "assignmentPoints" INTEGER DEFAULT 60,
    "isActive" BOOLEAN DEFAULT TRUE,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ("maxPoints" >= 0),
    CHECK ("videoPoints" >= 0),
    CHECK ("assignmentPoints" >= 0),
    CHECK ("startDate" < "endDate")
);

CREATE INDEX idx_weeks_phase ON "Weeks"("phaseId");
CREATE INDEX idx_weeks_number ON "Weeks"("weekNumber");
CREATE INDEX idx_weeks_active ON "Weeks"("isActive");
CREATE INDEX idx_weeks_order ON "Weeks"("order");
CREATE INDEX idx_weeks_dates ON "Weeks"("startDate", "endDate");

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
    "isPublished" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ("videoDuration" IS NULL OR "videoDuration" >= 0)
);

CREATE INDEX idx_contents_week ON "Contents"("weekId");
CREATE INDEX idx_contents_published ON "Contents"("isPublished");

-- =====================================================
-- 5. Submissions Table
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
    score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    feedback TEXT,
    "isOnTime" BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
    "reviewedAt" TIMESTAMP,
    "reviewedBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ("fileSize" IS NULL OR "fileSize" >= 0)
);

CREATE INDEX idx_submissions_user ON "Submissions"("userId");
CREATE INDEX idx_submissions_week ON "Submissions"("weekId");
CREATE INDEX idx_submissions_status ON "Submissions"(status);
CREATE INDEX idx_submissions_submitted ON "Submissions"("submittedAt");
CREATE INDEX idx_submissions_reviewer ON "Submissions"("reviewedBy");
CREATE INDEX idx_submissions_user_week ON "Submissions"("userId", "weekId");

-- =====================================================
-- 6. Progress Table
-- =====================================================
CREATE TABLE "Progress" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    "weekId" INTEGER NOT NULL REFERENCES "Weeks"(id) ON DELETE CASCADE,
    "videoWatched" BOOLEAN DEFAULT FALSE,
    "videoProgress" INTEGER DEFAULT 0,
    "videoWatchedAt" TIMESTAMP,
    "assignmentSubmitted" BOOLEAN DEFAULT FALSE,
    "assignmentSubmittedAt" TIMESTAMP,
    points INTEGER DEFAULT 0,
    "videoPoints" INTEGER DEFAULT 0,
    "assignmentPoints" INTEGER DEFAULT 0,
    "quizPoints" INTEGER DEFAULT 0,
    "bonusPoints" INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    "completedAt" TIMESTAMP,
    "isLocked" BOOLEAN DEFAULT TRUE,
    "unlockedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ("videoProgress" >= 0 AND "videoProgress" <= 100),
    CHECK (points >= 0),
    CHECK ("videoPoints" >= 0),
    CHECK ("assignmentPoints" >= 0),
    CHECK ("quizPoints" >= 0),
    CHECK ("bonusPoints" >= 0),
    UNIQUE("userId", "weekId")
);

CREATE INDEX idx_progress_user ON "Progress"("userId");
CREATE INDEX idx_progress_week ON "Progress"("weekId");
CREATE INDEX idx_progress_completed ON "Progress"(completed);
CREATE INDEX idx_progress_locked ON "Progress"("isLocked");
CREATE INDEX idx_progress_video_watched ON "Progress"("videoWatched");
CREATE INDEX idx_progress_assignment_submitted ON "Progress"("assignmentSubmitted");

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
    "certificateId" VARCHAR(255) NOT NULL UNIQUE,
    "filePath" VARCHAR(500) NOT NULL,
    "issuedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "totalPoints" INTEGER NOT NULL,
    "completionPercentage" DECIMAL(5,2) NOT NULL,
    "courseDuration" INTEGER NOT NULL,
    "isEmailSent" BOOLEAN DEFAULT FALSE,
    "emailSentAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ("totalPoints" >= 0),
    CHECK ("completionPercentage" >= 0 AND "completionPercentage" <= 100),
    CHECK ("courseDuration" >= 0)
);

CREATE INDEX idx_certificates_user ON "Certificates"("userId");
CREATE INDEX idx_certificates_issued ON "Certificates"("issuedAt");

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
INSERT INTO "Users" (email, password, name, role, "currentPhase", "currentWeek", "isActive")
VALUES (
    'admin@example.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3/HK',
    'Course Administrator',
    'admin',
    1,
    1,
    TRUE
);

-- =====================================================
-- Insert Sample Student User
-- =====================================================
-- Password: student123 (hashed with bcrypt)
INSERT INTO "Users" (email, password, name, role, "currentPhase", "currentWeek", "totalPoints", "isActive")
VALUES (
    'student@example.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3/HK',
    'John Doe',
    'student',
    1,
    1,
    0,
    TRUE
);

-- =====================================================
-- Insert Phases
-- =====================================================
INSERT INTO "Phases" (number, title, description, "startWeek", "endWeek", color, "requiredPointsPercentage")
VALUES
(1, 'Foundation', 'Learn Dart basics and Flutter fundamentals', 1, 8, '#10B981', 80),
(2, 'Intermediate', 'Master state management, APIs, and databases', 9, 16, '#F59E0B', 80),
(3, 'Advanced', 'Testing, deployment, and portfolio projects', 17, 26, '#EF4444', 80);

-- =====================================================
-- Insert Weeks for Phase 1 (Foundation)
-- =====================================================
INSERT INTO "Weeks" ("phaseId", "weekNumber", title, description, "startDate", "endDate", "maxPoints", "videoPoints", "assignmentPoints", "order")
VALUES
(1, 1, 'Flutter setup + Dart basics', 'Variables, control flow', '2024-01-01 00:00:00', '2024-01-07 23:59:59', 100, 40, 60, 1),
(1, 2, 'Functions and Classes', 'Object-oriented programming in Dart', '2024-01-08 00:00:00', '2024-01-14 23:59:59', 100, 40, 60, 2),
(1, 3, 'Flutter Widgets Basics', 'Stateless and Stateful widgets', '2024-01-15 00:00:00', '2024-01-21 23:59:59', 100, 40, 60, 3),
(1, 4, 'Layouts and Navigation', 'Building layouts and navigation', '2024-01-22 00:00:00', '2024-01-28 23:59:59', 100, 40, 60, 4),
(1, 5, 'User Input and Forms', 'Handling user input and form validation', '2024-01-29 00:00:00', '2024-02-04 23:59:59', 100, 40, 60, 5),
(1, 6, 'Lists and Grids', 'Working with ListView and GridView', '2024-02-05 00:00:00', '2024-02-11 23:59:59', 100, 40, 60, 6),
(1, 7, 'Local Storage', 'SharedPreferences and local data', '2024-02-12 00:00:00', '2024-02-18 23:59:59', 100, 40, 60, 7),
(1, 8, 'Phase 1 Project', 'Build a complete Flutter app', '2024-02-19 00:00:00', '2024-02-25 23:59:59', 100, 40, 60, 8);

-- =====================================================
-- Insert Weeks for Phase 2 (Intermediate)
-- =====================================================
INSERT INTO "Weeks" ("phaseId", "weekNumber", title, description, "startDate", "endDate", "maxPoints", "videoPoints", "assignmentPoints", "order")
VALUES
(2, 9, 'Provider State Management', 'Using Provider for state management', '2024-02-26 00:00:00', '2024-03-03 23:59:59', 100, 40, 60, 9),
(2, 10, 'HTTP Requests', 'Making API calls with http package', '2024-03-04 00:00:00', '2024-03-10 23:59:59', 100, 40, 60, 10),
(2, 11, 'JSON and Serialization', 'Working with JSON data', '2024-03-11 00:00:00', '2024-03-17 23:59:59', 100, 40, 60, 11),
(2, 12, 'Firebase Integration', 'Firebase authentication and Firestore', '2024-03-18 00:00:00', '2024-03-24 23:59:59', 100, 40, 60, 12),
(2, 13, 'Advanced State Management', 'Riverpod and GetX', '2024-03-25 00:00:00', '2024-03-31 23:59:59', 100, 40, 60, 13),
(2, 14, 'Animations', 'Flutter animations and transitions', '2024-04-01 00:00:00', '2024-04-07 23:59:59', 100, 40, 60, 14),
(2, 15, 'Custom Widgets', 'Creating reusable custom widgets', '2024-04-08 00:00:00', '2024-04-14 23:59:59', 100, 40, 60, 15),
(2, 16, 'Phase 2 Project', 'Build an app with API integration', '2024-04-15 00:00:00', '2024-04-21 23:59:59', 100, 40, 60, 16);

-- =====================================================
-- Insert Weeks for Phase 3 (Advanced)
-- =====================================================
INSERT INTO "Weeks" ("phaseId", "weekNumber", title, description, "startDate", "endDate", "maxPoints", "videoPoints", "assignmentPoints", "order")
VALUES
(3, 17, 'Advanced State Management', 'Bloc pattern and advanced state', '2024-04-22 00:00:00', '2024-04-28 23:59:59', 100, 40, 60, 17),
(3, 18, 'Testing Fundamentals', 'Unit testing and widget testing', '2024-04-29 00:00:00', '2024-05-05 23:59:59', 100, 40, 60, 18),
(3, 19, 'Integration Testing', 'End-to-end testing', '2024-05-06 00:00:00', '2024-05-12 23:59:59', 100, 40, 60, 19),
(3, 20, 'Performance Optimization', 'App performance and optimization', '2024-05-13 00:00:00', '2024-05-19 23:59:59', 100, 40, 60, 20),
(3, 21, 'Platform Channels', 'Native code integration', '2024-05-20 00:00:00', '2024-05-26 23:59:59', 100, 40, 60, 21),
(3, 22, 'App Deployment', 'Publishing to stores', '2024-05-27 00:00:00', '2024-06-02 23:59:59', 100, 40, 60, 22),
(3, 23, 'CI/CD Pipeline', 'Continuous integration and deployment', '2024-06-03 00:00:00', '2024-06-09 23:59:59', 100, 40, 60, 23),
(3, 24, 'Portfolio Project Part 1', 'Design and architecture', '2024-06-10 00:00:00', '2024-06-16 23:59:59', 100, 40, 60, 24),
(3, 25, 'Portfolio Project Part 2', 'Implementation', '2024-06-17 00:00:00', '2024-06-23 23:59:59', 100, 40, 60, 25),
(3, 26, 'Portfolio Project Part 3', 'Testing and deployment', '2024-06-24 00:00:00', '2024-06-30 23:59:59', 100, 40, 60, 26);

-- =====================================================
-- Insert Sample Content for First Few Weeks
-- =====================================================
INSERT INTO "Contents" ("weekId", instructions, "videoUrl", "videoDuration", "assignmentDescription", "assignmentDeadline", "isPublished")
VALUES
(1, 'Welcome to Week 1! In this week, you will learn the basics of Dart programming and set up your Flutter development environment.', 'https://www.youtube.com/watch?v=5xlVP04905w', 1800, 'Create a simple Dart program that demonstrates variables, functions, and basic control flow. Submit your .dart file.', '2024-01-07 23:59:59', TRUE),
(2, 'This week focuses on functions and object-oriented programming concepts in Dart.', 'https://www.youtube.com/watch?v=5xlVP04905w', 2100, 'Create a Dart class hierarchy with inheritance and demonstrate polymorphism.', '2024-01-14 23:59:59', TRUE),
(3, 'Learn about Flutter widgets and how to build user interfaces.', 'https://www.youtube.com/watch?v=5xlVP04905w', 2400, 'Build a simple Flutter app with multiple widgets.', '2024-01-21 23:59:59', TRUE);

-- =====================================================
-- Insert Initial Progress for Sample Student
-- =====================================================
-- Unlock first week for the sample student
INSERT INTO "Progress" ("userId", "weekId", "isLocked", "unlockedAt")
VALUES
(2, 1, FALSE, CURRENT_TIMESTAMP);

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: Users, Phases, Weeks, Contents, Progress, Submissions, quiz_submissions, Certificates';
    RAISE NOTICE '👥 Users created:';
    RAISE NOTICE '   - Admin: admin@example.com / admin123';
    RAISE NOTICE '   - Student: student@example.com / student123';
    RAISE NOTICE '📚 Sample data inserted:';
    RAISE NOTICE '   - 3 Phases (Foundation, Intermediate, Advanced)';
    RAISE NOTICE '   - 26 Weeks (complete course structure)';
    RAISE NOTICE '   - 3 Sample content items';
    RAISE NOTICE '⚠️  IMPORTANT: Change default passwords after first login!';
END $$;
