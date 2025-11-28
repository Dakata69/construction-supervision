# Backend (Django) - Детайлно обяснение

## Какво е Backend?

Backend е **"мозъкът"** на приложението - частта, която:
- Обработва заявки от frontend
- Съхранява и извлича данни от база данни
- Генерира документи
- Проверява права за достъп
- Управлява бизнес логиката

**Аналогия**: Ако frontend е меню и ресторант интериор, backend е кухнята където се готви.

---

## Структура на backend папката

```
backend/
├── config/                     ← Настройки на целия Django проект
│   ├── __init__.py            ← Маркер че това е Python пакет
│   ├── settings.py            ← ОСНОВЕН файл с настройки
│   ├── urls.py                ← Главен файл с URL маршрути
│   └── wsgi.py                ← За deployment на production сървър
│
├── core/                       ← Главното приложение (тук е кодът)
│   ├── __init__.py
│   ├── models/                ← Модели (структура на данните)
│   │   ├── __init__.py
│   │   ├── project.py         ← Модел Project
│   │   ├── document.py        ← Модел Document
│   │   ├── act.py             ← Модел Act
│   │   ├── task.py            ← Модел Task
│   │   └── team.py            ← Модели за екипи
│   │
│   ├── views/                 ← Views (обработка на заявки)
│   │   ├── __init__.py
│   │   ├── project.py         ← API за проекти
│   │   ├── document.py        ← API за документи
│   │   └── act.py             ← API за актове
│   │
│   ├── utils/                 ← Помощни функции
│   │   ├── document_generator.py  ← Генериране на Word
│   │   ├── pdf_export.py          ← Export към PDF
│   │   └── sign_stub.py           ← Подписване на документи
│   │
│   ├── migrations/            ← История на промени в базата данни
│   │   ├── 0001_initial.py
│   │   ├── 0002_*.py
│   │   └── ...
│   │
│   ├── serializers.py         ← Преобразуване Python ↔ JSON
│   ├── permissions.py         ← Права за достъп
│   ├── urls.py                ← URL маршрути за core app
│   └── tests.py               ← Тестове
│
├── media/                      ← Файлове (uploads, generated docs)
│   ├── templates/             ← Word шаблони
│   │   ├── act7_bg.docx
│   │   ├── act14_bg.docx
│   │   └── act15_bg.docx
│   ├── generated/             ← Генерирани документи
│   └── acts/                  ← Качени актове
│
├── logs/                       ← Log файлове
├── db.sqlite3                  ← SQLite база данни (development)
├── manage.py                   ← Django command-line tool
└── requirements.txt            ← Python dependencies
```

---

## Как работи Django? (Стъпка по стъпка)

### Когато получи HTTP заявка:

```
1. HTTP заявка влиза в Django
   │
   ├─> settings.py определя ROOT_URLCONF
   │
2. urls.py (главен) търси съвпадение
   │
   ├─> Намира path('api/', include('core.urls'))
   │
3. core/urls.py продължава търсенето
   │
   ├─> Намира path('projects/', ProjectViewSet)
   │
4. Извиква съответния ViewSet method
   │
   ├─> GET → list() или retrieve()
   ├─> POST → create()
   ├─> PUT → update()
   └─> DELETE → destroy()
   │
5. ViewSet работи с моделите
   │
   ├─> Project.objects.all()  ← Query към базата
   │
6. Serializer преобразува данните
   │
   ├─> Python objects → JSON
   │
7. Връща HTTP Response
   │
   └─> Status 200 OK + JSON данни
```

---

## Файл по файл обяснение

### 1. config/settings.py - Сърцето на конфигурацията

Този файл съдържа ВС ИЧК И настройки на проекта.

```python
# Основни настройки
DEBUG = True  # True = показва грешки (само за development!)
SECRET_KEY = 'tajno-parola-123'  # За криптиране

# Hosts които могат да достъпват
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Инсталирани приложения
INSTALLED_APPS = [
    'django.contrib.admin',      # Admin панел
    'django.contrib.auth',       # Потребители
    'django.contrib.contenttypes',
    'django.contrib.sessions',   # Сесии
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',            # DRF за API
    'corsheaders',               # CORS за frontend
    
    # Нашите apps
    'core',                      # Нашето главно приложение
]

# Middleware (изпълняват се при всяка заявка)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS - ТРЯБВА да е първи!
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# URL configuration
ROOT_URLCONF = 'config.urls'  # Главен файл с URLs

# База данни
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',  # SQLite файл
    }
}

# Статични файлове
STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS настройки (МНОГО ВАЖНО!)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",     # Frontend dev server
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
CORS_ALLOW_CREDENTIALS = True  # Позволява cookies и auth headers
```

