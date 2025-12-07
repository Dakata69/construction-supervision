# Deployment Tutorial: GitHub → Railway (Backend) → Vercel (Frontend)

This tutorial walks you through deploying your construction-supervision project end-to-end. Follow each section in order.

---

## Overview

Your project has three parts:
- **Backend**: Django API running on Railway (Linux server)
- **Frontend**: React + Vite running on Vercel
- **Repository**: Hosted on GitHub (both platforms pull code from here)

Flow: GitHub → Railway (detects and builds backend) → Vercel (builds and serves frontend)

---

## Part 1: Push Your Code to GitHub

### 1.1 Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `construction-supervision`
3. **Description**: "Construction supervision application with Django backend and React frontend"
4. **Public** or **Private** (choose based on preference)
5. Click **Create repository**
6. Copy the HTTPS URL (e.g., `https://github.com/YOUR_USERNAME/construction-supervision.git`)

### 1.2 Add Remote and Push

Open PowerShell in your repo folder and run:

```powershell
# Replace with your GitHub URL
git remote add origin https://github.com/YOUR_USERNAME/construction-supervision.git

# Push to GitHub (creates remote-tracking branch)
git branch -M main
git push -u origin main
```

**Expected output**: Pushes all commits to `main` branch on GitHub.

✅ **Done**: Your code is now on GitHub.

---

## Part 2: Deploy Backend to Railway

### 2.1 Create a Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended—easier integration)
3. Authorize Railway to access your GitHub repos

### 2.2 Create a New Project

1. Click **New Project** (top-right)
2. Select **Deploy from GitHub repo**
3. **Select Repository**: Click "Github Repo" and choose `construction-supervision`
4. Click **Deploy**

Railway will start building immediately. It detects your `Procfile` and `start.sh` at the repo root and runs:
```
sh start.sh
→ pip install -r backend/requirements.txt
→ python backend/manage.py collectstatic --noinput
→ python backend/manage.py migrate --noinput
→ gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

**Watch the logs**: In Railway → Deployments → Logs (last tab). Look for "Deploying", "Running", and "Listening on 0.0.0.0:PORT" (success).

### 2.3 Configure Environment Variables

Once the build completes, go to **Settings** → **Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `SECRET_KEY` | Long random string (e.g., 50+ chars) | Generate at [djecrety.ir](https://djecrety.ir) |
| `DEBUG` | `False` | Production mode |
| `ALLOWED_HOSTS` | Your Railway domain (see below) | Prevents host header attacks |
| `CORS_ALLOWED_ORIGINS` | Your Vercel frontend URL (added later) | Allows frontend to call backend |
| `DATABASE_URL` | Auto-provided by Railway | Used by `dj_database_url` in settings.py |

#### Where to find your Railway domain:

1. In Railway dashboard, click your project
2. Click the **Backend service** (e.g., "construction-supervision" or "sincere-wholeness")
3. Go to **Settings** tab
4. Under **Domains**, you'll see a public URL like `yourapp-production.up.railway.app`
5. Copy this URL (without `https://`)

Set `ALLOWED_HOSTS` to this domain. For example:
```
ALLOWED_HOSTS=yourapp-production.up.railway.app,localhost,127.0.0.1
```

**Save and Redeploy**: After setting variables, Railway automatically redeploys. Watch logs to confirm success.

✅ **Done**: Backend is live and responding to API calls.

Test it:
```powershell
# Replace with your Railway domain
curl https://yourapp-production.up.railway.app/api/
```

---

## Part 3: Deploy Frontend to Vercel

### 3.1 Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your GitHub repos

### 3.2 Import and Deploy

1. Click **Add New** → **Project**
2. Select **Import Git Repository**
3. Choose `construction-supervision` from your GitHub repos
4. Click **Import**

#### Configure Build Settings

On the **Configure Project** screen:

