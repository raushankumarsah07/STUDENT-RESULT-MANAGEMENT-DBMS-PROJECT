<div align="center">

# 🎓 Student Result Management System

### A Full-Stack Web Application to Manage Student Academic Records

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<br/>

> Built as a **DBMS project** demonstrating CRUD operations, Triggers, Aggregate Functions, Joins, Transactions, and Normalization using a real full-stack application.

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

</div>

<br/>

## 📌 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🗂️ Project Structure](#️-project-structure)
- [🗃️ Database Design](#️-database-design)
- [⚡ Trigger](#-trigger--trg_auto_grade)
- [📊 Aggregate Functions](#-aggregate-functions)
- [🚀 Getting Started](#-getting-started)
- [🔌 API Endpoints](#-api-endpoints)
- [📸 Screenshots](#-screenshots)
- [🧠 DBMS Concepts Covered](#-dbms-concepts-covered)

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ✨ Features

- 👨‍🎓 **Student Management** — Add, view, update, and delete student records
- 📚 **Subject Management** — Define subjects with codes and max marks
- ✏️ **Marks Entry** — Enter marks per student per subject with upsert support
- 📋 **Report Card** — Auto-generated report card with per-subject breakdown
- 📊 **Class Results** — View all students ranked by percentage
- 🏆 **Top Performers** — Leaderboard of top 5 students
- 📈 **Statistics Dashboard** — Class-wise and subject-wise aggregate analytics
- ⚡ **Auto Grade Calculation** — PostgreSQL trigger updates grades instantly on every marks change
- 🛡️ **Error Boundary** — React error boundary prevents silent white-screen crashes

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Axios, plain CSS |
| **Backend** | Node.js (ES Modules), Express 4 |
| **Database** | PostgreSQL 16+ |
| **DB Driver** | node-postgres (`pg`) |
| **Dev Tools** | Nodemon, dotenv |

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## 🗂️ Project Structure

```
student-result-system/
│
├── 📁 backend/
│   ├── 📁 routes/
│   │   ├── students.js       # CRUD + aggregate summary
│   │   ├── subjects.js       # CRUD for subjects
│   │   ├── marks.js          # Save marks (trigger fires automatically)
│   │   └── results.js        # Report card, stats, toppers
│   │
│   ├── db.js                 # DB connection + auto table creation + trigger setup
│   ├── server.js             # Express app entry point + seed route
│   ├── schema.sql            # Raw SQL reference (tables run auto via db.js)
│   ├── .env.example          # Environment variable template
│   └── package.json
│
└── 📁 frontend/
    ├── 📁 public/
    │   └── index.html
    │
    ├── 📁 src/
    │   ├── 📁 pages/
    │   │   ├── Students.js   # Add / view / delete students
    │   │   ├── Subjects.js   # Add / view / delete subjects
    │   │   ├── Marks.js      # Enter marks per student
    │   │   └── Results.js    # Report card, class results, statistics tab
    │   │
    │   ├── api.js            # Centralized Axios API calls
    │   ├── App.js            # Navigation + Error Boundary
    │   ├── App.css           # All styles
    │   └── index.js
    │
    └── package.json
```

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## 🗃️ Database Design

### Entity Relationship Overview

```
┌──────────────┐        ┌──────────────────┐        ┌─────────────┐
│   students   │        │      marks       │        │  subjects   │
│──────────────│        │──────────────────│        │─────────────│
│ student_id PK│◄──1──N─│ mark_id       PK │─N──1──►│ subject_id  │
│ name         │        │ student_id    FK │        │ subject_name│
│ email        │        │ subject_id    FK │        │ subject_code│
│ phone        │        │ marks_obtained   │        │ max_marks   │
│ date_of_birth│        │ exam_type        │        └─────────────┘
│ class        │        │ exam_date        │
│ created_at   │        └──────────────────┘
└──────┬───────┘                │
       │                        │ TRIGGER fires here
       │ 1:1                    ▼
       │              ┌──────────────────┐
       └──────────────│     grades       │
                      │──────────────────│
                      │ grade_id      PK │
                      │ student_id    FK │
                      │ percentage       │
                      │ grade            │
                      │ remarks          │
                      │ calculated_at    │
                      └──────────────────┘
```

### Tables

| Table | Description | Key Constraints |
|-------|-------------|-----------------|
| `students` | Student personal details | email UNIQUE, NOT NULL |
| `subjects` | Subject definitions | subject_code UNIQUE |
| `marks` | Marks per student per subject | UNIQUE(student_id, subject_id, exam_type) |
| `grades` | Auto-calculated grade summary | student_id UNIQUE (1 row per student) |

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## ⚡ Trigger — `trg_auto_grade`

This is the core DBMS feature of this project. A **row-level PostgreSQL trigger** that fires automatically whenever data in the `marks` table changes.

```sql
CREATE TRIGGER trg_auto_grade
AFTER INSERT OR UPDATE OR DELETE ON marks
FOR EACH ROW
EXECUTE FUNCTION calculate_grade_trigger();
```

### How it works

```
Teacher saves marks in frontend
         │
         ▼
   INSERT into marks
         │
         ▼
┌────────────────────────────┐
│  trg_auto_grade fires  ⚡  │  ← PostgreSQL handles this automatically
└────────────────────────────┘
         │
         ▼
  SUM all marks for student
         │
         ▼
  Calculate percentage
         │
         ▼
  Assign grade (A+/A/B/C/D/F)
         │
         ▼
  UPSERT into grades table ✅
```

### Grade Scale

| Percentage | Grade | Remarks |
|-----------|-------|---------|
| ≥ 90% | `A+` | Outstanding |
| ≥ 80% | `A` | Excellent |
| ≥ 70% | `B` | Very Good |
| ≥ 60% | `C` | Good |
| ≥ 50% | `D` | Average |
| < 50% | `F` | Fail |

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## 📊 Aggregate Functions

Used across the Statistics and Results pages:

| Function | Route | Purpose |
|---------|-------|---------|
| `SUM(marks_obtained)` | `/api/results/reportcard` | Total marks scored by student |
| `SUM(max_marks)` | `/api/results/reportcard` | Total maximum possible marks |
| `AVG(marks_obtained)` | `/api/results/stats` | Average marks per subject |
| `AVG(percentage)` | `/api/results/stats` | Class average percentage |
| `MAX(marks_obtained)` | `/api/results/subject-stats` | Highest marks in a subject |
| `MIN(marks_obtained)` | `/api/results/subject-stats` | Lowest marks in a subject |
| `COUNT(student_id)` | `/api/results/stats` | Total students per class |
| `COUNT(mark_id)` | `/api/results/class` | Subjects completed per student |
| `COUNT(CASE WHEN grade)` | `/api/results/stats` | Grade-wise student breakdown |
| `ROUND(percentage, 2)` | All result routes | Clean 2-decimal output |

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or above
- [PostgreSQL](https://www.postgresql.org/) v14 or above
- npm

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/student-result-system.git
cd student-result-system
```

---

### Step 2 — Create the PostgreSQL database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE student_result_db;
```

> Tables are created **automatically** when the backend starts — no need to run any SQL file manually.

---

### Step 3 — Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_result_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=5001
```

> ⚠️ If your password is all digits (e.g. `0709`), just write it as-is — the code handles `String()` conversion automatically.

---

### Step 4 — Start the backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL
✅ Tables ready: students, subjects, marks, grades
✅ Trigger trg_auto_grade ACTIVE
🚀 Server running on http://localhost:5001
```

---

### Step 5 — Start the frontend

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Step 6 — Load sample data (optional)

Click the **🌱 Load Sample Data** button in the header to auto-populate 3 students, 5 subjects, and random marks.

> If you're on **Node.js v17+** and get a blank page, use:
> ```bash
> npm run start:legacy
> ```

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## 🔌 API Endpoints

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/students` | Get all students |
| `GET` | `/api/students/:id` | Get single student |
| `POST` | `/api/students` | Add new student |
| `PUT` | `/api/students/:id` | Update student |
| `DELETE` | `/api/students/:id` | Delete student |
| `GET` | `/api/students/summary` | Students with aggregate marks data |

### Subjects
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subjects` | Get all subjects |
| `POST` | `/api/subjects` | Add new subject |
| `DELETE` | `/api/subjects/:id` | Delete subject |

### Marks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/marks/student/:id` | Get marks for a student |
| `POST` | `/api/marks` | Save marks (trigger auto-fires) |
| `DELETE` | `/api/marks/:id` | Delete a mark entry |

### Results & Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/results/reportcard/:id` | Full report card with aggregate summary |
| `GET` | `/api/results/class?class=CSE-F` | Class-wise results |
| `GET` | `/api/results/toppers` | Top 5 students |
| `GET` | `/api/results/stats` | Class statistics (AVG, MAX, MIN, COUNT) |
| `GET` | `/api/results/subject-stats` | Subject-wise statistics |

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

## 🧠 DBMS Concepts Covered

| Concept | Where Used |
|---------|-----------|
| **CRUD Operations** | All 4 tables via REST API |
| **Primary Key** | Every table has SERIAL PK |
| **Foreign Key** | marks → students, marks → subjects, grades → students |
| **UNIQUE Constraint** | email, subject_code, (student_id, subject_id, exam_type) |
| **CHECK Constraint** | marks_obtained >= 0 |
| **ON DELETE CASCADE** | Deleting student removes all their marks and grades |
| **TRIGGER** | `trg_auto_grade` — auto-calculates grade on marks change |
| **Aggregate Functions** | SUM, AVG, MAX, MIN, COUNT, ROUND across result routes |
| **GROUP BY** | Class-wise and subject-wise statistics |
| **JOIN** | marks joined with students and subjects |
| **Upsert** | ON CONFLICT DO UPDATE for marks and grades |
| **Transactions** | Used in marks entry for atomicity |
| **Normalization** | Tables in 3NF — no redundant data |
| **CASE Statement** | Grade assignment inside trigger function |

<br/>

![-----](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<div align="center">

Made with ❤️ as a DBMS Project

⭐ Star this repo if you found it helpful!

</div>
