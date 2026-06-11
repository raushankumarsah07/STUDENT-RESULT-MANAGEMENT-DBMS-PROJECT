// routes/marks.js - ES Module
// Grade calculation is now handled by PostgreSQL trigger trg_auto_grade
// No manual grade logic needed here!
import express from 'express';
import pool    from '../db.js';

const router = express.Router();

// GET marks for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.mark_id, m.marks_obtained, m.exam_type, m.exam_date,
              s.subject_name, s.subject_code, s.max_marks
       FROM marks m
       JOIN subjects s ON m.subject_id = s.subject_id
       WHERE m.student_id = $1
       ORDER BY s.subject_name`,
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - save marks
// The PostgreSQL trigger trg_auto_grade fires automatically AFTER this INSERT
// and updates the grades table — no extra Node.js code needed
router.post('/', async (req, res) => {
  const { student_id, subject_id, marks_obtained, exam_type, exam_date } = req.body;

  if (!student_id || !subject_id || marks_obtained === undefined)
    return res.status(400).json({ error: 'student_id, subject_id, and marks_obtained are required' });

  try {
    // Validate marks don't exceed subject max
    const subjectResult = await pool.query(
      'SELECT max_marks FROM subjects WHERE subject_id=$1', [subject_id]
    );
    if (subjectResult.rows.length === 0)
      return res.status(404).json({ error: 'Subject not found' });

    const maxMarks = subjectResult.rows[0].max_marks;
    if (marks_obtained > maxMarks)
      return res.status(400).json({ error: `Marks cannot exceed max marks (${maxMarks})` });

    // Upsert marks — trigger fires automatically after this query
    const result = await pool.query(
      `INSERT INTO marks (student_id, subject_id, marks_obtained, exam_type, exam_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, subject_id, exam_type)
       DO UPDATE SET marks_obtained = $3, exam_date = $5
       RETURNING *`,
      [student_id, subject_id, marks_obtained, exam_type || 'Final', exam_date || new Date()]
    );

    res.status(201).json({
      ...result.rows[0],
      note: 'Grade auto-updated by PostgreSQL trigger trg_auto_grade'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a mark — trigger recalculates grade automatically
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM marks WHERE mark_id=$1 RETURNING *', [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Mark not found' });
    res.json({ message: 'Mark deleted. Grade recalculated by trigger.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
