# Frontend Docker Setup Guide

**Patient Registration System**  
This guide explains how to run the frontend application in Docker and connect it to the backend API.

---

## Overview

The backend API runs at `http://localhost:3008/api/v1` with Swagger at `http://localhost:3008/docs`.  
The frontend is expected to run on one of these typical ports:

- **Angular:** `http://localhost:4200`
- **Vite (React/Vue):** `http://localhost:5173` or `http://localhost:5174`
- **Next.js:** `http://localhost:3000`

The backend CORS (`ALLOWED_ORIGINS`) must include your frontend’s origin.

---

## Prerequisites

- Docker and Docker Compose installed
- Backend API running (either in Docker or locally on port 3008)

---

## Option 1: Standalone Frontend Container

Run the frontend by itself, pointing at the backend on the host or another service.

### React / Vite

**`Dockerfile`** (in your frontend project root):

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=http://localhost:3008/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`nginx.conf`** (S3-style routing for SPA):

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://host.docker.internal:3008;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Build & run:**
```bash
docker build --build-arg VITE_API_URL=http://localhost:3008/api/v1 -t patient-frontend .
docker run -p 3000:80 patient-frontend
```

Access the app at `http://localhost:3000`.

---

### Angular

**`Dockerfile`**:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG API_URL=http://localhost:3008/api/v1
ENV API_URL=$API_URL
RUN npm run build -- --configuration=production

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist/patient-registration/browser /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`nginx.conf`** (same as above, or only `try_files`):

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Build & run:**
```bash
docker build --build-arg API_URL=http://localhost:3008/api/v1 -t patient-frontend .
docker run -p 3000:80 patient-frontend
```

---

## Option 2: Frontend + Backend via Docker Compose

Place this in the project root or in a directory that has access to both frontend and backend.

**`docker-compose.frontend.yml`**:

```yaml
services:
  postgres:
    image: postgres:17
    container_name: nest-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: localhost
      POSTGRES_DB: patient-system
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 2s
      timeout: 5s
      retries: 10
      start_period: 10s

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: patient-registration-backend
    ports:
      - "3008:3008"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:localhost@postgres:5432/patient-system
      JWT_SECRET: healthcare-jwt-secret-key-min-32-chars-change-in-prod
      JWT_EXPIRES_IN: 15m
      JWT_REFRESH_SECRET: healthcare-refresh-secret-key-min-32-chars-change-in-prod
      JWT_REFRESH_EXPIRES_IN: 7d
      OTP_EXPIRY_MINUTES: 5
      OTP_LENGTH: 6
      PORT: 3008
      NODE_ENV: development
      APP_NAME: Patient Registration System
      API_PREFIX: api/v1
      ALLOWED_ORIGINS: http://localhost:3000,http://localhost:4200,http://localhost:5173,http://localhost:5174,http://frontend:80

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:3008/api/v1
    container_name: patient-registration-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

If your frontend lives in a `frontend/` subdirectory, the `context` and `dockerfile` paths are set for that structure. Adjust if your layout differs.

---

## Option 3: Dev Container (Hot Reload)

For local development with live reload:

**`Dockerfile.dev`** (React/Vite example):

```dockerfile
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
RUN npm install

COPY . .

# Use host network or expose port
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**`docker-compose.dev.yml`**:

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: patient-frontend-dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules  # Preserve container node_modules
    environment:
      VITE_API_URL: http://host.docker.internal:3008/api/v1
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Run:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Access the app at `http://localhost:5173`. Changes in `./frontend` will trigger hot reload.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL (Vite) | `http://localhost:3008/api/v1` |
| `NG_APP_API_URL` | API base URL (Angular) | `http://localhost:3008/api/v1` |
| `REACT_APP_API_URL` | API base URL (Create React App) | `http://localhost:3008/api/v1` |
| `NEXT_PUBLIC_API_URL` | API base URL (Next.js) | `http://localhost:3008/api/v1` |

These are typically used at **build time** (e.g. `VITE_`, `NG_APP_`, `NEXT_PUBLIC_`).

---

## CORS Configuration

The backend `ALLOWED_ORIGINS` must include the frontend origin:

- Dev: `http://localhost:5173`, `http://localhost:4200`, etc.
- Docker (browser): `http://localhost:3000` (where nginx serves the app)
- Same network: `http://frontend:80` if the browser makes requests that appear to come from that host (usually not the case for SPAs).

For normal SPA usage (browser on host), `http://localhost:3000` (or whichever port you publish) is what CORS will see. Ensure that origin is in `ALLOWED_ORIGINS`.

---

## Production Notes

1. **Build args:** Pass the real API URL as a build arg:
   ```bash
   docker build --build-arg VITE_API_URL=https://api.example.com/api/v1 -t patient-frontend .
   ```

2. **Nginx:** Add gzip, caching, and security headers as needed.

3. **HTTPS:** Use a reverse proxy (e.g. Traefik, Caddy) for termination.

4. **Same-origin API:** Optionally proxy `/api` in nginx to the backend to avoid CORS and keep a single origin.

---

## Quick Reference

| Scenario | Command |
|----------|---------|
| Standalone frontend build | `docker build -t patient-frontend . && docker run -p 3000:80 patient-frontend` |
| Full stack (backend + frontend) | `docker compose -f docker-compose.frontend.yml up -d` |
| Dev with hot reload | `docker compose -f docker-compose.dev.yml up` |

---

## API Base URLs

- **Local backend:** `http://localhost:3008/api/v1`
- **Backend in Docker (from host browser):** `http://localhost:3008/api/v1`
- **Backend from frontend container:** `http://backend:3008/api/v1` (only when using backend hostname inside Docker network)
- **Production:** Use your public API URL (e.g. `https://api.yourdomain.com/api/v1`)
