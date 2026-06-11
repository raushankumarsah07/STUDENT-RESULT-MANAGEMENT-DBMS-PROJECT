// server.js - Main Express server (ES Module)
import express  from 'express';
import cors     from 'cors';
import dotenv   from 'dotenv';
dotenv.config();

import studentsRouter from './routes/students.js';
import subjectsRouter from './routes/subjects.js';
import marksRouter    from './routes/marks.js';
import resultsRouter  from './routes/results.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/students', studentsRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/marks',    marksRouter);
app.use('/api/results',  resultsRouter);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '✅ Student Result Management API is running',
    routes: [
      'GET    /api/students',
      'POST   /api/students',
      'GET    /api/students/:id',
      'PUT    /api/students/:id',
      'DELETE /api/students/:id',
      'GET    /api/subjects',
      'POST   /api/subjects',
      'DELETE /api/subjects/:id',
      'GET    /api/marks/student/:studentId',
      'POST   /api/marks',
      'GET    /api/results/reportcard/:studentId',
      'GET    /api/results/class?class=10-A',
      'GET    /api/results/toppers',
    ]
  });
});

// Use 5001 to avoid conflict with macOS AirPlay (which uses 5000)
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