**Обяснение на ключови настройки:**

- **DEBUG**: Когато е True, Django показва детайлни грешки. В production ВИНАГИ трябва да е False!
- **SECRET_KEY**: Използва се за криптиране. Трябва да е таен и уникален.
- **INSTALLED_APPS**: Списък с всички Django приложения. Всяко добавя функционалност.
- **MIDDLEWARE**: Код, който се изпълнява ПРЕДИ и СЛЕД всяка заявка. Като охрана на входа.
- **CORS_ALLOWED_ORIGINS**: Кои frontend адреси могат да правят заявки. Без това frontend не може да говори с backend!

---

### 2. config/urls.py - Главният "маршрутизатор"

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),        # Admin панел → /admin/
    path('api/', include('core.urls')),     # API routes → /api/...
]

# Служи media files (само за development!)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Какво се случва тук:**

1. Когато някой отвори `/admin/` → Отива към Django admin панел
2. Когато някой заяви `/api/...` → Препраща към `core/urls.py` за повече маршрути
3. Ако е DEBUG режим → Serve-ва файлове от `media/` папката

**Пример:**
- Заявка към `http://localhost:8000/api/projects/`
- Django вижда `/api/` → препраща към core.urls
- core.urls вижда `/projects/` → извиква ProjectViewSet

---

### 3. core/models/ - Структура на данните

Моделите описват КАКВО се съхранява в базата данни.

#### core/models/project.py - Модел за проекти

```python
from django.db import models
from .client import Client

class Project(models.Model):
    """
    Модел за строителен проект/обект
    """
    
    # Choices за status поле
    STATUS_CHOICES = [
        ('active', 'Активен'),
        ('completed', 'Завършен'),
        ('paused', 'Спрян'),
    ]
    
    # Полета (всяко поле = колона в таблица)
    name = models.CharField(
        max_length=200,                    # Максимум 200 символа
        verbose_name='Име на проект'
    )
    
    location = models.TextField(
        verbose_name='Местонахождение'
    )
    
    client = models.ForeignKey(           # Връзка към друга таблица
        Client,                            # Към модел Client
        on_delete=models.CASCADE,          # Ако се изтрие client, изтрий и проекта
        related_name='projects'            # client.projects - обратна връзка
    )
    
    start_date = models.DateField(
        null=True,                         # Може да е празно
        blank=True,                        # Може да не се попълва във форми
        verbose_name='Начална дата'
    )
    
    end_date = models.DateField(
        null=True, 
        blank=True,
        verbose_name='Крайна дата'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,            # Ограничени стойности
        default='active'                   # По подразбиране = active
    )
    
    progress = models.IntegerField(
        default=0,                         # 0-100 процента
        verbose_name='Напредък %'
    )
    
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    
    # Timestamps (автоматични)
    created_at = models.DateTimeField(auto_now_add=True)  # Задава се при създаване
    updated_at = models.DateTimeField(auto_now=True)      # Обновява се при всяка промяна
    
    class Meta:
        ordering = ['-created_at']         # Подреждане (най-нови първи)
        verbose_name = 'Проект'
        verbose_name_plural = 'Проекти'
    
    def __str__(self):
        """Как се показва обектът като текст"""
        return self.name
```

**Типове полета (field types):**

| Field Type | Описание | Пример |
|-----------|----------|---------|
| `CharField` | Кратък текст | Име, адрес (до 255 символа) |
| `TextField` | Дълъг текст | Описание, забележки |
| `IntegerField` | Цяло число | Progress (0-100) |
| `DateField` | Дата | 2025-11-28 |
| `DateTimeField` | Дата + час | 2025-11-28 15:30:00 |
| `ForeignKey` | Връзка към друг модел | client_id → Client |
| `BooleanField` | True/False | is_active |

**Какво прави Django с този модел:**

1. Създава таблица `core_project` в базата данни
2. Всяко поле става колона в таблицата
3. Автоматично добавя `id` поле (primary key)
4. Създава индекси за по-бързо търсене

