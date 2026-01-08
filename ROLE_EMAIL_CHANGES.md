# Role System & Email Consolidation - Summary of Changes

## Changes Made (Session: Role Refinement Phase)

### 1. Role System Simplified (2 roles instead of 3)

**File:** `backend/core/models/user_profile.py`
- Removed 'client' role
- Kept only: 'privileged' and 'admin'
- Removed `accessible_projects` ManyToMany field (no longer needed)
- Simplified `can_edit()` method: admin role → can_edit=True

**Migration:** `0024_remove_userprofile_accessible_projects_and_more`
- Removed accessible_projects field
- Updated role field choices

### 2. Email System Consolidated

**File:** `backend/core/utils/email_sender.py`

**Old Approach (2 emails):**
- `send_credential_email()` - sends username
- `send_password_reset_email()` - sends reset link separately

**New Approach (1 consolidated email):**
- `send_credentials_email()` - single email with:
  - Personalized Bulgarian greeting
  - Username
  - Temporary password
  - Instructions to set new password
  - Login link
  - Professional HTML format with logo/branding

- `send_password_reset_email()` - unchanged, separate email for password reset requests

**Email Content:**
- Subject line in Bulgarian: "Construction Supervision - Вашия профил е създаден"
- Greeting: "Добър ден [First Name],"
- Message: "От фирма Construction Supervision е създаден вашия профил..."
- Formatted with HTML styling, color scheme (gradient blue/purple), responsive design

### 3. Backend Serializer Updated

**File:** `backend/core/serializers.py`
- Updated `CreateUserSerializer` role choices: removed 'viewer', kept only 'privileged' and 'admin'

### 4. Backend Views Updated

**File:** `backend/core/views/users.py`
- Updated `create_user_view()` to use `send_credentials_email()` (single email)
- Removed the second `send_password_reset_email()` call
- Updated imports and docstring

### 5. Frontend Role Selector Updated

**File:** `frontend/src/pages/UserManagement.tsx`
- Updated role Select options to show only:
  - "Privileged (Can Edit)"
  - "Admin"
- Changed default role from "viewer" to "privileged"
- Removed "Viewer (Read Only)" option

### 6. Email Configuration Documentation

**File:** `backend/config/settings.py`
- Added comprehensive inline comments explaining EMAIL_BACKEND configuration
- Documents console backend (dev) vs SMTP backend (production)
- Includes .env configuration example for production

**File:** `EMAIL_CONFIGURATION.md` (NEW)
- Complete email configuration guide
- Development mode explanation (console output)
- Production setup instructions (Gmail SMTP example)
- Troubleshooting section
- API endpoint reference
- Email type descriptions

## Key Improvements

1. **Simplified Role System**
   - Reduced confusion with 2 clear roles instead of 3
   - Better alignment with business requirements
   - Easier permission management

2. **Better User Experience**
   - Single email with all credential information
   - Professional Bulgarian branding
   - Reduced email clutter (no separate reset email on user creation)

3. **Email Backend Clarity**
   - Console backend default in development (no SMTP required)
   - Emails visible in terminal for testing
   - Clear path to production SMTP setup
   - Comprehensive documentation included

4. **Cleaner Database**
   - Removed unused `accessible_projects` field
   - Simplified UserProfile model

## Testing Instructions

### Development Mode (Console Emails)
1. Start the application
2. Go to `/user-management` in frontend
3. Create a new user
4. Check the **terminal where Django is running** - email will be printed there
5. Verify email contains:
   - Username
   - Temporary password
   - Login link

### Production Mode (SMTP Emails)
1. Configure `.env` with SMTP credentials
2. Restart Django
3. Create a new user
4. Check email inbox for credentials email

### Password Reset Flow
1. Go to `/login`
2. Click "Forgot Password"
3. Enter email address
4. Check email for password reset link
5. Click link and set new password

## Database Migrations Applied

- ✅ 0024_remove_userprofile_accessible_projects_and_more
  - Removes accessible_projects field
  - Updates role field to 2-choice field

## Verification

- ✅ Backend: `python manage.py check` - No issues
- ✅ Frontend: `npm run build` - Success (3542 modules, 1.7MB)
- ✅ No syntax or compilation errors
- ✅ All migrations applied successfully
- ✅ All imports updated

## Files Modified Summary

```
Backend:
- backend/core/models/user_profile.py (removed client role, accessible_projects)
- backend/core/serializers.py (updated role choices)
- backend/core/views/users.py (use single email function)
- backend/core/utils/email_sender.py (consolidated to 1 email + password reset)
- backend/config/settings.py (added comprehensive email comments)

Frontend:
- frontend/src/pages/UserManagement.tsx (removed viewer role option)

Documentation:
- EMAIL_CONFIGURATION.md (new, comprehensive guide)

Migrations:
- 0024_remove_userprofile_accessible_projects_and_more (new)
```

## Next Steps (Optional)

1. Test email sending:
   - In development: Create user and check console
   - In production: Set up real SMTP and test

2. Define "Privileged" user permissions:
   - What pages can they see?
   - What projects can they access?
   - (Currently can see system, cannot edit projects)

3. Add role-based UI filtering:
   - Hide edit buttons for privileged users
   - Show view-only interfaces

4. Update API permission checks to enforce privilege levels
