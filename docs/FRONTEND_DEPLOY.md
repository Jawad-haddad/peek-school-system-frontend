# Frontend Deployment Guide

This guide describes how to run the Peek School System frontend in a production environment using Docker.

## Prerequisites

- Docker and Docker Compose installed.
- A running instance of the Peek backend API (typically `peek_backend_prod`). 

## Running the Frontend

The project includes a production-ready `docker-compose.prod.yml` and a multi-stage `Dockerfile`.

1. Ensure the `NEXT_PUBLIC_API_BASE_URL` in `docker-compose.prod.yml` is set to point to your backend service. 
   - Note: If both services run in the same Docker network, use the internal docker hostname of the backend (e.g., `http://backend:3000`).

2. Start the frontend container:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

3. The application will be accessible at `http://localhost:3001` from your host machine browser.

## Architectural Notes 

- **Port Mapping**: Container port `3000` is exposed to host port `3001` to prevent conflicts if the backend is running locally on port `3000`.
- **API Rewrites**: When `NODE_ENV=production` inside the container, Next.js proxy rewrites inside `next.config.ts` are disabled. All requests flow cleanly targeting `NEXT_PUBLIC_API_BASE_URL`.
- **Standalone Build**: The Docker image implements Next.js' `standalone` output mode to dramatically reduce the container image size.

## Unified Compose Example (Monorepo)
If you are running the frontend and backend together from a parent directory's `docker-compose.yml`, you can build the frontend by mapping the context path.

```yaml
services:
  backend:
    # Your backend config...

  frontend:
    build:
      context: ./peek-school-system-frontend # Points to the frontend directory
      dockerfile: Dockerfile
    container_name: peek_frontend_prod
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_BASE_URL=http://backend:3000 # Internal docker network URL
    depends_on:
      - backend
```

To run both simultaneously from the unified compose file:
```bash
docker compose up -d --build
```
