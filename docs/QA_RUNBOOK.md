# QA Runbook — Real Backend E2E Tests

This runbook covers how to run the Playwright end-to-end tests against a **live backend**.

---

## 1. Required: Start the Backend

Navigate to the backend project and start the server:
```bash
cd ../peek-school-system-backend-main
npm install          # first time only
npm run dev          # starts backend on http://localhost:3000
```

Verify it is healthy:
```bash
curl http://localhost:3000/health
```
Expected: `{"status":"ok"}` (or similar 200 response).

---

## 2. Required: Configure Environment Variables

Copy `.env.example` to `.env.local` in the frontend directory (if not done already):
```bash
cp .env.example .env.local
```

Make sure these values are set in `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"

# Test credentials (must exist in the DB)
TEST_ADMIN_EMAIL="admin@peek.com"
TEST_ADMIN_PASSWORD="password123"
TEST_TEACHER_EMAIL="teacher@peek.com"
TEST_TEACHER_PASSWORD="password123"
TEST_PARENT_EMAIL="parent@peek.com"
TEST_PARENT_PASSWORD="password123"
```

---

## 3. Run the Tests

Playwright will automatically start the Next.js frontend (`npm run dev`) before running tests.

```bash
# Headless (CI-friendly):
npm run qa:e2e

# Interactive (with Playwright UI):
npm run qa:e2e:ui
```

If the backend is not running, Playwright will **fail fast** with a clear message before any test executes.

---

## 4. CI Configuration Example

```yaml
# .github/workflows/qa.yml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install deps
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Run E2E tests
        run: npm run qa:e2e
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          BACKEND_URL: ${{ secrets.BACKEND_URL }}
          FRONTEND_URL: http://localhost:3001
          TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
          TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
          TEST_TEACHER_EMAIL: ${{ secrets.TEST_TEACHER_EMAIL }}
          TEST_TEACHER_PASSWORD: ${{ secrets.TEST_TEACHER_PASSWORD }}
          TEST_PARENT_EMAIL: ${{ secrets.TEST_PARENT_EMAIL }}
          TEST_PARENT_PASSWORD: ${{ secrets.TEST_PARENT_PASSWORD }}
```

---

## 5. Test Coverage

| File | What it tests |
|---|---|
| `e2e/login-admin.spec.ts` | Admin login → redirected to /dashboard |
| `e2e/login-teacher.spec.ts` | Teacher login → redirected to /dashboard |
| `e2e/login-parent.spec.ts` | Parent login → redirected to /dashboard |
| `e2e/broadcast-announcements.spec.ts` | Admin login → navigate to /dashboard/broadcast → form visible |
| `e2e/i18n-toggle.spec.ts` | Toggle AR/EN → `dir` attr changes, button text translates (health mocked only) |
