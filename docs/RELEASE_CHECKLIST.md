# Frontend Release Checklist

Before releasing or deploying the Peek School System frontend to production, ensure the following steps are verified.

## 1. Environment Configuration
- [ ] Ensure the production environment has `NEXT_PUBLIC_API_BASE_URL` defined.
  - Example: `NEXT_PUBLIC_API_BASE_URL="https://api.peek.example.com"` (or internal docker reference `http://backend:3000`).
- [ ] (Optional) Ensure `NEXT_PUBLIC_DEBUG_MVP_API` is `false` or removed if you want to hide detailed API transaction logs from the browser console.

## 2. Docker Deployment
If deploying via Docker Compose:
- [ ] Build and start the container:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build
  ```
- [ ] Verify the container is running and healthy:
  ```bash
  docker ps | grep peek_frontend_prod
  ```
- [ ] Run the automated smoke test script to verify basic HTTP reachability:
  ```bash
  npm run smoke:test
  ```

## 3. Manual Build (Non-Docker)
If building natively on a server using Node.js:
- [ ] Install production dependencies strictly:
  ```bash
  npm ci
  ```
- [ ] Build the Next.js production bundle:
  ```bash
  npm run build
  ```
- [ ] Start the Next.js server on standard port:
  ```bash
  npm run start
  ```

## 4. Sanity Checks
Open the application URL (e.g., `http://localhost:3001/`) in a browser:
- [ ] **Open**: The landing/login page loads correctly within a few seconds.
- [ ] **Assets**: The favicon and logo images load properly (no 404s in the network tab).
- [ ] **Login**: Logging in with valid credentials successfully redirects to the dashboard.
- [ ] **Dashboard**: The dashboard components fully mount, meaning the API requests to the connected `NEXT_PUBLIC_API_BASE_URL` succeeded without CORS or rewrites interference.
