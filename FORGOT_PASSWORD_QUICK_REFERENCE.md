# Forgot Password Feature - Quick Reference

## What Was Added

### Frontend: Login.tsx
```typescript
// State management
const [forgotPasswordForm] = Form.useForm();
const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

// Handler function
const handleForgotPassword = async (values: any) => {
  setForgotPasswordLoading(true);
  try {
    await api.post('/auth/request-password-reset/', { email: values.email });
    message.success('Линкът за възстановяване на парола е изпратен по имейл');
    setForgotPasswordVisible(false);
    forgotPasswordForm.resetFields();
  } catch (error: any) {
    message.error(error.response?.data?.message || 'Грешка при изпращане.');
  } finally {
    setForgotPasswordLoading(false);
  }
};
```

### Frontend: UI Components
1. **Button Link**: Below login form
   - Text: "Забравена парола?"
   - Style: Link button with #667eea color
   - Action: Opens forgot password modal

2. **Modal**: "Възстановяване на парола"
   - Email input field (required, validated)
   - Submit button: "Изпрати"
   - Cancel button: "Отказ"
   - Helper text: "Линкът за възстановяване на парола ще бъде изпратен по указания имейл адрес."

## Backend: Already Implemented
- ✅ Endpoint: `POST /api/auth/request-password-reset/`
- ✅ Email sending: `send_password_reset_email()`
- ✅ Token creation: `PasswordResetToken.create_token()`
- ✅ Routes in App.tsx: `/password-reset/:token`

## User Experience Flow

```
User on Login Page
    ↓
Clicks "Забравена парола?" button
    ↓
Modal appears asking for email
    ↓
User enters email and clicks "Изпрати"
    ↓
Success message: "Линкът за възстановяване на парола е изпратен по имейл"
    ↓
User receives email with reset link
    ↓
User clicks link → Goes to /password-reset/{token}
    ↓
PasswordReset.tsx page loads
    ↓
User enters new password and confirms
    ↓
Success → Redirects to Login page
    ↓
User logs in with new password
```

## API Communication

### Request
```http
POST /api/auth/request-password-reset/
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Response (Success - 200)
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Response (Error - 400)
```json
{
  "message": "error details"
}
```

## Key Features
✅ Bulgarian language UI
✅ Email validation
✅ Loading state during API call
✅ Success/error message feedback
✅ Modal close on success
✅ Form reset after submission
✅ Responsive design (works on mobile/tablet)
✅ Secure token-based reset (expires after 24 hours)
✅ Prevents user enumeration (doesn't reveal if email exists)

## Testing Checklist
- [ ] Login page displays "Забравена парола?" link
- [ ] Clicking link opens modal
- [ ] Modal shows email field
- [ ] Invalid email shows validation error
- [ ] Submitting empty email shows error
- [ ] Valid email submission shows success message
- [ ] Modal closes after success
- [ ] Email is received with reset link
- [ ] Clicking email link opens /password-reset/:token
- [ ] PasswordReset page validates and accepts new password
- [ ] Login works with new password

## Deployment Notes
- No database migrations needed (PasswordResetToken model already exists)
- No new environment variables needed (SMTP already configured)
- Frontend changes only affect Login.tsx
- Backend changes: None (all components pre-existing)
