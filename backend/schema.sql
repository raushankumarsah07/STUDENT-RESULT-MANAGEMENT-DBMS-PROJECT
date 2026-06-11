-- Student Result Management System - Database Schema
-- Run this file in PostgreSQL to set up all tables

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- 1. Students Table
CREATE TABLE students (
  student_id   SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100) UNIQUE NOT NULL,
  phone        VARCHAR(15),
  date_of_birth DATE,
  class        VARCHAR(20) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subjects Table
CREATE TABLE subjects (
  subject_id   SERIAL PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20) UNIQUE NOT NULL,
  max_marks    INT NOT NULL DEFAULT 100
);

-- 3. Marks Table
CREATE TABLE marks (
  mark_id        SERIAL PRIMARY KEY,
  student_id     INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  subject_id     INT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  marks_obtained INT NOT NULL CHECK (marks_obtained >= 0),
  exam_type      VARCHAR(50) DEFAULT 'Final',
  exam_date      DATE DEFAULT CURRENT_DATE,
  UNIQUE (student_id, subject_id, exam_type)
);

-- 4. Grades Table (auto-calculated summary per student)
CREATE TABLE grades (
  grade_id       SERIAL PRIMARY KEY,
  student_id     INT UNIQUE NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  percentage     NUMERIC(5,2),
  grade          VARCHAR(5),
  remarks        VARCHAR(50),
  calculated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample subjects
INSERT INTO subjects (subject_name, subject_code, max_marks) VALUES
  ('Mathematics',        'MATH101', 100),
  ('Physics',            'PHY101',  100),
  ('Chemistry',          'CHEM101', 100),
  ('English',            'ENG101',  100),
  ('Computer Science',   'CS101',   100);

-- Insert sample students
INSERT INTO students (name, email, phone, date_of_birth, class) VALUES
  ('Aarav Sharma',   'aarav@example.com',   '9876543210', '2005-03-15', '10-A'),
  ('Priya Patel',    'priya@example.com',   '9876543211', '2005-07-22', '10-A'),
  ('Rohit Verma',    'rohit@example.com',   '9876543212', '2005-01-10', '10-B'),
  ('Sneha Nair',     'sneha@example.com',   '9876543213', '2005-11-05', '10-B'),
  ('Karan Singh',    'karan@example.com',   '9876543214', '2005-09-18', '10-A');

-- Insert sample marks
INSERT INTO marks (student_id, subject_id, marks_obtained, exam_type) VALUES
  (1, 1, 88, 'Final'), (1, 2, 75, 'Final'), (1, 3, 82, 'Final'), (1, 4, 91, 'Final'), (1, 5, 95, 'Final'),
  (2, 1, 92, 'Final'), (2, 2, 88, 'Final'), (2, 3, 79, 'Final'), (2, 4, 85, 'Final'), (2, 5, 90, 'Final'),
  (3, 1, 65, 'Final'), (3, 2, 70, 'Final'), (3, 3, 68, 'Final'), (3, 4, 72, 'Final'), (3, 5, 75, 'Final'),
  (4, 1, 45, 'Final'), (4, 2, 50, 'Final'), (4, 3, 55, 'Final'), (4, 4, 60, 'Final'), (4, 5, 48, 'Final'),
  (5, 1, 98, 'Final'), (5, 2, 95, 'Final'), (5, 3, 92, 'Final'), (5, 4, 88, 'Final'), (5, 5, 97, 'Final');
