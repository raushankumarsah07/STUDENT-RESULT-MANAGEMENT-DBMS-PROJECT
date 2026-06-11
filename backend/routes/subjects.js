// routes/subjects.js - ES Module
import express from 'express';
import pool    from '../db.js';

const router = express.Router();

// GET all subjects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY subject_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create subject
router.post('/', async (req, res) => {
  const { subject_name, subject_code, max_marks } = req.body;
  if (!subject_name || !subject_code)
    return res.status(400).json({ error: 'Subject name and code are required' });

  try {
    const result = await pool.query(
      `INSERT INTO subjects (subject_name, subject_code, max_marks)
       VALUES ($1, $2, $3) RETURNING *`,
      [subject_name, subject_code, max_marks || 100]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Subject code already exists' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE subject
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM subjects WHERE subject_id=$1 RETURNING *', [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
