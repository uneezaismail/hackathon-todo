# Full-Stack Deployment Guide: Railway (Backend) & Vercel (Frontend)

This guide covers deploying the **FastAPI Backend to Railway** and the **Next.js Frontend to Vercel**.

---

## 1. Prerequisites

- **Neon PostgreSQL**:
  - Connection String (Pooled): Used by Backend & Frontend App logic.
  - Connection String (Direct): Used by Drizzle Migrations (local/CI).
- **Shared Secret**: A strong random string for `BETTER_AUTH_SECRET` (must be identical in both deployments).
- **GitHub Repo**: Your project pushed to GitHub.

---

## 2. Backend Deployment (Railway)

### **A. Project Setup**
1. Log in to [Railway](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your `hackathon-todo` repository.
4. **Click "Add Variables"** (do not deploy yet).

### **B. Service Configuration (Settings Tab)**
Railway needs to know this is a monorepo.

- **Root Directory:** `backend` (This is CRITICAL)
- **Builder:** `Dockerfile` (Recommended)
  - Ensure **Docker Context** is set to `/backend` (or leave default if Root Directory handles it).
- **Start Command:** Leave blank (The `Dockerfile` handles this).
  - *If NOT using Dockerfile:* `uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT`

### **C. Environment Variables (Railway)**
Add these in the **Variables** tab:

| Variable | Value / Description | Required? |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` <br>*(Use the **Pooled** connection string from Neon)* | **YES** |
| `BETTER_AUTH_SECRET` | `your-long-random-shared-secret` <br>*(Must match Vercel)* | **YES** |
| `CORS_ORIGINS` | `https://your-frontend-project.vercel.app` <br>*(Your Vercel URL - no trailing slash)* | **YES** |
| `ENVIRONMENT` | `production` | **YES** |
| `LOG_LEVEL` | `INFO` | No |
| `PORT` | `8000` | No |

### **D. Deploy & Public URL**
1. Click **Deploy**.
2. Go to **Settings** -> **Networking**.
3. Click **Generate Domain** (e.g., `todo-backend-production.up.railway.app`).
4. **Copy this URL**. You need it for Vercel.

---

## 3. Frontend Deployment (Vercel)

### **A. Project Setup**
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your `hackathon-todo` repository.

### **B. Build Configuration**
Vercel detects Next.js, but needs monorepo settings.

- **Framework Preset:** Next.js
- **Root Directory:** `frontend` (Click "Edit" next to Root Directory)
- **Build Command:** `next build` (Default is fine)
- **Output Directory:** `.next` (Default is fine)
- **Install Command:** `npm install` (Default is fine)

### **C. Environment Variables (Vercel)**
Add these in the **Environment Variables** section:

| Variable | Value / Description | Required? |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` <br>*(Use the **Pooled** connection string)* | **YES** |
| `BETTER_AUTH_SECRET` | `your-long-random-shared-secret` <br>*(Must match Railway exactly)* | **YES** |
| `BETTER_AUTH_URL` | `https://your-frontend-project.vercel.app` <br>*(Your Vercel Domain)* | **YES** |
| `NEXT_PUBLIC_BASE_URL`| `https://your-frontend-project.vercel.app` | **YES** |
| `NEXT_PUBLIC_API_URL` | `https://todo-backend-production.up.railway.app` <br>*(Your Railway Backend URL)* | **YES** |
| `NODE_ENV` | `production` | No (Default) |

### **D. Deploy**
1. Click **Deploy**.
2. Vercel will build the frontend.
3. Once done, verify the app loads.

---

## 4. Final Integration Check

1. **CORS:** Go back to Railway -> Variables. Update `CORS_ORIGINS` with your *actual* Vercel URL (e.g., `https://hackathon-todo-frontend.vercel.app`). **Redeploy Backend**.
2. **Auth:** Go to Vercel -> Settings -> Environment Variables. Ensure `BETTER_AUTH_URL` matches your *actual* Vercel URL. **Redeploy Frontend** if changed.
3. **Test:**
   - Open Vercel URL.
   - Sign Up (Tests Database + Better Auth).
   - Create Task (Tests Backend Connection + JWT).

## Troubleshooting

### **Backend (Railway)**
- **Health Check Fail:** Check logs. If "Address already in use", ensure you aren't binding a specific port conflicting with `$PORT`.
- **Database Error:** Verify `DATABASE_URL` ends with `?sslmode=require`.

### **Frontend (Vercel)**
- **500 Error on Login:** Check `BETTER_AUTH_SECRET` matches Backend. Check `DATABASE_URL`.
- **API Error (Network):** Check `NEXT_PUBLIC_API_URL` points to Railway (https).
- **CORS Error:** Check Railway `CORS_ORIGINS`.