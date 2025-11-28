# Construction Supervision API Documentation

## Authentication

### Login
- **URL**: `/api/auth/login/`
- **Method**: `POST`
- **Data**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "access": "string",
    "refresh": "string"
  }
  ```

## Documents

### Generate Document
- **URL**: `/api/documents/generate/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Data**:
  ```json
  {
    "template_name": "string",
    "context": {
      "project_name": "string",
      "date": "string",
      ...
    }
  }
  ```
- **Response**:
  ```json
  {
    "docx": "string",
    "pdf": "string"
  }
  ```

### List Documents
- **URL**: `/api/documents/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  [
    {
      "id": "integer",
      "title": "string",
      "doc_type": "string",
      "approved": "boolean",
      "created_at": "datetime"
    }
  ]
  ```

## Projects

### List Projects
- **URL**: `/api/projects/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  [
    {
      "id": "integer",
      "name": "string",
      "status": "string",
      "client": "string",
      "start_date": "date",
      "end_date": "date"
    }
  ]
  ```

### Project Details
- **URL**: `/api/projects/{id}/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "id": "integer",
    "name": "string",
    "status": "string",
    "client": "string",
    "start_date": "date",
    "end_date": "date",
    "documents": [
      {
        "id": "integer",
        "title": "string",
        "doc_type": "string"
      }
    ]
  }
  ```

## Document Templates

### Act 14
Template for construction structure acceptance document. Required fields:
- project_name
- date
- location
- client_name
- permit_number
- permit_date
- designer_name
- contractor_name
- supervisor_name
- inspection_findings
- documentation
- conclusion
- notes

### Act 15
Template for construction completion acceptance document. Required fields:
- project_name
- date
- location
- client_name
- permit_number
- permit_date
- contractor_name
- tech_supervisor_name
- supervisor_name
- start_date
- end_date
- execution_details
- documentation
- deviations
- conclusion
- notes