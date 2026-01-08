# Push Notifications Setup Guide

Push notifications allow the application to send browser notifications to users even when they're not actively using the app. This guide explains how to set up and troubleshoot push notifications.

## How Push Notifications Work

1. **User enables push notifications** in the application header
2. **Browser requests permission** from the user
3. **Service Worker registers** and subscribes to push messages
4. **Subscription details** are sent to the backend
5. **Backend stores** the subscription for later use
6. **When an event occurs**, the backend sends a push message
7. **Browser receives** the message and displays a notification

## Prerequisites: Generating VAPID Keys

VAPID keys are cryptographic key pairs that identify your application to the push service. You need to generate them once.

### Generate VAPID Keys

Run the provided script:

```bash
python generate_vapid.py
```

This outputs:
- **Frontend .env** key: `VITE_VAPID_PUBLIC_KEY` (public key, safe to share)
- **Backend .env** key: `VAPID_PRIVATE_KEY` (private key, keep secret)

### Configure Frontend (.env)

Create or update `frontend/.env`:

```
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_FROM_SCRIPT
VITE_API_URL=http://localhost:8000/api/
```

### Configure Backend (.env)

Create or update `backend/.env`:

```
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY_FROM_SCRIPT
VAPID_EMAIL=mailto:your-admin@example.com
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Running Locally

### 1. Start the development servers

```bash
# Terminal 1: Backend
cd backend
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Test Push Notifications

1. Open http://localhost:5173 in your browser
2. Log in with your credentials
3. Look for the **notification icon** in the header (top right)
4. Click the icon to toggle push notifications
5. When prompted, click **"Allow"** to grant notification permission
6. You should see success message: "Push известията са включени"

## Troubleshooting

### Error Messages and Solutions

#### "Браузърът не поддържа push известия" (Browser doesn't support push notifications)
- **Cause**: Using an old browser or Safari (limited support)
- **Solution**: Use Chrome, Firefox, Edge, or Opera (v43+)

#### "Разрешението за известия е отказано" (Notification permission denied)
- **Cause**: You previously rejected notification permission
- **Solution**: 
  1. Click the lock icon in the browser address bar
  2. Find "Notifications" setting
  3. Change from "Denied" to "Allow"
  4. Refresh page and try again

#### "VAPID ключът не е конфигуриран" (VAPID key not configured)
- **Cause**: `VITE_VAPID_PUBLIC_KEY` not set in frontend `.env`
- **Solution**:
  1. Run `python generate_vapid.py`
  2. Copy the public key to `frontend/.env`
  3. Restart frontend dev server (`npm run dev`)

#### "Не е намерена валидна сесия" (No valid session)
- **Cause**: Auth token missing or expired
- **Solution**: 
  1. Log out and log back in
  2. Check browser DevTools → Storage → Local Storage for `auth_token`

#### "Грешка от сървъра (401)" (Server error 401)
- **Cause**: Backend doesn't recognize auth token
- **Solution**:
  1. Verify backend is running on port 8000
  2. Check `VAPID_PRIVATE_KEY` is set in `backend/.env`
  3. Verify backend has the correct auth token

#### "Грешка от сървъра (500)" (Server error 500)
- **Cause**: Backend error processing subscription
- **Solution**:
  1. Check backend console for error details
  2. Verify `core/models/push.py` migration was run: `python manage.py migrate`
  3. Check MySQL connection is working

## Debugging in Browser Console

Open **Developer Tools** (F12) and go to **Console** tab:

```javascript
// Check if push is supported
'serviceWorker' in navigator && 'PushManager' in window
// Should return: true

// Check current notification permission
Notification.permission
// Should return: "granted" (after enabling)

// Check if service worker is registered
navigator.serviceWorker.getRegistration().then(reg => console.log(reg))

// Check if push subscription exists
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) return reg.pushManager.getSubscription();
}).then(sub => console.log(sub))
```

## API Endpoints

