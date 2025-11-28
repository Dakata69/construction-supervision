# 📍 Местоположение на файловете и следващи стъпки

## 🗂️ ВСИЧКИ ФАЙЛОВЕ СА LOCATED В:

```
C:\Repositories\construction-supervision\
```

---

## 📂 Структура на проекта

### Backend (Django API)
```
C:\Repositories\construction-supervision\backend\
├── config/              ← Django settings & URLs
├── core/                ← Models, Views, Serializers
│   ├── models/          ← Database models
│   ├── views/           ← API endpoints
│   └── utils/           ← Document generator
├── media/               ← Uploaded & generated files
│   ├── templates/       ← Word templates (.docx)
│   ├── generated/       ← Generated documents
│   └── acts/            ← Uploaded acts
├── manage.py            ← Django CLI
└── requirements.txt     ← Python dependencies
```

### Frontend (React + TypeScript)
```
C:\Repositories\construction-supervision\frontend\
├── src/
│   ├── api/             ← API client (Axios)
│   ├── components/      ← React components
│   ├── pages/           ← Page components
│   ├── store/           ← Redux store
│   └── styles/          ← CSS files
├── package.json         ← npm dependencies
└── vite.config.ts       ← Build configuration
```

### Документация
```
C:\Repositories\construction-supervision\DOCS\
├── 01_ВЪВЕДЕНИЕ_И_ОБЩ_ПРЕГЛЕД.md       ← Системен преглед
├── 02_BACKEND_ДЕТАЙЛНО.md               ← Django детайли
├── 03_FRONTEND_ДЕТАЙЛНО.md              ← React детайли
├── 04_ГЕНЕРИРАНЕ_НА_ДОКУМЕНТИ.md        ← Document generation
└── 05_БАЗА_ДАННИ.md                     ← Database структура
```

### Deployment файлове
```
C:\Repositories\construction-supervision\
├── railway.json         ← Railway deployment config
├── DEPLOY_ONLINE.md     ← Full deployment guide
├── DEPLOYMENT.md        ← General deployment info
└── README.md            ← Project overview
```

---

## 🚀 СЛЕДВАЩИ СТЪПКИ ЗА UPLOAD В GITHUB И DEPLOY

### ✅ ГОТОВО:
- [x] Git repository инициализиран
- [x] Всички файлове committed (178 files)
- [x] Production settings configured
- [x] Deployment configuration готова

### 📤 СЕГА ТРЯБВА ДА НАПРАВИТЕ:

#### 1️⃣ Качване в GitHub (5 минути)

```powershell
# Стъпка 1: Създайте GitHub repository
# Отидете на: https://github.com/new
# Repository name: construction-supervision
# Description: Construction Supervision System - Project Management & Document Generation
# Public/Private: Изберете според предпочитанията
# НЕ добавяйте README, .gitignore или license!

# Стъпка 2: Push към GitHub (замени YOUR_USERNAME!)
cd C:\Repositories\construction-supervision
git remote add origin https://github.com/YOUR_USERNAME/construction-supervision.git
git branch -M main
git push -u origin main
```

#### 2️⃣ Deploy Backend на Railway (10 минути)

```
1. Отидете на: https://railway.app/
2. Sign Up с GitHub account
3. New Project → Deploy from GitHub repo
4. Изберете "construction-supervision"
5. Railway автоматично ще deploy-не!

Environment Variables (Add в Railway dashboard):
   SECRET_KEY=генерирай-нов-случаен-ключ-тук
   DEBUG=False
   ALLOWED_HOSTS=your-app.railway.app
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app

6. Получавате URL: https://construction-supervision-production.railway.app
```

#### 3️⃣ Deploy Frontend на Vercel (5 минути)

```
1. Отидете на: https://vercel.com/
2. Sign Up с GitHub account
3. New Project → Import construction-supervision
4. Framework Preset: Vite
5. Root Directory: frontend
6. Build Command: npm run build
7. Output Directory: dist

Environment Variables:
   VITE_API_URL=https://your-backend.railway.app/api/

8. Deploy!
9. Получавате URL: https://construction-supervision.vercel.app
```

#### 4️⃣ Свържете Backend и Frontend

```
Railway Environment Variables (update):
   CORS_ALLOWED_ORIGINS=https://construction-supervision.vercel.app
   ALLOWED_HOSTS=your-backend.railway.app,construction-supervision.vercel.app
```

---

## 📋 Пълна документация

### За deployment:
📄 **DEPLOY_ONLINE.md** - Пълно deployment ръководство
📄 **DEPLOYMENT.md** - General deployment info

### За разработка:
📁 **DOCS/** - 5 детайлни markdown документа на български
📄 **API.md** - API reference
📄 **MANUAL.md** - User manual
📄 **README.md** - Project overview

---

## 🔗 Полезни линкове

### Services:
- GitHub: https://github.com/
- Railway: https://railway.app/
- Vercel: https://vercel.com/

### Documentation:
- Django: https://docs.djangoproject.com/
- React: https://react.dev/
- Railway Docs: https://docs.railway.app/
- Vercel Docs: https://vercel.com/docs

---

## 💡 Бързи команди

### Local Development:
```powershell
# Backend
cd backend
python manage.py runserver

# Frontend (нов terminal)
cd frontend
npm run dev
```

### Git:
```powershell
# Status
git status

# Commit нови промени
git add .
git commit -m "Your commit message"
git push

# Pull latest changes
git pull
```

### Deploy:
```
Railway: git push → Auto deploy
Vercel: git push → Auto deploy
```

---

## ✅ Checklist

- [ ] GitHub repository създаден
- [ ] Code push-нат към GitHub
- [ ] Railway account създаден
- [ ] Backend deployed на Railway
- [ ] Vercel account създаден
- [ ] Frontend deployed на Vercel
- [ ] Environment variables configured
- [ ] CORS configured
- [ ] Tested: Login works
- [ ] Tested: Document generation works
- [ ] Custom domain added (optional)

---

## 📞 Support

При проблеми:
1. Проверете Railway logs: `railway logs`
2. Проверете Vercel deployment logs
3. Прегледайте DEPLOY_ONLINE.md за troubleshooting
4. Прегледайте DOCS/ файловете за код обяснения

---

## 🎉 След успешен deploy

Вашата система ще бъде:
- 🌐 Онлайн 24/7
- 🔒 HTTPS защитена
- 🚀 Автоматично deploy при git push
- 💰 Безплатна (Railway $5 credit + Vercel unlimited)
- 📊 Мониторинг в Railway и Vercel dashboards

**URL-и:**
- Backend API: `https://your-app.railway.app/api/`
- Frontend: `https://your-app.vercel.app`

**Готово за употреба! 🎊**
