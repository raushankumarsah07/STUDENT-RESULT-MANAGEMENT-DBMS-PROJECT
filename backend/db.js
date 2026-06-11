// db.js - PostgreSQL connection + Auto table setup + Trigger (ES Module)
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'student_result_db',
  user:     process.env.DB_USER     || 'postgres',
  password: String(process.env.DB_PASSWORD || '0709'),  // String() fixes numeric password bug
  // ssl: { rejectUnauthorized: false },
  // application_name: 'student_result_app',  
});

// ── Auto-create tables + trigger on every server startup ─────────────────────
async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔧 Setting up database tables...');

    // 1. Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        student_id    SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(100) UNIQUE NOT NULL,
        phone         VARCHAR(15),
        date_of_birth DATE,
        class         VARCHAR(20) NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        subject_id   SERIAL PRIMARY KEY,
        subject_name VARCHAR(100) NOT NULL,
        subject_code VARCHAR(20) UNIQUE NOT NULL,
        max_marks    INT NOT NULL DEFAULT 100
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS marks (
        mark_id        SERIAL PRIMARY KEY,
        student_id     INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        subject_id     INT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
        marks_obtained INT NOT NULL CHECK (marks_obtained >= 0),
        exam_type      VARCHAR(50) DEFAULT 'Final',
        exam_date      DATE DEFAULT CURRENT_DATE,
        UNIQUE (student_id, subject_id, exam_type)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS grades (
        grade_id      SERIAL PRIMARY KEY,
        student_id    INT UNIQUE NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        percentage    NUMERIC(5,2),
        grade         VARCHAR(5),
        remarks       VARCHAR(50),
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── 2. Trigger FUNCTION ───────────────────────────────────────────────────
    // This runs INSIDE PostgreSQL automatically after any INSERT/UPDATE/DELETE
    // on the marks table. It recalculates percentage + grade and saves to grades.
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_grade_trigger()
      RETURNS TRIGGER AS $$
      DECLARE
        v_student_id     INT;
        v_total_obtained NUMERIC;
        v_total_max      NUMERIC;
        v_percentage     NUMERIC(5,2);
        v_grade          VARCHAR(5);
        v_remarks        VARCHAR(50);
      BEGIN
        -- On DELETE use OLD row's student_id; on INSERT/UPDATE use NEW
        IF TG_OP = 'DELETE' THEN
          v_student_id := OLD.student_id;
        ELSE
          v_student_id := NEW.student_id;
        END IF;

        -- Sum all Final marks for this student
        SELECT SUM(m.marks_obtained), SUM(s.max_marks)
          INTO v_total_obtained, v_total_max
          FROM marks m
          JOIN subjects s ON m.subject_id = s.subject_id
         WHERE m.student_id = v_student_id
           AND m.exam_type  = 'Final';

        -- Only update grade if marks exist
        IF v_total_obtained IS NOT NULL AND v_total_max > 0 THEN
          v_percentage := ROUND((v_total_obtained / v_total_max) * 100, 2);

          -- Grade using CASE
          v_grade := CASE
            WHEN v_percentage >= 90 THEN 'A+'
            WHEN v_percentage >= 80 THEN 'A'
            WHEN v_percentage >= 70 THEN 'B'
            WHEN v_percentage >= 60 THEN 'C'
            WHEN v_percentage >= 50 THEN 'D'
            ELSE 'F'
          END;

          v_remarks := CASE
            WHEN v_percentage >= 90 THEN 'Outstanding'
            WHEN v_percentage >= 80 THEN 'Excellent'
            WHEN v_percentage >= 70 THEN 'Very Good'
            WHEN v_percentage >= 60 THEN 'Good'
            WHEN v_percentage >= 50 THEN 'Average'
            ELSE 'Fail'
          END;

          -- Insert or update the grades row for this student
          INSERT INTO grades (student_id, percentage, grade, remarks, calculated_at)
          VALUES (v_student_id, v_percentage, v_grade, v_remarks, NOW())
          ON CONFLICT (student_id) DO UPDATE SET
            percentage    = EXCLUDED.percentage,
            grade         = EXCLUDED.grade,
            remarks       = EXCLUDED.remarks,
            calculated_at = NOW();
        END IF;

        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ── 3. Attach Trigger to marks table ─────────────────────────────────────
    // DROP first so re-running server doesn't error on duplicate trigger
    await client.query(`DROP TRIGGER IF EXISTS trg_auto_grade ON marks`);
    await client.query(`
      CREATE TRIGGER trg_auto_grade
      AFTER INSERT OR UPDATE OR DELETE ON marks
      FOR EACH ROW
      EXECUTE FUNCTION calculate_grade_trigger()
    `);

    console.log('✅ Tables ready: students, subjects, marks, grades');
    console.log('✅ Trigger trg_auto_grade ACTIVE → grade auto-updates on every marks change');

  } catch (err) {
    console.error('❌ DB setup failed:', err.message);
    console.error('👉 Check your .env: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
    process.exit(1);
  } finally {
    client.release();
  }
}

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to PostgreSQL');
    release();
    setupDatabase(); // Run on every server start
  }
});

export default pool;
