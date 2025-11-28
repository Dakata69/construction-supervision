# 🚀 Deploy Guide - Online 24/7 Hosting

## Опции за безплатен hosting

### Backend (Django) Options:

1. **Railway.app** ⭐ ПРЕПОРЪЧАН
2. **Render.com** 
3. **PythonAnywhere**
4. **Fly.io**

### Frontend (React) Options:

1. **Vercel** ⭐ ПРЕПОРЪЧАН
2. **Netlify**
3. **GitHub Pages** (само статични файлове)

---

## 🎯 Препоръчана комбинация: Railway + Vercel

### Защо Railway + Vercel?
- ✅ Railway: Безплатно до 5$ месечно credit (достатъчно за малък проект)
- ✅ Vercel: Безплатно за unlimited frontend deployments
- ✅ Автоматичен deploy при git push
- ✅ HTTPS certificates (SSL) included
- ✅ Custom domain support

---

## PART 1: Backend Deploy (Railway.app)

### Стъпка 1: Подготовка на проекта

#### 1.1 Създайте `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && python manage.py migrate && gunicorn config.wsgi --bind 0.0.0.0:$PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 1.2 Обновете `backend/config/settings.py`:

```python
import os
import dj_database_url

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-development-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Database - използва Railway PostgreSQL ако е налична
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600
    )
}

# CORS Settings
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:5174'
).split(',')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

#### 1.3 Добавете в `backend/requirements.txt`:

```
gunicorn==21.2.0
dj-database-url==2.1.0
psycopg2-binary==2.9.9
whitenoise==6.6.0
```

#### 1.4 Обновете `backend/config/settings.py` (middleware):

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # ← Добави това
    # ... останалите middleware
]

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### Стъпка 2: Deploy на Railway

1. Отидете на https://railway.app/
2. Sign Up / Login с GitHub
3. New Project → Deploy from GitHub repo
4. Изберете `construction-supervision` repository
5. Railway ще detect-не автоматично Python проект

### Стъпка 3: Configure Environment Variables

В Railway dashboard → Variables → Add:

```
SECRET_KEY=your-super-secret-random-key-here-generate-new-one
DEBUG=False
ALLOWED_HOSTS=your-app.railway.app,localhost
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
PYTHONPATH=/app/backend
```

### Стъпка 4: Add PostgreSQL Database (Optional)

1. Railway dashboard → New → Database → PostgreSQL
2. Railway автоматично ще add-не `DATABASE_URL` variable
3. Backend ще използва PostgreSQL вместо SQLite

### Стъпка 5: Deploy

1. Railway ще deploy-не автоматично
2. Чакайте build & deploy (~2-5 минути)
3. Получавате URL: `https://construction-supervision-production-xxxx.railway.app`

---

## PART 2: Frontend Deploy (Vercel)

### Стъпка 1: Подготовка

#### 1.1 Обновете `frontend/src/api/client.ts`:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### 1.2 Създайте `frontend/.env.production`:

```
VITE_API_URL=https://your-backend.railway.app/api/
```

#### 1.3 Vercel вече има `vercel.json` (готов е!)

### Стъпка 2: Deploy на Vercel

1. Отидете на https://vercel.com/
2. Sign Up / Login с GitHub
3. New Project → Import Git Repository
4. Изберете `construction-supervision`
5. Framework Preset: **Vite**
6. Root Directory: `frontend`
7. Build Command: `npm run build`
8. Output Directory: `dist`
9. Environment Variables:
   ```
   VITE_API_URL=https://your-backend.railway.app/api/
   ```
10. Deploy!

### Стъпка 3: Получавате URL

```
https://construction-supervision.vercel.app
```

---

## PART 3: Свързване на Backend и Frontend

### Обновете Railway Environment Variables:

```
CORS_ALLOWED_ORIGINS=https://construction-supervision.vercel.app,http://localhost:5173
ALLOWED_HOSTS=your-backend.railway.app,localhost
```

### Тествайте:

1. Отворете `https://construction-supervision.vercel.app`
2. Login трябва да работи
3. API заявките трябва да работят

---

## 🔐 Security Checklist

- [ ] `DEBUG=False` в production
- [ ] Генерирайте нов `SECRET_KEY` (не използвайте default-ния!)
- [ ] `ALLOWED_HOSTS` съдържа само вашите домейни
- [ ] `CORS_ALLOWED_ORIGINS` съдържа само frontend URL
- [ ] PostgreSQL database за production (не SQLite!)
- [ ] HTTPS enabled (Railway & Vercel го правят автоматично)

---

## 📊 Мониторинг

### Railway Dashboard:
- View logs: Railway dashboard → Deployments → View logs
- Resource usage: Dashboard → Metrics

### Vercel Dashboard:
- View deployment logs
- Analytics
- Performance metrics

---

## 🔄 Automatic Deploys

При всеки `git push`:

1. **Railway** ще rebuild и redeploy backend автоматично
2. **Vercel** ще rebuild и redeploy frontend автоматично

Няма нужда да правите нищо ръчно!

---

## 💰 Costs (Безплатни limits)

### Railway:
- $5 месечен credit безплатно
- ~500 часа execution time
- Достатъчно за малък проект с ниска трафика

### Vercel:
- Unlimited deployments
- 100GB bandwidth/месец
- Достатъчно за средна употреба

---

## 🆘 Troubleshooting

### Backend не стартира:

```bash
# Railway logs:
railway logs

# Проверете дали manage.py е в правилната папка
# Проверете PYTHONPATH environment variable
```

### CORS грешки:

```python
# backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    'https://your-frontend.vercel.app',
]
CORS_ALLOW_CREDENTIALS = True
```

### Static files не се зареждат:

```bash
# Изпълнете в Railway terminal:
python backend/manage.py collectstatic --noinput
```

---

## 📚 Допълнителни ресурси

- Railway docs: https://docs.railway.app/
- Vercel docs: https://vercel.com/docs
- Django deployment: https://docs.djangoproject.com/en/5.0/howto/deployment/

---

## ✅ Финален резултат

След deploy имате:

- 🌐 **Backend API**: `https://your-app.railway.app/api/`
- 🎨 **Frontend**: `https://your-app.vercel.app`
- 🔄 **Auto-deploy**: При всеки git push
- 🔒 **HTTPS**: Автоматично SSL certificates
- 📊 **Monitoring**: Logs & metrics в dashboards
- 💰 **Free**: Безплатно за малки проекти!

**Системата е онлайн 24/7 и достъпна от всяко място!** 🚀
