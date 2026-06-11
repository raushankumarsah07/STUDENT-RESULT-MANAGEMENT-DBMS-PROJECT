// src/pages/Results.js
import { useState, useEffect } from 'react';
import {
  getStudents, getReportCard, getClassResults, getToppers,
  getClassStats, getSubjectStats
} from '../api';

function GradeBadge({ grade }) {
  const cls = grade === 'A+' ? 'grade-A-plus' : `grade-${grade}`;
  return <span className={`grade-badge ${cls}`}>{grade}</span>;
}

// Reusable stat card
function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: color || '#f7fafc', borderRadius: 10, padding: '14px 18px',
      textAlign: 'center', minWidth: 110, flex: 1
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2d3748' }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.78rem', color: '#718096', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function Results() {
  const [tab, setTab] = useState('reportcard');
  const [students, setStudents]         = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportCard, setReportCard]     = useState(null);
  const [classResults, setClassResults] = useState([]);
  const [toppers, setToppers]           = useState([]);
  const [classStats, setClassStats]     = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [classFilter, setClassFilter]   = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    getStudents().then(r => setStudents(r.data));
    getToppers().then(r => setToppers(r.data));
  }, []);

  useEffect(() => {
    if (tab === 'class')   loadClassResults();
    if (tab === 'stats') {
      getClassStats().then(r => setClassStats(r.data));
      getSubjectStats().then(r => setSubjectStats(r.data));
    }
  }, [tab]);

  async function loadReportCard() {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const res = await getReportCard(selectedStudent);
      setReportCard(res.data);
    } catch { setReportCard(null); }
    finally { setLoading(false); }
  }

  async function loadClassResults() {
    setLoading(true);
    try {
      const res = await getClassResults(classFilter);
      setClassResults(res.data);
    } catch { setClassResults([]); }
    finally { setLoading(false); }
  }

  const TABS = [
    { key: 'reportcard', label: '📋 Report Card' },
    { key: 'class',      label: '🏫 Class Results' },
    { key: 'toppers',    label: '🏆 Top Performers' },
    { key: 'stats',      label: '📈 Statistics' },  // ← NEW aggregate tab
  ];

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key}
            className={`nav-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Report Card ───────────────────────────────────────────────────── */}
      {tab === 'reportcard' && (
        <div className="card">
          <h2>Student Report Card</h2>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: 240 }}>
              <label>Select Student</label>
              <select value={selectedStudent}
                onChange={e => { setSelectedStudent(e.target.value); setReportCard(null); }}>
                <option value="">-- Choose a student --</option>
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.name} (Class {s.class})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn-primary"
                onClick={loadReportCard}
                disabled={!selectedStudent || loading}>
                {loading ? 'Loading...' : '📋 Generate'}
              </button>
            </div>
          </div>

          {reportCard && (
            <>
              {/* Student header */}
              <div className="report-header">
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{reportCard.student.name}</div>
                  <div style={{ color: '#718096', marginTop: 4 }}>Class: {reportCard.student.class}</div>
                  <div style={{ color: '#718096' }}>Email: {reportCard.student.email}</div>
                </div>
                {reportCard.grade && (
                  <div className="report-summary">
                    <div className="big-grade"><GradeBadge grade={reportCard.grade.grade} /></div>
                    <div className="percentage">{reportCard.grade.percentage}%</div>
                    <div style={{ fontSize: '0.85rem', color: '#718096' }}>{reportCard.grade.remarks}</div>
                  </div>
                )}
              </div>

              {/* Aggregate summary strip — SUM, AVG, MAX, MIN */}
              {reportCard.summary && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                  <StatCard label="Total Marks"    value={`${reportCard.summary.total_obtained} / ${reportCard.summary.total_max}`} color="#EBF8FF" />
                  <StatCard label="Overall %"      value={`${reportCard.summary.overall_percentage}%`} color="#E9D8FD" />
                  <StatCard label="Avg per Subject" value={reportCard.summary.avg_subject_marks}  color="#F0FFF4" />
                  <StatCard label="Best Subject"   value={reportCard.summary.highest_subject_marks} color="#FEFCBF" />
                  <StatCard label="Lowest Subject" value={reportCard.summary.lowest_subject_marks}  color="#FFF5F5" />
                  <StatCard label="Subjects"       value={reportCard.summary.total_subjects}        color="#F7FAFC" />
                </div>
              )}

              {/* Per-subject marks */}
              {reportCard.marks.length === 0 ? (
                <div className="empty">No marks recorded yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Max Marks</th>
                        <th>Marks Obtained</th>
                        <th>Percentage</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCard.marks.map((m, i) => (
                        <tr key={i}>
                          <td>{m.subject_name}</td>
                          <td>{m.max_marks}</td>
                          <td><strong>{m.marks_obtained}</strong></td>
                          <td>{m.subject_percentage}%</td>
                          <td>
                            {m.subject_percentage >= 50
                              ? <span style={{ color: '#38a169' }}>✅ Pass</span>
                              : <span style={{ color: '#e53e3e' }}>❌ Fail</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Class Results ─────────────────────────────────────────────────── */}
      {tab === 'class' && (
        <div className="card">
          <h2>Class Results</h2>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: 180 }}>
              <label>Filter by Class</label>
              <input type="text" placeholder="e.g. CSE-F (blank = all)"
                value={classFilter} onChange={e => setClassFilter(e.target.value)} />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn-primary" onClick={loadClassResults} disabled={loading}>
                🔍 Search
              </button>
            </div>
          </div>
          {classResults.length === 0 ? (
            <div className="empty">No results found.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th><th>Name</th><th>Class</th>
                    <th>Subjects Done</th><th>Total Marks</th>
                    <th>Percentage</th><th>Grade</th><th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {classResults.map((s, i) => (
                    <tr key={s.student_id}>
                      <td>#{i + 1}</td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.class}</td>
                      <td>{s.subjects_completed}</td>
                      <td>{s.total_marks_obtained ?? '—'}</td>
                      <td>{s.percentage ? `${s.percentage}%` : '—'}</td>
                      <td>{s.grade ? <GradeBadge grade={s.grade} /> : '—'}</td>
                      <td>{s.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Top Performers ────────────────────────────────────────────────── */}
      {tab === 'toppers' && (
        <div className="card">
          <h2>🏆 Top Performers</h2>
          {toppers.length === 0 ? (
            <div className="empty">No results yet. Enter marks first!</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Rank</th><th>Name</th><th>Class</th><th>Percentage</th><th>Grade</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {toppers.map((s, i) => (
                    <tr key={i}>
                      <td>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.class}</td>
                      <td><strong>{s.percentage}%</strong></td>
                      <td><GradeBadge grade={s.grade} /></td>
                      <td>{s.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Statistics Tab (All Aggregate Functions) ──────────────────────── */}
      {tab === 'stats' && (
        <div>
          {/* Class-wise stats — AVG, MAX, MIN, COUNT, grade breakdown */}
          <div className="card">
            <h2>📊 Class-wise Statistics</h2>
            <p style={{ color: '#718096', fontSize: '0.85rem', marginBottom: 16 }}>
              Uses: <code>AVG</code> · <code>MAX</code> · <code>MIN</code> · <code>COUNT</code> grouped by class
            </p>
            {classStats.length === 0 ? (
              <div className="empty">No data yet.</div>
            ) : classStats.map(c => (
              <div key={c.class} style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>
                  Class: {c.class} &nbsp;·&nbsp; {c.total_students} students
                </div>
                {/* Aggregate stat cards */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <StatCard label="Class Avg %"  value={`${c.class_avg_percentage}%`} color="#EBF8FF" />
                  <StatCard label="Highest %"    value={`${c.highest_percentage}%`}   color="#F0FFF4" />
                  <StatCard label="Lowest %"     value={`${c.lowest_percentage}%`}    color="#FFF5F5" />
                  <StatCard label="Total Pass"   value={c.total_pass}                 color="#C6F6D5" />
                  <StatCard label="Total Fail"   value={c.total_fail}                 color="#FED7D7" />
                </div>
                {/* Grade distribution */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { g: 'A+', v: c.grade_a_plus, bg: '#C6F6D5' },
                    { g: 'A',  v: c.grade_a,      bg: '#BEE3F8' },
                    { g: 'B',  v: c.grade_b,       bg: '#E9D8FD' },
                    { g: 'C',  v: c.grade_c,       bg: '#FEFCBF' },
                    { g: 'D',  v: c.grade_d,       bg: '#FED7AA' },
                    { g: 'F',  v: c.grade_f,       bg: '#FED7D7' },
                  ].map(item => (
                    <div key={item.g} style={{
                      background: item.bg, borderRadius: 8, padding: '8px 16px',
                      textAlign: 'center', minWidth: 60
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{item.v}</div>
                      <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>Grade {item.g}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Subject-wise stats — AVG, MAX, MIN, COUNT per subject */}
          <div className="card">
            <h2>📚 Subject-wise Statistics</h2>
            <p style={{ color: '#718096', fontSize: '0.85rem', marginBottom: 16 }}>
              Uses: <code>AVG</code> · <code>MAX</code> · <code>MIN</code> · <code>SUM</code> · <code>COUNT</code> grouped by subject
            </p>
            {subjectStats.length === 0 ? (
              <div className="empty">No marks data yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Students</th>
                      <th>Avg Marks</th>   {/* AVG() */}
                      <th>Highest</th>     {/* MAX() */}
                      <th>Lowest</th>      {/* MIN() */}
                      <th>Total Scored</th>{/* SUM() */}
                      <th>Pass</th>        {/* COUNT with CASE */}
                      <th>Fail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectStats.map((s, i) => (
                      <tr key={i}>
                        <td><strong>{s.subject_name}</strong><br/>
                          <small style={{ color: '#718096' }}>{s.subject_code}</small>
                        </td>
                        <td>{s.students_appeared}</td>
                        <td><strong>{s.avg_marks}</strong> / {s.max_marks}</td>
                        <td style={{ color: '#38a169' }}>{s.highest_marks}</td>
                        <td style={{ color: '#e53e3e' }}>{s.lowest_marks}</td>
                        <td>{s.total_marks_scored}</td>
                        <td style={{ color: '#38a169' }}>{s.students_passed} ✅</td>
                        <td style={{ color: '#e53e3e' }}>{s.students_failed} ❌</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
