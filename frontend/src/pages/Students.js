// src/pages/Students.js
import { useState, useEffect } from 'react';
import { getStudents, createStudent, deleteStudent } from '../api';

const EMPTY_FORM = { name: '', email: '', phone: '', date_of_birth: '', class: '' };

export default function Students() {
  const [students, setStudents]   = useState([]);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState(null); // { type, text }

  // Load students on mount
  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch {
      showMessage('error', 'Failed to load students');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await createStudent(form);
      setForm(EMPTY_FORM);
      fetchStudents();
      showMessage('success', 'Student added successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete student "${name}"? This will also delete their marks.`)) return;
    try {
      await deleteStudent(id);
      fetchStudents();
      showMessage('success', 'Student deleted');
    } catch {
      showMessage('error', 'Failed to delete student');
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div>
      {/* Add Student Form */}
      <div className="card">
        <h2>Add New Student</h2>
        {message && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                placeholder="student@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                placeholder="9876543210"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Class *</label>
              <input
                type="text"
                placeholder="e.g. 10-A"
                value={form.class}
                onChange={e => setForm({ ...form, class: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : '+ Add Student'}
          </button>
        </form>
      </div>

      {/* Students Table */}
      <div className="card">
        <h2>All Students ({students.length})</h2>
        {students.length === 0 ? (
          <div className="empty">No students found. Add one above!</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Class</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.student_id}>
                    <td>{s.student_id}</td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.email}</td>
                    <td>{s.phone || '—'}</td>
                    <td>{s.class}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(s.student_id, s.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
