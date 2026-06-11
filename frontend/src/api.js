// src/api.js - Central API helper using axios
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Students
export const getStudents   = ()       => API.get('/students');
export const getStudent    = (id)     => API.get(`/students/${id}`);
export const createStudent = (data)   => API.post('/students', data);
export const updateStudent = (id, d)  => API.put(`/students/${id}`, d);
export const deleteStudent = (id)     => API.delete(`/students/${id}`);

// Subjects
export const getSubjects   = ()       => API.get('/subjects');
export const createSubject = (data)   => API.post('/subjects', data);
export const deleteSubject = (id)     => API.delete(`/subjects/${id}`);

// Marks
export const getMarksByStudent = (id)   => API.get(`/marks/student/${id}`);
export const addMark           = (data) => API.post('/marks', data);

// Results
export const getReportCard = (id)       => API.get(`/results/reportcard/${id}`);
export const getClassResults = (cls)    => API.get(`/results/class?class=${cls}`);
export const getToppers      = ()       => API.get('/results/toppers');

// Aggregate routes
export const getClassStats    = ()  => API.get('/results/stats');
export const getSubjectStats  = ()  => API.get('/results/subject-stats');
export const getStudentSummary = () => API.get('/students/summary');
