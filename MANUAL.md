# Construction Supervision System - User Manual

## Getting Started

1. **Login**
   - Navigate to the login page
   - Enter your username and password
   - Click "Login"

2. **Dashboard**
   - View active projects
   - Check recent documents
   - Monitor supervision tasks

## Project Management

1. **View Projects**
   - Click "Projects" in the sidebar
   - See list of all projects
   - Use filters to find specific projects

2. **Project Details**
   - Click on a project to view details
   - See project timeline
   - View associated documents
   - Monitor tasks and progress

## Document Generation

1. **Create Act 14 (Construction Structure Acceptance)**
   - Go to "Documents" page
   - Fill in required fields:
     - Project name
     - Location
     - Client name
     - Permit details
     - Inspection findings
     - Documentation
     - Conclusions
   - Click "Generate Act 14"
   - Download or view the generated document

2. **Create Act 15 (Construction Completion)**
   - Go to "Documents" page
   - Fill in required fields:
     - Project details
     - Construction period
     - Execution details
     - Documentation
     - Deviations
     - Conclusions
   - Click "Generate Act 15"
   - Download or view the generated document

## Document Management

1. **View Documents**
   - Navigate to "Documents" page
   - See list of all generated documents
   - Filter by type, date, or status

2. **Document Approval**
   - Open a document
   - Review content
   - Add digital signature if required
   - Mark as approved

## User Roles

1. **Administrator**
   - Manage users and permissions
   - Create/edit projects
   - Approve documents
   - Access all system features

2. **Supervisor**
   - View assigned projects
   - Generate documents
   - Add inspections and notes
   - Sign documents

3. **Client**
   - View project progress
   - Access approved documents
   - View inspection results

## Tips and Best Practices

1. **Document Generation**
   - Always review data before generating
   - Use Bulgarian characters when required
   - Keep descriptions clear and professional
   - Save drafts before final generation

2. **Project Management**
   - Update project status regularly
   - Attach relevant documentation
   - Monitor deadlines and milestones

3. **System Usage**
   - Use secure passwords
   - Log out after each session
   - Back up important documents
   - Report issues to administrators

## Troubleshooting

1. **Common Issues**
   - Document generation fails
     - Check all required fields
     - Verify file permissions
   - Login problems
     - Clear browser cache
     - Reset password if needed
   - Missing data
     - Refresh page
     - Check internet connection

2. **Support**
   - Contact system administrator
   - Report bugs through support portal
   - Request feature enhancements

## Security

1. **Best Practices**
   - Change password regularly
   - Don't share login credentials
   - Lock computer when away
   - Use secure network connections

2. **Data Protection**
   - All documents are encrypted
   - Regular backups performed
   - Access logs maintained

## Updates and Maintenance

1. **System Updates**
   - Regular updates scheduled
   - New features announced
   - Training provided for changes

2. **Maintenance Windows**
   - Scheduled maintenance times
   - Backup procedures
   - Emergency contacts

## PDF Templates & Overlay

- PDF Templates for Act 14 and Act 15 are used to generate final documents. Dynamic fields are placed via an overlay.
- To help position fields, use the "Show grid overlay (PDF)" toggle on the Documents page. This draws a coordinate grid on top of the PDF.
- Coordinates are in PDF points from the bottom-left corner. Start with grid step 25 for easy measuring.

### Cyrillic Fonts

- For best Cyrillic support in generated PDFs, place a Unicode font TTF at `backend/media/fonts/DejaVuSans.ttf` (recommended) and restart the backend.
- On Windows, if DejaVu is not provided, the system may fall back to `Arial Unicode MS` when available.

### Mapping Files

- Field mappings live under `backend/media/templates/*_fields.json` and control placement on each page.
- You can temporarily enable the grid via the UI toggle without editing the mapping files.
- Enable "Debug: print field names" to render the field names at their coordinates instead of values, making it easy to align positions before switching back to real data.