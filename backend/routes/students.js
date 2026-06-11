// routes/students.js - ES Module
import express from 'express';
import pool    from '../db.js';

const router = express.Router();

// GET all students
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY student_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single student
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM students WHERE student_id = $1', [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create student
router.post('/', async (req, res) => {
  const { name, email, phone, date_of_birth, class: studentClass } = req.body;
  if (!name || !email || !studentClass)
    return res.status(400).json({ error: 'Name, email, and class are required' });

  try {
    const result = await pool.query(
      `INSERT INTO students (name, email, phone, date_of_birth, class)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, phone, date_of_birth, studentClass]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update student
router.put('/:id', async (req, res) => {
  const { name, email, phone, date_of_birth, class: studentClass } = req.body;
  try {
    const result = await pool.query(
      `UPDATE students SET name=$1, email=$2, phone=$3, date_of_birth=$4, class=$5
       WHERE student_id=$6 RETURNING *`,
      [name, email, phone, date_of_birth, studentClass, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM students WHERE student_id=$1 RETURNING *', [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// ── AGGREGATE: Student summary with total marks, avg, grade ──────────────────
// GET /api/students/summary — each student with their aggregate marks data
router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         st.student_id, st.name, st.class, st.email,
         COUNT(m.mark_id)                AS subjects_completed,
         SUM(m.marks_obtained)           AS total_marks_obtained,
         ROUND(AVG(m.marks_obtained), 2) AS avg_marks_per_subject,
         MAX(m.marks_obtained)           AS best_subject_marks,
         MIN(m.marks_obtained)           AS worst_subject_marks,
         g.percentage, g.grade, g.remarks
       FROM students st
       LEFT JOIN marks  m ON st.student_id = m.student_id AND m.exam_type = 'Final'
       LEFT JOIN grades g ON st.student_id = g.student_id
       GROUP BY st.student_id, st.name, st.class, st.email,
                g.percentage, g.grade, g.remarks
       ORDER BY g.percentage DESC NULLS LAST`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
