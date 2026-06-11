// src/pages/Subjects.js
import { useState, useEffect } from 'react';
import { getSubjects, createSubject, deleteSubject } from '../api';

const EMPTY_FORM = { subject_name: '', subject_code: '', max_marks: 100 };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState(null);

  useEffect(() => { fetchSubjects(); }, []);

  async function fetchSubjects() {
    try {
      const res = await getSubjects();
      setSubjects(res.data);
    } catch {
      showMessage('error', 'Failed to load subjects');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await createSubject(form);
      setForm(EMPTY_FORM);
      fetchSubjects();
      showMessage('success', 'Subject added!');
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this subject? Related marks will also be deleted.')) return;
    try {
      await deleteSubject(id);
      fetchSubjects();
    } catch {
      showMessage('error', 'Failed to delete');
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div>
      <div className="card">
        <h2>Add New Subject</h2>
        {message && (
          <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Subject Name *</label>
              <input
                type="text"
                placeholder="e.g. Mathematics"
                value={form.subject_name}
                onChange={e => setForm({ ...form, subject_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Subject Code *</label>
              <input
                type="text"
                placeholder="e.g. MATH101"
                value={form.subject_code}
                onChange={e => setForm({ ...form, subject_code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group">
              <label>Max Marks</label>
              <input
                type="number"
                min="1"
                max="500"
                value={form.max_marks}
                onChange={e => setForm({ ...form, max_marks: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : '+ Add Subject'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>All Subjects ({subjects.length})</h2>
        {subjects.length === 0 ? (
          <div className="empty">No subjects yet. Add one above!</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject Name</th>
                  <th>Code</th>
                  <th>Max Marks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.subject_id}>
                    <td>{s.subject_id}</td>
                    <td><strong>{s.subject_name}</strong></td>
                    <td><code>{s.subject_code}</code></td>
                    <td>{s.max_marks}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(s.subject_id)}
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
