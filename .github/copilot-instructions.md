## Repo snapshot — quick orientation

- Monorepo with two main folders: `backend/` (Django-style project: `manage.py`, `config/`, `core/`) and `frontend/` (Vite + React + TypeScript app).
- Frontend uses React Router (`frontend/src/App.tsx`) and Redux Toolkit (`frontend/src/store/*`).
- Frontend communicates with backend via Axios client at `frontend/src/api/client.ts` (baseURL: `http://localhost:8000/api/`, withCredentials: true).

## Primary integration points an agent should know

- API client: `frontend/src/api/client.ts`
  - Default base URL: `http://localhost:8000/api/`.
  - Use `setAuthHeader(token)` to add `Authorization: Bearer <token>` header.
  - Requests include cookies (`withCredentials: true`).

- Document generation flow (concrete example):
  - Frontend call: `POST api/documents/generate/` with JSON like:
    ```json
    { "template_name": "act14_template.docx", "context": { "project_name": "Проект X", "date": "..." } }
    ```
  - Example usage: `frontend/src/pages/Documents.tsx` — response expected to include `docx` and `pdf` paths.
  - Server-side helpers live under `backend/core/utils/` (`document_generator.py`, `pdf_export.py`, `sign_stub.py`).

## Backend layout & conventions

- Django-style layout: `backend/manage.py`, `backend/config/` (project settings/urls), `backend/core/` (app-level models/serializers/views/permissions).
- Look for API wiring in `backend/config/urls.py` and `backend/core/urls.py` when adding endpoints.
- Serializers and viewsets live in `backend/core/serializers.py` and `backend/core/views.py` — follow existing serializer patterns when adding new resources.

## Frontend conventions

- Routes are declared in `frontend/src/App.tsx`. Add new pages under `frontend/src/pages/` and register routes in `App.tsx`.
- Global API usage: import `api` from `frontend/src/api/client.ts`. Prefer `async/await` and handle errors around `api.*` calls.
- State: use Redux Toolkit slices in `frontend/src/store/` (examples: `authSlice.ts`, `uiSlice.ts`). Use `configureStore` defined in `store.ts`.

## Developer workflows (what I verified)

- Frontend dev: in `frontend/` use `npm install` then `npm run dev` (Vite). Scripts are in `frontend/package.json` (`dev`, `build`, `preview`).
- Backend: repository contains a Django-like layout. Check `backend/requirements.txt` and `backend/manage.py` for exact commands. Typical flow: create virtualenv, `pip install -r backend/requirements.txt`, then `python backend/manage.py runserver`.

## Useful quick patterns for code-gen or edits

- When modifying API endpoints: update `backend/core/serializers.py` → `backend/core/views.py` → add route in `backend/core/urls.py` → include in `backend/config/urls.py`.
- When adding a new document template: place the template file where `document_generator.py` expects it and update any mapping in that module; frontend will call `documents/generate/` with the `template_name` string.

## Files to inspect first for context

- `frontend/src/api/client.ts` — API client & auth header behavior
- `frontend/src/pages/Documents.tsx` — example of document generation flow
- `frontend/src/App.tsx` — routing and top-level layout
- `backend/core/utils/document_generator.py`, `pdf_export.py` — server-side doc flow
- `backend/core/serializers.py`, `backend/core/views.py`, `backend/core/urls.py` — API pattern examples

## What I did NOT assume

- Do not assume specific DB, migrations, or secret management — inspect `backend/config/settings.py` and `backend/requirements.txt` before running.

## If you want me to expand

- I can: merge any existing `.github/copilot-instructions.md` or README content, extract more concrete examples from backend code, or add quick-run scripts for local setup once `requirements.txt` / `settings.py` are populated.

Please review and tell me if you'd like more detail in any section (for example, concrete API endpoint list, auth flow, or template locations).