**Пример таблица в базата:**

| id | name | location | client_id | start_date | status | progress | created_at |
|----|------|----------|-----------|------------|--------|----------|------------|
| 1 | Жилищна сграда | София | 5 | 2025-01-15 | active | 75 | 2025-01-10 10:30:00 |
| 2 | Офис сграда | Пловдив | 3 | 2025-03-01 | active | 30 | 2025-02-20 14:15:00 |

---

### 4. core/serializers.py - Преобразуване на данни

Serializer-ите преобразуват между **Python objects** и **JSON**.

```python
from rest_framework import serializers
from core.models import Project, Client

class ClientSerializer(serializers.ModelSerializer):
    """Serializer за Client модел"""
    
    class Meta:
        model = Client
        fields = ['id', 'name', 'email', 'phone']  # Кои полета да включи

class ProjectSerializer(serializers.ModelSerializer):
    """Serializer за Project модел"""
    
    # Nested serializer - показва пълна информация за client
    client = ClientSerializer(read_only=True)
    
    # client_id за създаване/обновяване
    client_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'location',
            'client',           # За четене (nested)
            'client_id',        # За писане
            'start_date',
            'end_date',
            'status',
            'progress',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']  # Не могат да се променят
    
    def validate_progress(self, value):
        """Валидация на progress поле"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Progress трябва да е между 0 и 100")
        return value
```

**Какво прави serializer-ът:**

**Python → JSON (Serialization)**:
```python
# Python обект
project = Project.objects.get(id=1)

# Serialize към JSON
serializer = ProjectSerializer(project)
json_data = serializer.data

# Резултат:
{
    "id": 1,
    "name": "Жилищна сграда",
    "location": "гр. София",
    "client": {
        "id": 5,
        "name": "Строй ЕООД",
        "email": "office@stroy.bg"
    },
    "status": "active",
    "progress": 75,
    ...
}
```

**JSON → Python (Deserialization)**:
```python
# JSON данни от frontend
data = {
    "name": "Нов проект",
    "location": "Пловдив",
    "client_id": 5,
    "status": "active"
}

# Deserialize и запази
serializer = ProjectSerializer(data=data)
if serializer.is_valid():
    project = serializer.save()  # Създава нов Project в базата
else:
    print(serializer.errors)     # Показва грешки
```

---

### 5. core/views/ - Обработка на HTTP заявки

Views обработват заявките и връщат отговори.

#### core/views/project.py - API за проекти

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.models import Project
from core.serializers import ProjectSerializer
from core.permissions import IsEmployeeOrAdmin

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet за CRUD операции над проекти
    
    Автоматично създава endpoints:
    - GET    /api/projects/       → list()      (всички проекти)
    - POST   /api/projects/       → create()    (нов проект)
    - GET    /api/projects/5/     → retrieve()  (конкретен проект)
    - PUT    /api/projects/5/     → update()    (обновяване)
    - PATCH  /api/projects/5/     → partial_update()
    - DELETE /api/projects/5/     → destroy()   (изтриване)
    """
    
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsEmployeeOrAdmin]  # Само служители имат достъп
    
    def get_queryset(self):
        """
        Опционално филтриране на резултатите
        """
        queryset = Project.objects.all()
        
        # Филтър по status (?status=active)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Филтър по client (?client=5)
        client_filter = self.request.query_params.get('client')
        if client_filter:
            queryset = queryset.filter(client_id=client_filter)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Създаване на нов проект
        POST /api/projects/
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)  # Валидира данните
        self.perform_create(serializer)            # Записва в базата
        
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """
        Обновяване на проект
        PUT /api/projects/5/
        """
        instance = self.get_object()               # Намира проект с id=5
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Custom endpoint за активни проекти
        GET /api/projects/active/
        """
        active_projects = Project.objects.filter(status='active')
        serializer = self.get_serializer(active_projects, many=True)
        return Response(serializer.data)
```

**Какво се случва при GET /api/projects/?**

```python
# 1. Django получава заявката
# 2. urls.py match-ва към ProjectViewSet
# 3. Извиква list() метод (автоматичен от ModelViewSet)

def list(self, request):
    queryset = self.get_queryset()         # Project.objects.all()
    serializer = self.get_serializer(queryset, many=True)
    return Response(serializer.data)       # Връща JSON

