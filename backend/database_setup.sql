-- =====================================================
-- Flutter Learning Platform - Database Setup Script
-- =====================================================
-- This script creates the complete database structure
-- for the Flutter Learning Platform LMS
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS flutter_learning_platform 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE flutter_learning_platform;

-- Drop tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS Certificates;
DROP TABLE IF EXISTS Progress;
DROP TABLE IF EXISTS Submissions;
DROP TABLE IF EXISTS Contents;
DROP TABLE IF EXISTS Weeks;
DROP TABLE IF EXISTS Phases;
DROP TABLE IF EXISTS Users;

-- =====================================================
-- 1. Users Table
-- =====================================================
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    currentPhase INT DEFAULT 1,
    currentWeek INT DEFAULT 1,
    totalPoints INT DEFAULT 0,
    groupId INT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    lastLoginAt DATETIME NULL,
    refreshToken TEXT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_current_phase (currentPhase),
    INDEX idx_users_current_week (currentWeek),
    INDEX idx_users_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. Phases Table
-- =====================================================
CREATE TABLE Phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number INT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    startWeek INT NOT NULL,
    endWeek INT NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    isActive BOOLEAN DEFAULT TRUE,
    requiredPointsPercentage INT DEFAULT 80,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (requiredPointsPercentage >= 0 AND requiredPointsPercentage <= 100),
    CHECK (startWeek <= endWeek),
    
    -- Indexes
    INDEX idx_phases_number (number),
    INDEX idx_phases_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. Weeks Table
