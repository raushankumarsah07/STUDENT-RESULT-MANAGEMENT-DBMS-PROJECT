// src/pages/Marks.js
import { useState, useEffect } from 'react';
import { getStudents, getSubjects, getMarksByStudent, addMark } from '../api';

export default function Marks() {
  const [students, setStudents]   = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [existingMarks, setExistingMarks]     = useState([]);
  const [form, setForm]     = useState({ subject_id: '', marks_obtained: '', exam_type: 'Final' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getStudents().then(r => setStudents(r.data));
    getSubjects().then(r => setSubjects(r.data));
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      getMarksByStudent(selectedStudent).then(r => setExistingMarks(r.data));
    } else {
      setExistingMarks([]);
    }
  }, [selectedStudent]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedStudent) return showMessage('error', 'Please select a student first');
    setLoading(true);
    try {
      await addMark({
        student_id:     parseInt(selectedStudent),
        subject_id:     parseInt(form.subject_id),
        marks_obtained: parseInt(form.marks_obtained),
        exam_type:      form.exam_type,
      });
      setForm({ subject_id: '', marks_obtained: '', exam_type: 'Final' });
      // Refresh marks list
      const res = await getMarksByStudent(selectedStudent);
      setExistingMarks(res.data);
      showMessage('success', 'Marks saved! Grade auto-calculated.');
    } catch (err) {
      showMessage('error', err.response?.data?.error || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  const selectedStudentName = students.find(s => s.student_id === parseInt(selectedStudent))?.name;

  return (
    <div>
      {/* Select Student */}
      <div className="card">
        <h2>Select Student</h2>
        <div className="form-group" style={{ maxWidth: 300 }}>
          <label>Student</label>
          <select
            value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
          >
            <option value="">-- Choose a student --</option>
            {students.map(s => (
              <option key={s.student_id} value={s.student_id}>
                {s.name} (Class {s.class})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStudent && (
        <>
          {/* Enter Marks Form */}
          <div className="card">
            <h2>Enter Marks for {selectedStudentName}</h2>
            {message && (
              <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={form.subject_id}
                    onChange={e => setForm({ ...form, subject_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select subject --</option>
                    {subjects.map(s => (
                      <option key={s.subject_id} value={s.subject_id}>
                        {s.subject_name} (Max: {s.max_marks})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Marks Obtained *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 85"
                    value={form.marks_obtained}
                    onChange={e => setForm({ ...form, marks_obtained: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Exam Type</label>
                  <select
                    value={form.exam_type}
                    onChange={e => setForm({ ...form, exam_type: e.target.value })}
                  >
                    <option>Final</option>
                    <option>Midterm</option>
                    <option>Unit Test</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : '💾 Save Marks'}
              </button>
              <small style={{ marginLeft: 12, color: '#718096' }}>
                Grade is auto-calculated after saving
              </small>
            </form>
          </div>

          {/* Existing Marks Table */}
          <div className="card">
            <h2>Marks for {selectedStudentName}</h2>
            {existingMarks.length === 0 ? (
              <div className="empty">No marks entered yet for this student.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Code</th>
                      <th>Marks Obtained</th>
                      <th>Max Marks</th>
                      <th>%</th>
                      <th>Exam Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingMarks.map(m => (
                      <tr key={m.mark_id}>
                        <td>{m.subject_name}</td>
                        <td><code>{m.subject_code}</code></td>
                        <td><strong>{m.marks_obtained}</strong></td>
                        <td>{m.max_marks}</td>
                        <td>{((m.marks_obtained / m.max_marks) * 100).toFixed(1)}%</td>
                        <td>{m.exam_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
