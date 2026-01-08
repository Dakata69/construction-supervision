# Email Configuration Guide

## Current Setup

The application has been updated to support both development and production email sending with a consolidated single-email approach for user credentials.

### Development Mode (Default)

In development, emails are **printed to the console** instead of being sent via SMTP. This is configured by default to avoid dependencies on email servers during development.

**To see emails in development:**
1. Create a new user in the User Management interface
2. Check the console/terminal where `python backend/manage.py runserver` is running
3. You'll see the full email content printed to stdout, including:
   - Recipient email address
   - Subject line
   - Email body (both plain text and HTML)

Example console output:
```
Content-Type: text/plain; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Subject: Construction Supervision - Вашия профил е създаден
From: noreply@construction-supervision.bg
To: user@example.com
Date: Mon, 25 Nov 2024 10:30:00 -0000

Добър ден John,

От фирма Construction Supervision е създаден вашия профил...
```

### Production Mode

To use real SMTP email sending in production, configure these environment variables in your `.env` file:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@construction-supervision.bg
FRONTEND_URL=https://your-domain.com
```

**For Gmail SMTP:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the 16-character app password in `EMAIL_HOST_PASSWORD`
4. Keep your actual Google password private

## Email Types

### 1. User Credentials Email (Send on User Creation)

**When:** Admin or Privileged user creates a new user
**What:** Single consolidated email containing:
- Personalized greeting in Bulgarian
- Username
- Temporary password
- Instructions to set new password on first login
- Link to the application

**Recipients:** New user's email address

**File:** `backend/core/utils/email_sender.py` - `send_credentials_email()` function

### 2. Password Reset Email

**When:** User requests password reset or admin initiates password reset
**What:** Email containing:
- Password reset link (valid for 24 hours)
- Instructions to click the link to set new password
- Expiration notice
- Message not to respond if not requested

**Recipients:** User's email address

**File:** `backend/core/utils/email_sender.py` - `send_password_reset_email()` function

## Troubleshooting

### "I didn't receive the email"

**Check 1: Are you in development mode?**
- If using console backend (default), emails print to console, not inbox
- Check the terminal/console where Django is running

**Check 2: Is EMAIL_BACKEND configured?**
```python
# In backend/config/settings.py
print(os.environ.get('EMAIL_BACKEND'))
```
Should show either:
- `django.core.mail.backends.console.EmailBackend` (development)
- `django.core.mail.backends.smtp.EmailBackend` (production)

**Check 3: SMTP credentials**
If using SMTP, verify in `.env`:
- EMAIL_HOST is correct (e.g., smtp.gmail.com)
- EMAIL_HOST_USER is your full email
- EMAIL_HOST_PASSWORD is correct (for Gmail, use app password, not your account password)
- EMAIL_PORT is 587 or 465 (depending on server)
- EMAIL_USE_TLS is True (if using port 587)

**Check 4: Spam folder**
If using real SMTP, check spam/junk folder in your email account

**Check 5: Email sending logs**
To debug email issues, add to Django settings:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.core.mail': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Role-Based Permissions

**Updated to 2 roles only:**

1. **Admin** - Full system access
   - Can create users
   - Can reset passwords
   - Can see all projects
   - Can edit all projects

2. **Privileged** - Limited access
   - Can see some projects (to be defined)
   - Cannot edit projects
   - Receives same credentials email as admin

## API Endpoints

### Create User (Admin/Privileged only)
```
POST /api/auth/create-user/
{
  "username": "john.doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "admin" | "privileged"
}
```

Triggers: `send_credentials_email(user, temporary_password)`

### Request Password Reset (Public)
```
POST /api/auth/request-password-reset/
{
  "email": "user@example.com"
}
```

Triggers: `send_password_reset_email(user, reset_token)`

### Reset Password (Public)
```
POST /api/auth/reset-password/
{
  "token": "...",
  "new_password": "..."
}
```

### Resend Credentials (Admin/Privileged only)
```
POST /api/user-management/{user_id}/resend_credentials/
```

### Reset User Password (Admin/Privileged only)
```
POST /api/user-management/{user_id}/reset_user_password/
```

## Frontend Integration

- **User Management Page:** `/user-management`
  - Create new users
  - Resend credentials
  - Reset user passwords
  - View all users

- **Password Reset Page:** `/password-reset/:token`
  - Public, token-protected page
  - Users can set new password
  - Validates token before showing form
  - Redirects to login on success
