# Railway Deployment Guide for Todo Backend

This guide explains how to deploy the FastAPI backend to [Railway](https://railway.app/).

## Prerequisites

- A [Railway](https://railway.app/) account
- A [GitHub](https://github.com/) account connected to Railway
- Your **Neon DB Connection String**
- A generated **BETTER_AUTH_SECRET**

## 1. Project Setup in Railway

1.  **New Project:** Click "New Project" -> "Deploy from GitHub repo".
2.  **Select Repo:** Choose your `hackathon-todo` repository.
3.  **Variables:** Click "Add Variables" before deploying.

## 2. Environment Variables

You must set these in the **Variables** tab of your service in Railway.

| Variable | Value / Description | Required? |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/neondb?sslmode=require` <br>*(Copy from Neon Console)* | **YES** |
| `BETTER_AUTH_SECRET` | `your-generated-secret-string` <br>*(Must match frontend)* | **YES** |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` <br>*(Your deployed Frontend URL)* | **YES** |
| `ENVIRONMENT` | `production` | **YES** |
| `LOG_LEVEL` | `INFO` | No |
| `PORT` | `8000` (Railway sets this automatically, but you can force it) | No |

> **⚠️ Important:** Ensure `?sslmode=require` is at the end of your `DATABASE_URL`.

## 3. Service Configuration (Settings Tab)

Railway attempts to auto-detect settings, but you should verify these to ensure stability.

### **Root Directory**
Since this is a monorepo, you must tell Railway where the backend code lives.
*   **Root Directory:** `backend`

### **Build & Start Commands**
*   **Build Command:** `uv sync` (or leave blank if using Dockerfile)
*   **Start Command:**
    ```bash
    sh -c "uv run alembic upgrade head && uv run uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}"
    ```
    *Note: This command runs migrations automatically and binds to Railway's dynamic PORT.*

### **Networking**
*   **Public Networking:** Click "Generate Domain" to get a public URL (e.g., `todo-backend-production.up.railway.app`).
*   **Port:** Railway usually detects `8000` from your `Dockerfile`. If it defaults to something else, set the `PORT` variable to `8000`.

## 4. Docker Deployment (Recommended)

Since your project includes a `Dockerfile` in `backend/`, Railway will likely default to building from it. This is the most reliable method.

**Verify Dockerfile Settings:**
If Railway asks, or if the build fails:
1.  Go to **Settings** -> **Build**.
2.  Ensure **Builder** is set to `Dockerfile`.
3.  Ensure **Docker Context** is set to `/backend` (or just `.` if you set Root Directory to `backend`).

## 5. Connecting to Frontend

Once deployed:
1.  Copy the **Public URL** (e.g., `https://web-production-123.up.railway.app`).
2.  Go to your **Frontend** (Vercel/Railway).
3.  Update the Frontend environment variable:
    ```env
    NEXT_PUBLIC_API_URL=https://web-production-123.up.railway.app/api
    ```

## Troubleshooting

### **Health Check Fails**
*   Check **Logs**.
*   If you see "Address already in use", ensure you aren't trying to bind a specific port conflicting with Railway's `$PORT`.
*   Ensure `/api/health` is returning 200.

### **Database Errors**
*   Verify `DATABASE_URL` has `sslmode=require`.
*   Check if Neon Compute is active (it sleeps after inactivity).

### **CORS Errors on Frontend**
*   Double-check `CORS_ORIGINS` in Railway matches your Frontend URL exactly (no trailing slash).
