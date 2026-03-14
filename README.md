# Quantra - Test Management System

A full-stack test management system built with Django REST Framework and React.

## Tech Stack

**Backend:** Django 4.2 + Django REST Framework + JWT Auth + SQLite  
**Frontend:** React 18 + Vite + Tailwind CSS + React Router v6 + Recharts

## Quick Start

```bash
bash setup.sh
```

This will:
1. Create a Python virtual environment and install dependencies
2. Run database migrations
3. Create a demo superuser (admin/admin123) and sample data
4. Install frontend npm packages

### Start Backend

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

## Demo Credentials

| Role   | Username | Password  |
|--------|----------|-----------|
| Admin  | admin    | admin123  |
| Tester | tester1  | tester123 |

Django Admin: http://localhost:8000/admin

## Features

- **Projects**: Create and manage test projects with role-based members (Admin / Tester / Viewer)
- **Test Suites**: Hierarchical suite organization (parent/child suites)
- **Test Cases**: Rich test cases with steps, preconditions, priority, and status
- **Test Runs**: Create runs, add test cases from suites, track execution progress
- **Execution**: Update test results (Passed/Failed/Skipped/Blocked) with notes
- **Reports**: Project summary with pie charts, bar charts, and summary tables
- **Dashboard**: Overview of all projects, recent runs, and result charts

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register/ | Register new user |
| POST | /api/auth/login/ | Get JWT tokens |
| POST | /api/auth/token/refresh/ | Refresh token |
| GET | /api/auth/me/ | Current user info |
| GET/POST | /api/projects/ | List/Create projects |
| GET/PUT/DELETE | /api/projects/{id}/ | Project detail |
| GET/POST | /api/projects/{id}/members/ | List/Add members |
| DELETE | /api/projects/{id}/members/{user_id}/ | Remove member |
| GET/POST | /api/projects/{id}/suites/ | List/Create suites |
| GET/PUT/DELETE | /api/projects/{id}/suites/{id}/ | Suite detail |
| GET/POST | /api/suites/{id}/cases/ | List/Create test cases |
| GET/PUT/DELETE | /api/suites/{id}/cases/{id}/ | Test case detail |
| GET/POST | /api/projects/{id}/runs/ | List/Create runs |
| GET/PUT/DELETE | /api/projects/{id}/runs/{id}/ | Run detail |
| POST | /api/projects/{id}/runs/{id}/add_cases/ | Add cases to run |
| GET | /api/runs/{id}/executions/ | List executions |
| PUT/PATCH | /api/runs/{id}/executions/{id}/ | Update execution |
| GET | /api/reports/dashboard/ | Dashboard stats |
| GET | /api/reports/project/{id}/summary/ | Project summary |
