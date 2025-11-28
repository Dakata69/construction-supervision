# Construction Supervision Project

A full-stack web application for managing construction supervision documents and workflows, built with Django + React.

## Features

- Document Generation: Create and manage construction supervision documents from templates
- PDF Export: Automatic conversion of DOCX documents to PDF format
- Digital Signatures: Support for document signing (stub implementation)
- Project Management: Track construction projects and their documentation
- Role-based Access: Admin and employee permission levels

## Project Structure

```
backend/            # Django backend
  config/          # Django settings & root URLs
  core/            # Main app (models, views, API)
    utils/         # Document generation & PDF helpers
frontend/          # React + TypeScript frontend (Vite)
  src/
    api/          # API client & hooks
    components/   # Reusable React components
    pages/        # Route-level components
    store/        # Redux state management
```

## Quick Start

### Backend (Django)

1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Unix/macOS:
   source .venv/bin/activate
   ```

2. Install dependencies and run migrations:
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   ```

3. Start the development server:
   ```bash
   python manage.py runserver
   ```
   The API will be available at http://127.0.0.1:8000/api/

### Frontend (React + TypeScript)

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:5173

3. For production build:
   ```bash
   npm run build
   ```

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```ini
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MEDIA_ROOT=media/
MEDIA_URL=/media/
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```ini
VITE_API_URL=http://localhost:8000/api
```

## API Documentation

### Authentication

POST `/api/auth/login/`
- Request:
  ```json
  {
    "username": "admin",
    "password": "password"
  }
  ```
- Response:
  ```json
  {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
  ```

### Projects

GET `/api/projects/`
- Lists all projects
- Headers: `Authorization: Bearer <token>`
- Response: Array of projects

POST `/api/projects/`
- Create new project
- Headers: `Authorization: Bearer <token>`
- Request:
  ```json
  {
    "name": "New Construction",
    "description": "Project description",
    "start_date": "2025-11-01",
    "end_date": "2026-11-01"
  }
  ```

### Document Generation

POST `/api/documents/generate/`
- Generates a document from a template
- Request body:
  ```json
  {
    "template_name": "act14_template.docx",
    "context": {
      "project_name": "Project Name",
      "date": "..."
    }
  }
  ```
- Response:
  ```json
  {
    "id": 1,
    "docx": "/media/document.docx",
    "pdf": "/media/document.pdf"
  }
  ```

GET `/api/documents/`
- Lists all documents
- Response: Array of documents with status

## Development

### Adding New Features

#### Backend

1. Create new models in `backend/core/models.py`:
   ```python
   class Project(models.Model):
       name = models.CharField(max_length=200)
       created_at = models.DateTimeField(auto_now_add=True)
   ```

2. Create serializers in `backend/core/serializers.py`:
   ```python
   class ProjectSerializer(serializers.ModelSerializer):
       class Meta:
           model = Project
           fields = ['id', 'name', 'created_at']
   ```

3. Add views in `backend/core/views.py`:
   ```python
   class ProjectViewSet(viewsets.ModelViewSet):
       queryset = Project.objects.all()
       serializer_class = ProjectSerializer
       permission_classes = [IsAuthenticated]
   ```

4. Register URLs in `backend/core/urls.py`:
   ```python
   router.register(r'projects', ProjectViewSet)
   ```

#### Frontend

1. Add API client methods in `frontend/src/api/client.ts`:
   ```typescript
   export const projectsApi = {
     list: () => api.get('/projects/'),
     create: (data: ProjectData) => api.post('/projects/', data)
   };
   ```

2. Create Redux slice in `frontend/src/store/projectsSlice.ts`:
   ```typescript
   export const projectsSlice = createSlice({
     name: 'projects',
     initialState,
     reducers: {
       setProjects: (state, action) => {
         state.items = action.payload;
       }
     }
   });
   ```

3. Add new page in `frontend/src/pages/`:
   ```typescript
   export const ProjectList = () => {
     const projects = useSelector(selectProjects);
     return (
       <div>
         {projects.map(project => (
           <ProjectCard key={project.id} project={project} />
         ))}
       </div>
     );
   };
   ```

4. Add route in `App.tsx`:
   ```typescript
   <Route path="/projects" element={<ProjectList />} />
   ```

### Testing

#### Backend Tests

```bash
# Run all tests
python manage.py test

# Run specific test file
python manage.py test core.tests.test_documents

# Run with coverage
coverage run manage.py test
coverage report
```

#### Frontend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Common Development Tasks

1. Database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

3. Build frontend for production:
   ```bash
   npm run build
   # Files will be in dist/ directory
   ```

4. Update dependencies:
   ```bash
   # Backend
   pip freeze > requirements.txt
   
   # Frontend
   npm update
   ```

### Troubleshooting

1. CORS issues:
   - Check `CORS_ALLOWED_ORIGINS` in Django settings
   - Verify frontend is using correct API URL
   - Check browser console for specific CORS errors

2. Database errors:
   - Run `python manage.py migrate` to apply pending migrations
   - Check database connection settings
   - Verify model changes are reflected in migrations

3. Frontend build issues:
   - Clear node_modules: `rm -rf node_modules`
   - Reinstall dependencies: `npm install`
   - Check TypeScript errors: `npm run type-check`