- **Framework Preset**: Vite (auto-detected)
- **Root Directory**: `frontend/` (Vercel deploys from here)
- **Build Command**: `npm run build` (from `frontend/package.json`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Click **Deploy**.

Vercel will build the frontend and provide a URL like `construction-supervision.vercel.app`.

### 3.3 Set Frontend API URL

Your frontend needs to know the backend URL. Add an environment variable:

1. In Vercel dashboard → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://yourapp-production.up.railway.app/api/` (with trailing slash)
   - **Environments**: Production, Preview, Development
3. Click **Save**

4. Go back to **Deployments** and click **Redeploy** on the latest deployment
5. Watch the build logs. Confirm success when you see "✓ Ready [URL]"

✅ **Done**: Frontend is live and connected to backend.

---

## Part 4: Test the Full Stack

### 4.1 Test Backend

Open your terminal and test the backend API:

```powershell
# Replace with your Railway domain
$backend_url = "https://yourapp-production.up.railway.app/api"
curl "$backend_url/"
```

You should see a JSON response (API root).

### 4.2 Test Frontend

1. Open your browser and go to `https://construction-supervision.vercel.app` (or your Vercel URL)
2. The page should load
3. Try logging in or creating a project
4. Check the Network tab (F12) to confirm API requests go to your Railway domain

### 4.3 Full Integration Check

- Login works → ✅ (authentication endpoint reached)
- Create/view projects → ✅ (project CRUD works)
- Generate documents → ✅ (document generation works)

---

## Part 5: Ongoing Updates

### Deploy New Backend Changes

1. Make changes locally in `backend/`
2. Test locally: `python backend/manage.py runserver`
3. Commit and push:
   ```powershell
   git add .
   git commit -m "Describe your changes"
   git push
   ```
4. Railway automatically redeploys when you push to `main`
5. Watch logs in Railway dashboard to confirm

### Deploy New Frontend Changes

1. Make changes locally in `frontend/`
2. Test locally: `npm run dev`
3. Commit and push:
   ```powershell
   git add .
   git commit -m "Describe your changes"
   git push
   ```
4. Vercel automatically redeploys when you push to `main`
5. Watch build logs in Vercel dashboard

### Running Migrations

If you add new Django models:

1. Create migration locally:
   ```powershell
   python backend/manage.py makemigrations
   python backend/manage.py migrate
   ```
2. Commit and push
3. `start.sh` runs `migrate` on Railway during deployment, so changes apply automatically

---

## Troubleshooting

### Railway Build Fails

**Error**: "Script start.sh not found" or "Railpack could not determine build"
- **Fix**: Ensure `start.sh` and `Procfile` are at the repo root (not in a subfolder), committed, and pushed
  ```powershell
  git ls-files | Select-String "start.sh|Procfile"
  ```
  Should show:
  ```
  Procfile
  start.sh
  ```

**Error**: "pip install failed"
- **Fix**: Check `backend/requirements.txt` for typos or incompatible versions
  ```powershell
  pip install -r backend/requirements.txt  # Test locally first
  ```

**Error**: "No module named 'X'" at runtime
- **Fix**: Add missing package to `backend/requirements.txt`, commit, and push. Railway redeploys automatically.

### Railway App Crashes at Start

**Error**: "Application failed to start" in logs
- **Check**: Ensure `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` are set in Railway Variables
  - Log into Railway → Project → Settings → Variables
- **Check**: Database migrations: Look for "django.db.utils.OperationalError"
  - Ensure `DATABASE_URL` is set (Railway provides it); Railway runs `migrate` in `start.sh`

### Vercel Build Fails

**Error**: "Module not found" for a frontend package
- **Fix**: Ensure `package.json` lists the dependency
  ```powershell
  cd frontend
  npm install missing-package
  git add package.json package-lock.json
  git commit -m "Add missing-package"
  git push
  ```

**Error**: `VITE_API_URL` is undefined in frontend
- **Fix**: Check Vercel → Settings → Environment Variables
  - Ensure `VITE_API_URL` is set for all environments
  - Redeploy the latest commit

### Frontend Can't Connect to Backend

**Error**: Network requests to backend fail (CORS, timeout, 404)
- **Check 1**: Ensure `VITE_API_URL` in Vercel is correct
  - Should match your Railway domain, e.g., `https://yourapp-production.up.railway.app/api/`
- **Check 2**: Ensure Railway `CORS_ALLOWED_ORIGINS` includes your Vercel domain
  - Example: `https://construction-supervision.vercel.app` or `https://your-custom-domain.vercel.app`
  - Add multiple origins separated by commas if testing locally
- **Check 3**: Test manually:
  ```powershell
  $backend = "https://yourapp-production.up.railway.app/api/"
  curl -H "Origin: https://construction-supervision.vercel.app" "$backend"
  ```

---

## Quick Reference: Key URLs and Commands

| Item | URL/Command | Example |
|------|-------------|---------|
| GitHub Repo | `https://github.com/YOUR_USERNAME/construction-supervision` | - |
| Railway Backend | `https://yourapp-production.up.railway.app/api/` | Check in Railway dashboard |
| Vercel Frontend | `https://construction-supervision.vercel.app` | Check in Vercel dashboard |
| Push updates | `git push` | Automatic redeploy on both platforms |
| Test backend | `curl https://yourapp-production.up.railway.app/api/` | - |
| Local dev (backend) | `python backend/manage.py runserver` | Runs on `http://localhost:8000/api/` |
| Local dev (frontend) | `npm run dev` (in `frontend/`) | Runs on `http://localhost:5173` |

---

## Summary

You've now deployed:
1. ✅ Code to GitHub
2. ✅ Backend to Railway (auto-builds from GitHub on every push)
3. ✅ Frontend to Vercel (auto-builds from GitHub on every push)
4. ✅ Both connected via `VITE_API_URL` and `CORS_ALLOWED_ORIGINS`

**Next time you push to GitHub**, both platforms automatically redeploy. No manual steps needed.

Questions? Check the logs:
- **Railway**: Dashboard → Deployments → Logs
- **Vercel**: Dashboard → Deployments → Logs

Good luck! 🚀