# Резултат:
[
    {
        "id": 1,
        "name": "Жилищна сграда",
        "status": "active",
        ...
    },
    {
        "id": 2,
        "name": "Офис сграда",
        "status": "completed",
        ...
    }
]
```

---

### 6. core/permissions.py - Права за достъп

```python
from rest_framework import permissions

class IsEmployeeOrAdmin(permissions.BasePermission):
    """
    Разрешава достъп само на служители или администратори
    """
    
    def has_permission(self, request, view):
        """
        Проверка дали потребителят има достъп
        """
        # Проверка 1: Потребителят е authenticated?
        if not request.user.is_authenticated:
            return False
        
        # Проверка 2: Има ли Employee запис?
        if not hasattr(request.user, 'employee'):
            return False
        
        # Проверка 3: Е ли admin за DELETE операции?
        if request.method == 'DELETE':
            return request.user.employee.is_admin
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Проверка дали има права за конкретен обект
        """
        # Администраторите могат всичко
        if request.user.employee.is_admin:
            return True
        
        # Останалите само да четат
        return request.method in permissions.SAFE_METHODS  # GET, HEAD, OPTIONS
```

**Как работи permissions:**

```
1. HTTP заявка → Django
   │
2. ViewSet проверява permission_classes
   │
3. Извиква has_permission()
   │
   ├─> True  → Продължава
   └─> False → Връща 403 Forbidden
   │
4. (Опционално) Проверява has_object_permission()
   │
5. Изпълнява view метод
```

---

### 7. core/utils/document_generator.py - Генериране на документи

Това е КЛЮЧОВИЯТ файл за генериране на Word документи!

```python
import os
import re
from datetime import datetime
from docx import Document
from django.conf import settings

def generate_document_from_template(template_name, context):
    """
    Генерира Word документ от шаблон
    
    Args:
        template_name: Име на шаблон (напр. 'act14_bg.docx')
        context: Речник с данни {'project_name': 'X', 'act_date': 'Y', ...}
        
    Returns:
        output_path: Път до генерирания файл
    """
    
    # СТЪПКА 1: Намери шаблона
    template_path = os.path.join(
        settings.MEDIA_ROOT,
        'templates',
        template_name
    )
    
    # Провери дали съществува
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Шаблонът {template_name} не е намерен!")
    
    # СТЪПКА 2: Отвори шаблона
    doc = Document(template_path)
    
    # СТЪПКА 3: Bidirectional mapping
    # Някои полета имат алтернативни имена
    if 'consultant_name' in context:
        context['representative_supervision'] = context['consultant_name']
    if 'designer_name' in context:
        context['representative_designer'] = context['designer_name']
    if 'contractor_name' in context:
        context['representative_builder'] = context['contractor_name']
    
    # СТЪПКА 4: Замяна в параграфи
    for paragraph in doc.paragraphs:
        for key, value in context.items():
            placeholder = f'{{{{{key}}}}}'  # {{key}}
            
            if placeholder in paragraph.text:
                # Замени placeholder с реална стойност
                paragraph.text = paragraph.text.replace(
                    placeholder,
                    str(value)
                )
    
    # СТЪПКА 5: Замяна в таблици
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for key, value in context.items():
                    placeholder = f'{{{{{key}}}}}'
                    
                    if placeholder in cell.text:
                        cell.text = cell.text.replace(
                            placeholder,
                            str(value)
                        )
    
    # СТЪПКА 6: Премахване на незапълнени placeholders
    # Regex pattern за {{anything}}
    placeholder_pattern = r'\{\{[^}]+\}\}'
    
    for paragraph in doc.paragraphs:
        # Премахни всички останали {{placeholder}}
        paragraph.text = re.sub(placeholder_pattern, '', paragraph.text)
    
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                cell.text = re.sub(placeholder_pattern, '', cell.text)
    
    # СТЪПКА 7: Генерирай уникално име за файла
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{template_name.replace('.docx', '')}_{timestamp}.docx"
    
    # СТЪПКА 8: Запази документа
    output_dir = os.path.join(settings.MEDIA_ROOT, 'generated')
    os.makedirs(output_dir, exist_ok=True)  # Създай папка ако не съществува
    
    output_path = os.path.join(output_dir, filename)
    doc.save(output_path)
    
    # СТЪПКА 9: Върни пътя
    return output_path
```

**Визуализация на процеса:**

```
Template (act14_bg.docx):
┌────────────────────────────────┐
│ Акт 14                         │
│ Дата: {{act_date}}             │
│ Проект: {{project_name}}       │
│ Клиент: {{client_name}}        │
└────────────────────────────────┘

Context данни:
{
  "act_date": "28.11.2025",
  "project_name": "Жилищна сграда",
  "client_name": "Строй ЕООД"
}

↓ Замяна ↓

Генериран документ:
┌────────────────────────────────┐
│ Акт 14                         │
│ Дата: 28.11.2025               │
│ Проект: Жилищна сграда         │
│ Клиент: Строй ЕООД             │
└────────────────────────────────┘
```

---

## Как се свързва всичко заедно?

### Пример: Създаване на нов проект

```
┌─────────────────────────────────────────────────────────┐
│ 1. Frontend изпраща POST заявка                         │
│    POST /api/projects/                                  │
│    Body: {"name": "Нов проект", "client_id": 5, ...}   │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ 2. Django получава заявката                             │
│    - CORS middleware проверява origin                   │
│    - Authentication middleware проверява токен          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ 3. urls.py match-ва към ProjectViewSet                 │
│    - Намира path('api/projects/')                      │
│    - Извиква ViewSet.create()                          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ 4. Permissions проверка                                 │
│    - IsEmployeeOrAdmin.has_permission()                │
│    - True → Продължава                                 │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ 5. Serializer валидация                                 │
│    - ProjectSerializer(data=request.data)              │
│    - Проверява всички полета                           │
│    - validate_progress() → 0-100?                      │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ 6. Запазване в базата данни                            │
│    - serializer.save()                                 │
│    - SQL: INSERT INTO core_project ...                │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ 7. Сериализация на отговор                             │
│    - ProjectSerializer(project)                        │
│    - Python object → JSON                              │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│ 8. HTTP Response                                        │
│    - Status: 201 Created                               │
│    - Body: {"id": 10, "name": "Нов проект", ...}      │
└─────────────────────────────────────────────────────────┘
```

---

## Migrations - Промени в базата данни

Migrations са "история" на промените в структурата на базата данни.

### Какво е migration?

Файл който съдържа инструкции как да се промени базата данни.

**Пример: core/migrations/0001_initial.py**

```python
from django.db import migrations, models

class Migration(migrations.Migration):
    
    initial = True  # Първа миграция
    
    dependencies = []  # Не зависи от други миграции
    
    operations = [
        # Създава таблица core_project
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('location', models.TextField()),
                ('status', models.CharField(max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
```

### Команди за migrations:

```bash
# 1. Създава migration файл (след промяна в models.py)
python manage.py makemigrations

# 2. Прилага migrations към базата данни
python manage.py migrate

# 3. Вижда статус на migrations
python manage.py showmigrations

# 4. Вижда SQL код на migration
python manage.py sqlmigrate core 0001
```

**Workflow:**

```
1. Променяш models.py
   (добавяш ново поле progress)
   │
2. python manage.py makemigrations
   → Създава 0006_project_progress.py
   │
3. python manage.py migrate
   → Изпълнява SQL: ALTER TABLE core_project ADD COLUMN progress INTEGER
   │
4. Базата данни е обновена!
```

---

## Django Admin Panel

Django има вграден admin панел за управление на данни.

### Активиране на модел в admin:

**backend/core/admin.py:**
```python
from django.contrib import admin
from .models import Project, Client, Document

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'progress', 'created_at']  # Колони
    list_filter = ['status', 'start_date']                       # Филтри
    search_fields = ['name', 'location']                         # Търсене
    date_hierarchy = 'created_at'                                # Навигация по дати
    
    fieldsets = [
        ('Основна информация', {
            'fields': ['name', 'location', 'client']
        }),
        ('Дати', {
            'fields': ['start_date', 'end_date']
        }),
        ('Статус', {
            'fields': ['status', 'progress']
        }),
    ]
```

### Достъп до Admin панел:

1. Отвори `http://127.0.0.1:8000/admin/`
2. Влез със superuser credentials
3. Виждаш списък с модели
4. Можеш да добавяш, редактираш, изтриваш записи

---

## Следваща стъпка

Вижте **[03_FRONTEND_ДЕТАЙЛНО.md](./03_FRONTEND_ДЕТАЙЛНО.md)** за обяснение на React frontend.