### Subscribe to Push Notifications
```
POST /api/push/subscribe/
Authorization: Bearer <auth_token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}

Response: 201 Created
{
  "id": 1,
  "user": 1,
  "endpoint": "https://fcm.googleapis.com/...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Unsubscribe from Push Notifications
```
POST /api/push/unsubscribe/
Authorization: Bearer <auth_token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/..."
}

Response: 200 OK
{
  "ok": true
}
```

## Testing Push Notifications

### Method 1: Manual Test via Console

```javascript
// In browser console:
await fetch('http://localhost:8000/api/push/send-test/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
    'Content-Type': 'application/json'
  }
})
```

### Method 2: Using Django Management Command

```bash
python manage.py send_push_notification --user=1 --title="Test" --message="Hello"
```

## Deployment Considerations

### On Vercel + Railway

1. **Generate fresh VAPID keys** for production:
   ```bash
   python generate_vapid.py
   ```

2. **Add to Railway backend environment variables**:
   - `VAPID_PRIVATE_KEY`: Paste your private key
   - `VAPID_EMAIL`: Your admin email

3. **Add to Vercel frontend environment variables**:
   - `VITE_VAPID_PUBLIC_KEY`: Paste your public key

4. **Ensure service worker is served correctly**:
   - Railway backend should serve `/service-worker.js` from `frontend/public/`
   - Or configure static file handling in `config/settings.py`

5. **HTTPS is required**: 
   - Push notifications only work over HTTPS
   - Both Vercel and Railway provide HTTPS by default
   - Set `HTTPS: true` in production backend `.env`

## Architecture

### Files Involved

- **Frontend Push Logic**: `frontend/src/utils/push.ts`
  - `registerPush()`: Subscribe user to push notifications
  - `unregisterPush()`: Unsubscribe user
  - Browser API calls and backend communication

- **Frontend Service Worker**: `frontend/public/service-worker.js`
  - Handles incoming push messages
  - Displays notifications to user

- **Frontend Header Component**: `frontend/src/components/Header.tsx`
  - Push toggle button with visual feedback
  - Calls `registerPush()` and `unregisterPush()`

- **Backend Push Views**: `backend/core/views/push.py`
  - `PushSubscribeView`: Stores user subscription
  - `PushUnsubscribeView`: Removes user subscription

- **Backend Push Models**: `backend/core/models/push.py`
  - `PushSubscription`: Stores endpoint and encryption keys

- **Backend Push Utilities**: `backend/core/utils/push.py`
  - `send_push_to_user()`: Sends push message to specific user
  - `send_push_to_group()`: Sends push message to group of users

## Common Issues

### Service Worker Not Registering

**Symptom**: Console shows "Service workers not supported"

**Causes**:
- HTTP used instead of HTTPS (except localhost)
- Service worker file not found at `/service-worker.js`
- Browser caching old version

**Fix**:
1. Check DevTools → Application → Service Workers
2. Hard refresh (Ctrl+Shift+R)
3. Verify `frontend/public/service-worker.js` exists
4. Check browser console for 404 errors

### Notification Permission Already Denied

**Symptom**: Permission dialog doesn't appear, always fails

**Causes**:
- User previously clicked "Block" on permission prompt
- Browser settings block notifications

**Fix**:
1. Open Settings → Privacy & Security → Notifications
2. Find your domain and change from "Block" to "Allow"
3. Refresh and try again

### Subscriptions Not Stored in Database

**Symptom**: Frontend shows success but no data in `PushSubscription` table

**Causes**:
- Database migrations not run
- Auth token invalid or expired
- Backend VAPID key mismatch

**Fix**:
```bash
# Run migrations
python manage.py migrate

# Check database
python manage.py shell
from core.models import PushSubscription
print(PushSubscription.objects.all())
```

## Next Steps

- Implement push message sending when events occur (act creation, task assignment, etc.)
- Add user preferences for which notifications to receive
- Build notification history / inbox UI
- Add sound/vibration preferences

## Support

If you encounter issues not covered here:
1. Check browser console (F12) for detailed error messages
2. Check backend console for server errors
3. Verify all environment variables are set correctly
4. Clear browser cache and service worker cache
5. Try in an incognito/private window
