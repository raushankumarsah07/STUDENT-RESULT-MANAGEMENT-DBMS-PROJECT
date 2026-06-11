// routes/results.js - ES Module
// AGGREGATE FUNCTIONS USED:
//   SUM()   → total marks obtained / total max marks
//   AVG()   → class average percentage
//   COUNT() → number of students, subjects completed
//   MAX()   → highest marks in class
//   MIN()   → lowest marks in class
//   ROUND() → clean 2-decimal percentages

import express from 'express';
import pool    from '../db.js';

const router = express.Router();

// ── 1. Full Report Card for a student ────────────────────────────────────────
// AGGREGATE: SUM(marks), SUM(max_marks), ROUND(percentage)
router.get('/reportcard/:studentId', async (req, res) => {
  try {
    const studentResult = await pool.query(
      'SELECT * FROM students WHERE student_id=$1',
      [req.params.studentId]
    );
    if (studentResult.rows.length === 0)
      return res.status(404).json({ error: 'Student not found' });

    // Per-subject marks with individual percentage
    const marksResult = await pool.query(
      `SELECT m.marks_obtained, m.exam_type,
              s.subject_name, s.subject_code, s.max_marks,
              ROUND((m.marks_obtained::NUMERIC / s.max_marks) * 100, 2) AS subject_percentage
       FROM marks m
       JOIN subjects s ON m.subject_id = s.subject_id
       WHERE m.student_id = $1
       ORDER BY s.subject_name`,
      [req.params.studentId]
    );

    // Aggregate summary row: total marks, total max, overall %
    const summaryResult = await pool.query(
      `SELECT
         COUNT(m.mark_id)                                        AS total_subjects,
         SUM(m.marks_obtained)                                   AS total_obtained,
         SUM(s.max_marks)                                        AS total_max,
         ROUND((SUM(m.marks_obtained)::NUMERIC
                / NULLIF(SUM(s.max_marks), 0)) * 100, 2)        AS overall_percentage,
         MAX(m.marks_obtained)                                   AS highest_subject_marks,
         MIN(m.marks_obtained)                                   AS lowest_subject_marks,
         ROUND(AVG(m.marks_obtained), 2)                        AS avg_subject_marks
       FROM marks m
       JOIN subjects s ON m.subject_id = s.subject_id
       WHERE m.student_id = $1 AND m.exam_type = 'Final'`,
      [req.params.studentId]
    );

    const gradeResult = await pool.query(
      'SELECT * FROM grades WHERE student_id=$1',
      [req.params.studentId]
    );

    res.json({
      student:  studentResult.rows[0],
      marks:    marksResult.rows,
      summary:  summaryResult.rows[0],   // ← aggregate summary
      grade:    gradeResult.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 2. Class Results — all students with grade + aggregate stats ──────────────
// AGGREGATE: COUNT(marks), used with GROUP BY per student
router.get('/class', async (req, res) => {
  const { class: className } = req.query;
  try {
    let query = `
      SELECT st.student_id, st.name, st.class, st.email,
             g.percentage, g.grade, g.remarks,
             COUNT(m.mark_id)       AS subjects_completed,
             SUM(m.marks_obtained)  AS total_marks_obtained
      FROM students st
      LEFT JOIN grades g ON st.student_id = g.student_id
      LEFT JOIN marks m  ON st.student_id = m.student_id
    `;
    const params = [];
    if (className) { query += ' WHERE st.class = $1'; params.push(className); }
    query += ` GROUP BY st.student_id, g.percentage, g.grade, g.remarks
               ORDER BY g.percentage DESC NULLS LAST`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 3. Top 5 performers ───────────────────────────────────────────────────────
router.get('/toppers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.name, st.class, g.percentage, g.grade, g.remarks
       FROM students st
       JOIN grades g ON st.student_id = g.student_id
       ORDER BY g.percentage DESC LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 4. NEW: Class Statistics Dashboard ───────────────────────────────────────
// AGGREGATE: AVG, MAX, MIN, COUNT, SUM all in one query — grouped by class
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         st.class,
         COUNT(DISTINCT st.student_id)          AS total_students,
         COUNT(DISTINCT m.subject_id)            AS total_subjects,
         ROUND(AVG(g.percentage), 2)             AS class_avg_percentage,
         MAX(g.percentage)                       AS highest_percentage,
         MIN(g.percentage)                       AS lowest_percentage,
         COUNT(CASE WHEN g.grade = 'A+' THEN 1 END) AS grade_a_plus,
         COUNT(CASE WHEN g.grade = 'A'  THEN 1 END) AS grade_a,
         COUNT(CASE WHEN g.grade = 'B'  THEN 1 END) AS grade_b,
         COUNT(CASE WHEN g.grade = 'C'  THEN 1 END) AS grade_c,
         COUNT(CASE WHEN g.grade = 'D'  THEN 1 END) AS grade_d,
         COUNT(CASE WHEN g.grade = 'F'  THEN 1 END) AS grade_f,
         COUNT(CASE WHEN g.percentage >= 50 THEN 1 END) AS total_pass,
         COUNT(CASE WHEN g.percentage  < 50 THEN 1 END) AS total_fail
       FROM students st
       LEFT JOIN grades g ON st.student_id = g.student_id
       LEFT JOIN marks  m ON st.student_id = m.student_id
       GROUP BY st.class
       ORDER BY st.class`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 5. NEW: Subject-wise Statistics ──────────────────────────────────────────
// AGGREGATE: AVG, MAX, MIN, COUNT per subject across all students
router.get('/subject-stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.subject_name,
         s.subject_code,
         s.max_marks,
         COUNT(m.mark_id)               AS students_appeared,
         ROUND(AVG(m.marks_obtained), 2) AS avg_marks,
         MAX(m.marks_obtained)           AS highest_marks,
         MIN(m.marks_obtained)           AS lowest_marks,
         SUM(m.marks_obtained)           AS total_marks_scored,
         COUNT(CASE WHEN m.marks_obtained >= (s.max_marks * 0.5)
               THEN 1 END)              AS students_passed,
         COUNT(CASE WHEN m.marks_obtained < (s.max_marks * 0.5)
               THEN 1 END)              AS students_failed
       FROM subjects s
       LEFT JOIN marks m ON s.subject_id = m.subject_id
                        AND m.exam_type = 'Final'
       GROUP BY s.subject_id, s.subject_name, s.subject_code, s.max_marks
       ORDER BY avg_marks DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