-- =====================================================
CREATE TABLE Weeks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phaseId INT NOT NULL,
    weekNumber INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    maxPoints INT DEFAULT 100,
    videoPoints INT DEFAULT 40,
    assignmentPoints INT DEFAULT 60,
    isActive BOOLEAN DEFAULT TRUE,
    `order` INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (phaseId) REFERENCES Phases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Constraints
    CHECK (maxPoints >= 0),
    CHECK (videoPoints >= 0),
    CHECK (assignmentPoints >= 0),
    CHECK (startDate < endDate),
    
    -- Indexes
    INDEX idx_weeks_phase (phaseId),
    INDEX idx_weeks_number (weekNumber),
    INDEX idx_weeks_active (isActive),
    INDEX idx_weeks_order (`order`),
    INDEX idx_weeks_dates (startDate, endDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. Contents Table
-- =====================================================
CREATE TABLE Contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weekId INT NOT NULL UNIQUE,
    instructions TEXT NULL,
    videoUrl VARCHAR(500) NULL,
    videoDuration INT NULL,
    notes TEXT NULL,
    notesFilePath VARCHAR(500) NULL,
    assignmentDescription TEXT NULL,
    assignmentDeadline DATETIME NULL,
    resources JSON NULL,
    isPublished BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (weekId) REFERENCES Weeks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Constraints
    CHECK (videoDuration IS NULL OR videoDuration >= 0),
    
    -- Indexes
    INDEX idx_contents_week (weekId),
    INDEX idx_contents_published (isPublished)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. Submissions Table
-- =====================================================
CREATE TABLE Submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    weekId INT NOT NULL,
    filePath VARCHAR(500) NULL,
    fileName VARCHAR(255) NULL,
    fileSize INT NULL,
    githubUrl VARCHAR(500) NULL,
    description TEXT NULL,
    submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    score INT NULL,
    feedback TEXT NULL,
    isOnTime BOOLEAN DEFAULT TRUE,
    status ENUM('submitted', 'reviewed', 'approved', 'rejected') DEFAULT 'submitted',
    reviewedAt DATETIME NULL,
    reviewedBy INT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (weekId) REFERENCES Weeks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (reviewedBy) REFERENCES Users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Constraints
    CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    CHECK (fileSize IS NULL OR fileSize >= 0),
    
    -- Indexes
    INDEX idx_submissions_user (userId),
    INDEX idx_submissions_week (weekId),
    INDEX idx_submissions_status (status),
    INDEX idx_submissions_submitted (submittedAt),
    INDEX idx_submissions_reviewer (reviewedBy),
    INDEX idx_submissions_user_week (userId, weekId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. Progress Table
-- =====================================================
CREATE TABLE Progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    weekId INT NOT NULL,
    videoWatched BOOLEAN DEFAULT FALSE,
    videoProgress INT DEFAULT 0,
    videoWatchedAt DATETIME NULL,
    assignmentSubmitted BOOLEAN DEFAULT FALSE,
    assignmentSubmittedAt DATETIME NULL,
    points INT DEFAULT 0,
    videoPoints INT DEFAULT 0,
    assignmentPoints INT DEFAULT 0,
    bonusPoints INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completedAt DATETIME NULL,
    isLocked BOOLEAN DEFAULT TRUE,
    unlockedAt DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (weekId) REFERENCES Weeks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Constraints
    CHECK (videoProgress >= 0 AND videoProgress <= 100),
    CHECK (points >= 0),
    CHECK (videoPoints >= 0),
    CHECK (assignmentPoints >= 0),
    CHECK (bonusPoints >= 0),
    
    -- Unique constraint
    UNIQUE KEY unique_user_week (userId, weekId),
    
    -- Indexes
    INDEX idx_progress_user (userId),
    INDEX idx_progress_week (weekId),
    INDEX idx_progress_completed (completed),
    INDEX idx_progress_locked (isLocked),
    INDEX idx_progress_video_watched (videoWatched),
    INDEX idx_progress_assignment_submitted (assignmentSubmitted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. Certificates Table
-- =====================================================
CREATE TABLE Certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL UNIQUE,
    certificateId VARCHAR(255) NOT NULL UNIQUE,
    filePath VARCHAR(500) NOT NULL,
    issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    totalPoints INT NOT NULL,
    completionPercentage FLOAT NOT NULL,
    courseDuration INT NOT NULL,
    isEmailSent BOOLEAN DEFAULT FALSE,
    emailSentAt DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Constraints
    CHECK (totalPoints >= 0),
    CHECK (completionPercentage >= 0 AND completionPercentage <= 100),
    CHECK (courseDuration >= 0),
    
    -- Indexes
    INDEX idx_certificates_user (userId),
    INDEX idx_certificates_certificate_id (certificateId),
    INDEX idx_certificates_issued (issuedAt),
    INDEX idx_certificates_email_sent (isEmailSent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert Initial Data
-- =====================================================

-- Insert Phases
INSERT INTO Phases (number, title, description, startWeek, endWeek, color, requiredPointsPercentage) VALUES
(1, 'Foundation', 'Learn Dart basics and Flutter fundamentals', 1, 8, '#10B981', 80),
(2, 'Intermediate', 'Master state management, APIs, and databases', 9, 16, '#F59E0B', 80),
(3, 'Advanced & Portfolio', 'Advanced topics, testing, deployment, and capstone projects', 17, 26, '#3B82F6', 80);

-- Insert Weeks for Phase 1 (Foundation)
INSERT INTO Weeks (phaseId, weekNumber, title, description, startDate, endDate, maxPoints, videoPoints, assignmentPoints, `order`) VALUES
(1, 1, 'Flutter setup + Dart basics', 'Variables, control flow', '2024-01-01 00:00:00', '2024-01-07 23:59:59', 100, 40, 60, 1),
(1, 2, 'Functions and Classes', 'Object-oriented programming in Dart', '2024-01-08 00:00:00', '2024-01-14 23:59:59', 100, 40, 60, 2),
(1, 3, 'Flutter Widgets Basics', 'StatelessWidget and StatefulWidget', '2024-01-15 00:00:00', '2024-01-21 23:59:59', 100, 40, 60, 3),
(1, 4, 'Layouts and Styling', 'Container, Row, Column, and styling', '2024-01-22 00:00:00', '2024-01-28 23:59:59', 100, 40, 60, 4),
(1, 5, 'User Input and Forms', 'TextField, Forms, and validation', '2024-01-29 00:00:00', '2024-02-04 23:59:59', 100, 40, 60, 5),
(1, 6, 'Navigation Basics', 'Navigator and routing', '2024-02-05 00:00:00', '2024-02-11 23:59:59', 100, 40, 60, 6),
(1, 7, 'Lists and Grids', 'ListView, GridView, and dynamic content', '2024-02-12 00:00:00', '2024-02-18 23:59:59', 100, 40, 60, 7),
(1, 8, 'State Management Intro', 'setState and basic state management', '2024-02-19 00:00:00', '2024-02-25 23:59:59', 100, 40, 60, 8);

-- Insert Weeks for Phase 2 (Intermediate)
INSERT INTO Weeks (phaseId, weekNumber, title, description, startDate, endDate, maxPoints, videoPoints, assignmentPoints, `order`) VALUES
(2, 9, 'Provider State Management', 'Using Provider for state management', '2024-02-26 00:00:00', '2024-03-03 23:59:59', 100, 40, 60, 9),
(2, 10, 'HTTP Requests', 'Making API calls with http package', '2024-03-04 00:00:00', '2024-03-10 23:59:59', 100, 40, 60, 10),
(2, 11, 'JSON and Serialization', 'Working with JSON data', '2024-03-11 00:00:00', '2024-03-17 23:59:59', 100, 40, 60, 11),
(2, 12, 'Local Storage', 'SharedPreferences and local data', '2024-03-18 00:00:00', '2024-03-24 23:59:59', 100, 40, 60, 12),
(2, 13, 'Database Integration', 'SQLite and database operations', '2024-03-25 00:00:00', '2024-03-31 23:59:59', 100, 40, 60, 13),
(2, 14, 'Advanced Navigation', 'Named routes and navigation patterns', '2024-04-01 00:00:00', '2024-04-07 23:59:59', 100, 40, 60, 14),
(2, 15, 'Animations', 'Basic animations and transitions', '2024-04-08 00:00:00', '2024-04-14 23:59:59', 100, 40, 60, 15),
(2, 16, 'Custom Widgets', 'Creating reusable custom widgets', '2024-04-15 00:00:00', '2024-04-21 23:59:59', 100, 40, 60, 16);

-- Insert Weeks for Phase 3 (Advanced)
INSERT INTO Weeks (phaseId, weekNumber, title, description, startDate, endDate, maxPoints, videoPoints, assignmentPoints, `order`) VALUES
(3, 17, 'Advanced State Management', 'Bloc pattern and advanced state', '2024-04-22 00:00:00', '2024-04-28 23:59:59', 100, 40, 60, 17),
(3, 18, 'Testing Fundamentals', 'Unit testing and widget testing', '2024-04-29 00:00:00', '2024-05-05 23:59:59', 100, 40, 60, 18),
(3, 19, 'Performance Optimization', 'App performance and optimization', '2024-05-06 00:00:00', '2024-05-12 23:59:59', 100, 40, 60, 19),
(3, 20, 'Platform Integration', 'Platform channels and native code', '2024-05-13 00:00:00', '2024-05-19 23:59:59', 100, 40, 60, 20),
(3, 21, 'App Deployment', 'Publishing to app stores', '2024-05-20 00:00:00', '2024-05-26 23:59:59', 100, 40, 60, 21),
(3, 22, 'Capstone Project Planning', 'Planning your final project', '2024-05-27 00:00:00', '2024-06-02 23:59:59', 100, 40, 60, 22),
(3, 23, 'Capstone Development 1', 'Building your capstone project', '2024-06-03 00:00:00', '2024-06-09 23:59:59', 100, 40, 60, 23),
(3, 24, 'Capstone Development 2', 'Continuing capstone development', '2024-06-10 00:00:00', '2024-06-16 23:59:59', 100, 40, 60, 24),
(3, 25, 'Capstone Testing & Polish', 'Testing and polishing your app', '2024-06-17 00:00:00', '2024-06-23 23:59:59', 100, 40, 60, 25),
(3, 26, 'Capstone Presentation', 'Final project presentation', '2024-06-24 00:00:00', '2024-06-30 23:59:59', 100, 40, 60, 26);

-- Insert sample content for first few weeks
INSERT INTO Contents (weekId, instructions, videoUrl, videoDuration, assignmentDescription, assignmentDeadline, isPublished) VALUES
(1, 'Welcome to Week 1! In this week, you will learn the basics of Dart programming and set up your Flutter development environment.', 'https://www.youtube.com/watch?v=5xlVP04905w', 1800, 'Create a simple Dart program that demonstrates variables, functions, and basic control flow. Submit your .dart file.', '2024-01-07 23:59:59', TRUE),
(2, 'This week focuses on functions and object-oriented programming concepts in Dart.', 'https://www.youtube.com/watch?v=5xlVP04905w', 2100, 'Create a Dart class hierarchy with inheritance and demonstrate polymorphism.', '2024-01-14 23:59:59', TRUE),
(3, 'Learn about Flutter widgets and how to create your first Flutter app.', 'https://www.youtube.com/watch?v=5xlVP04905w', 1950, 'Build a simple Flutter app with both StatelessWidget and StatefulWidget.', '2024-01-21 23:59:59', TRUE);

-- Insert admin user (password: admin123)
INSERT INTO Users (email, password, name, role, currentPhase, currentWeek, isActive) VALUES
('admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3/HK', 'Course Administrator', 'admin', 1, 1, TRUE);

-- Insert sample student user (password: student123)
INSERT INTO Users (email, password, name, role, currentPhase, currentWeek, totalPoints, isActive) VALUES
('student@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3/HK', 'John Doe', 'student', 1, 1, 0, TRUE);

-- Insert initial progress for the sample student (unlock first week)
INSERT INTO Progress (userId, weekId, isLocked, unlockedAt) VALUES
(2, 1, FALSE, NOW());

-- =====================================================
-- Success Message
-- =====================================================
SELECT '✅ Database setup completed successfully!' as status,
       'Default users: admin@example.com/admin123, student@example.com/student123' as credentials;