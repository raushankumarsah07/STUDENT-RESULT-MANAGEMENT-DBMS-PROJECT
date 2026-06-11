// src/App.js
import React, { useState, Component } from 'react';
import Students from './pages/Students';
import Subjects from './pages/Subjects';
import Marks    from './pages/Marks';
import Results  from './pages/Results';
import './App.css';

// Error Boundary — catches any silent crash and shows it instead of blank page
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          margin: 40, padding: 24, background: '#FFF5F5',
          border: '2px solid #FC8181', borderRadius: 12
        }}>
          <h2 style={{ color: '#C53030' }}>❌ Something went wrong</h2>
          <pre style={{
            marginTop: 12, padding: 16, background: '#FED7D7',
            borderRadius: 8, fontSize: '0.85rem', overflowX: 'auto',
            color: '#742A2A', whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 16, padding: '8px 20px', background: '#E53E3E',
              color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer'
            }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const NAV_ITEMS = [
  { key: 'students', label: '👨‍🎓 Students' },
  { key: 'subjects', label: '📚 Subjects' },
  { key: 'marks',    label: '✏️ Enter Marks' },
  { key: 'results',  label: '📊 Results' },
];

export default function App() {
  const [activePage, setActivePage] = useState('students');

  return (
    <div className="app">
      <header className="header">
        <h1>🎓 Student Result Management</h1>
        <p>Manage students, enter marks, and generate report cards</p>
      </header>

      <nav className="nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`nav-btn ${activePage === item.key ? 'active' : ''}`}
            onClick={() => setActivePage(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="main">
        <ErrorBoundary>
          {activePage === 'students' && <Students />}
          {activePage === 'subjects' && <Subjects />}
          {activePage === 'marks'    && <Marks />}
          {activePage === 'results'  && <Results />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
