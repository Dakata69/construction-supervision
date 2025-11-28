# Deployment Guide

## Quick Start: Deploy to Vercel + Railway

### Prerequisites
1. GitHub account
2. Vercel account (https://vercel.com - free tier)
3. Railway account (https://railway.app - free tier)

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/construction-supervision.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose the `backend` folder as root
5. Add environment variables in Railway dashboard:
   - `DJANGO_SECRET_KEY`: Generate a random secret (e.g., use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: Your Railway domain (Railway will show you the URL)
   - `FRONTEND_URL`: Your Vercel frontend URL (add after deploying frontend)
   
6. Railway auto-deploys and gives you a public URL like `https://abc123.up.railway.app`

---

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Import Project" → Select your repo
3. Set "Root Directory" to `frontend`
4. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-railway-url.up.railway.app/api/`
5. Click Deploy

Vercel gives you a URL like `https://your-app.vercel.app`

---

## Step 4: Update Backend CORS

1. Go back to Railway dashboard
2. Update environment variable:
   - `CORS_ALLOWED_ORIGINS`: `https://your-vercel-app.vercel.app`
   - `FRONTEND_URL`: `https://your-vercel-app.vercel.app`
3. Railway auto-redeploys

---

## Step 5: Run migrations on Railway

1. In Railway dashboard, open "Deployments" and find your latest deployment
2. Go to "Logs" to monitor
3. Migrations should run automatically on first deploy (if configured)
4. If not, you may need to run:
   ```bash
   railway run python manage.py migrate
   ```

---

## Create a superuser on Railway

In Railway terminal or via `railway run`:
```bash
railway run python manage.py createsuperuser
```

---

## Troubleshooting

- **CORS errors**: Make sure `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` match your Vercel domain exactly
- **Database errors**: Check `DATABASE_URL` is correct in Railway env vars
- **Static files not loading**: WhiteNoiseMiddleware handles this in production
- **Media files**: Set up S3 bucket for production uploads (beyond this guide)

---

## Local Development

Still works as before:
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit http://localhost:5173
