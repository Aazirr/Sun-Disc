# Sun Disc - QA Automation Dashboard

Sun Disc is a web app for running automated website tests and viewing clear results in a dashboard.

## 1. Product Goal

Create a simple, reliable QA automation dashboard where users can:
- Run predefined automated tests (starting with a login test).
- See clear PASS/FAIL outcomes.
- View screenshots when a test fails.
- Review recent test runs in a results table.

## 2. Recommended Architecture (MVP)

Use a monorepo with separate frontend and backend apps:
- Frontend: React
- Backend API: Flask (recommended for MVP speed)
- Automation Engine: Selenium (Python)
- Storage: SQLite initially, PostgreSQL later
- File Storage: local folder for screenshots (cloud storage later)

Why Flask first:
- Lower setup overhead than Django.
- Faster to ship MVP API endpoints.
- Easy to scale into FastAPI/Django later if needed.

If you want built-in admin/auth from day one, choose Django instead.

## 3. High-Level System Design

1. User triggers a test from the React dashboard.
2. Backend creates a test run record with status = QUEUED.
3. Selenium worker executes the test flow.
4. On success, status becomes PASS.
5. On failure, status becomes FAIL and stores screenshot path + error details.
6. Frontend polls or fetches latest runs and updates the table.

## 4. Proposed Repository Structure

```text
sun-disc/
  README.md
  .gitignore
  docs/
    architecture.md
    api-spec.md
    testing-strategy.md
  backend/
    app/
      __init__.py
      config.py
      api/
        routes_tests.py
        routes_runs.py
      services/
        test_runner.py
        screenshot_service.py
      automation/
        selenium_driver.py
        test_login.py
      models/
        run.py
      schemas/
        run_schema.py
      utils/
        logger.py
    migrations/
    tests/
    requirements.txt
    run.py
  frontend/
    src/
      app/
      components/
      pages/
      services/
        api.ts
      types/
      hooks/
    public/
    package.json
  storage/
    screenshots/
```

## 5. Backend Domain Model (MVP)

Core entity: TestRun
- id (UUID or integer)
- test_name (example: login_test)
- status (QUEUED, RUNNING, PASS, FAIL)
- started_at
- finished_at
- duration_ms
- error_message (nullable)
- screenshot_path (nullable)
- environment (example: staging, production)

## 6. API Contract (MVP)

Suggested endpoints:
- POST /api/tests/run
  - Body: { test_name, base_url, username?, password?, environment? }
  - Returns: { run_id, status }
- GET /api/runs
  - Query: page, limit, status, test_name
  - Returns: list of test runs
- GET /api/runs/:id
  - Returns details of a single run
- GET /api/runs/:id/screenshot
  - Returns screenshot file (if exists)

## 7. Frontend MVP Screens

1. Dashboard page
- Run Test button/form
- Recent runs table
- Status badges (PASS/FAIL/RUNNING/QUEUED)

2. Run details modal/page
- Basic metadata
- Error message (if failed)
- Screenshot preview

## 8. Selenium Strategy

Initial approach:
- Keep tests modular and deterministic.
- Start with one flow: login test.
- Create shared driver setup/teardown utilities.
- Use explicit waits (avoid brittle sleep-heavy scripts).
- Capture screenshot + page source on exceptions.

Execution model options:
- Synchronous in API request (very simple, not scalable)
- Background queue (recommended next step)

Recommendation:
- Start synchronous for MVP speed.
- Move to background queue with Celery + Redis once stable.

## 9. Suggested Tech Decisions

MVP choices:
- Flask + Flask-SQLAlchemy + Flask-Migrate
- Selenium + Chrome WebDriver
- React + Vite + TypeScript
- UI table: simple custom table first, then add TanStack Table if needed

Later upgrades:
- PostgreSQL for production
- Celery/Redis for async runs
- S3-compatible storage for screenshots
- Authentication (JWT or session)
- Role-based access

## 10. Non-Functional Requirements

- Reliability: retries for transient web failures (optional after MVP).
- Observability: structured logs for each run.
- Security: never store plaintext credentials in logs.
- Performance: cap concurrent runs to avoid overloading worker machine.
- Maintainability: page-object-like pattern for Selenium flows.

## 11. Development Phases

Phase 1 - Foundation
- Initialize backend and frontend projects.
- Add health endpoint and base UI shell.

Phase 2 - First Test Flow
- Implement login test runner with Selenium.
- Add run creation and status persistence.

Phase 3 - Dashboard
- Build runs table and status badges.
- Add details view and screenshot preview.

Phase 4 - Hardening
- Improve error handling.
- Add basic automated tests for API and frontend.
- Add simple auth if needed.

Phase 5 - Scale
- Background job queue.
- Better storage and production deployment setup.

## 12. Immediate Next Steps

1. Confirm backend framework: Flask (recommended) or Django.
2. Scaffold monorepo folders from section 4.
3. Create backend API skeleton and TestRun model.
4. Create React dashboard with a placeholder runs table.
5. Wire first POST /api/tests/run flow end-to-end.

## 13. Project Suggestions

1. Keep the first version intentionally narrow.
- One test type (login), one environment, one browser.

2. Treat test steps as reusable blocks.
- Reuse selectors and wait helpers so future tests are faster to add.

3. Add run metadata early.
- Build number, commit hash, and environment make debugging far easier.

4. Plan for flaky tests now.
- Add simple retry policy and label flaky vs true fail later.

5. Design API with future scheduling in mind.
- You will likely want scheduled/nightly runs after MVP.

## 14. Success Criteria for MVP

- A user can trigger a login test from the dashboard.
- The run appears in the table with live/updated status.
- Failed runs include screenshot and readable error.
- Team can inspect last 20 to 50 runs quickly.

---

If you want, the next step can be scaffolding the actual monorepo folders and starter files for Flask + React + Selenium exactly as defined above.

## Current Status

Feature 1 is implemented:
- Flask backend scaffold with health endpoint.
- React frontend scaffold with health status card.
- Frontend requests backend health from /api/health.

## Run Feature 1 Locally

Backend (Terminal 1):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

Frontend (Terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL shown by Vite (usually http://localhost:5173).
You should see backend health status change to ONLINE when backend is running.
