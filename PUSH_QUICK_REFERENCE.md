# Push Notifications Quick Reference

## Quick Start (5 minutes)

### 1. Generate VAPID Keys (First Time Only)
```bash
python generate_vapid.py
# Follow the prompts to auto-update .env files
```

### 2. Verify Configuration
```bash
python check_vapid.py
# Should show all checks passing
```

### 3. Start Servers
```bash
# Terminal 1: Backend
cd backend
python manage.py migrate  # First time only
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm install  # First time only
npm run dev
```

### 4. Test in Browser
1. Open http://localhost:5173
2. Log in
3. Click notification icon (🔔) in header
4. Click "Allow" when permission dialog appears
5. Should see: "Push известията са включени"

## Troubleshooting (When Things Don't Work)

### Full Diagnostics
```bash
python troubleshoot_push.py
```

This checks:
- ✓ Python dependencies
- ✓ Environment files
- ✓ Backend setup
- ✓ Frontend setup
- ✓ VAPID key formats

### Check Configuration
```bash
python check_vapid.py
```

This verifies:
- ✓ Frontend .env has VITE_VAPID_PUBLIC_KEY
- ✓ Backend .env has VAPID_PRIVATE_KEY
- ✓ Service worker file exists
- ✓ Push models/views exist

## Debugging in Browser

### Open Developer Tools
Press **F12** → Go to **Console** tab

### When you click notification toggle, you should see:
```
Registering service worker...
Service worker registered
VAPID key found
Requesting notification permission...
Notification permission: granted
Creating push subscription...
Push subscription created: PushSubscription {...}
Sending subscription to backend...
Backend response status: 201
Push notification registration successful
```

### Common Console Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Push notifications not supported` | Old browser or Safari | Use Chrome/Firefox/Edge |
| `VAPID key not configured` | Missing VITE_VAPID_PUBLIC_KEY | Run `generate_vapid.py` |
| `permission denied` | Previously rejected | Check browser notification settings |
| `no auth token` | Session expired | Log out and log back in |
| `Backend response 401` | Invalid token | Check backend is running |
| `Backend response 500` | Server error | Check backend console for error |

## Common Issues & Solutions

### Issue: "Браузърът не поддържа push известия"
**Solution**: Use Chrome, Firefox, Edge, or Opera (Safari not fully supported)

### Issue: "Разрешението за известия е отказано"
**Solution**: 
1. Click lock icon in browser address bar
2. Change Notifications from "Deny" to "Allow"
3. Refresh page

### Issue: "VAPID ключът не е конфигуриран"
**Solution**:
1. Run: `python generate_vapid.py`
2. Restart frontend: `npm run dev`

### Issue: Everything fails silently
**Solution**:
1. Open DevTools (F12)
2. Check Console for error messages
3. Look for where the process stops
4. Report specific error from console

## File Locations

| Purpose | File | Command |
|---------|------|---------|
| Generate VAPID keys | `generate_vapid.py` | `python generate_vapid.py` |
| Check config | `check_vapid.py` | `python check_vapid.py` |
| Full diagnostics | `troubleshoot_push.py` | `python troubleshoot_push.py` |
| Documentation | `PUSH_NOTIFICATIONS.md` | `# Read file` |
| Improvements summary | `PUSH_NOTIFICATIONS_IMPROVEMENTS.md` | `# Read file` |

## Environment Variables

### Frontend (.env)
```
VITE_VAPID_PUBLIC_KEY=<your_public_key>
VITE_API_URL=http://localhost:8000/api/
```

### Backend (.env)
```
VAPID_PRIVATE_KEY=<your_private_key>
VAPID_EMAIL=mailto:admin@example.com
DJANGO_SECRET_KEY=<your_secret>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Key Files

### Frontend
- `frontend/src/utils/push.ts` - Push registration logic
- `frontend/public/service-worker.js` - Notification handling
- `frontend/src/components/Header.tsx` - Toggle UI

### Backend
- `backend/core/views/push.py` - API endpoints
- `backend/core/models/push.py` - Database model
- `backend/core/serializers.py` - Data validation

## Step-by-Step Setup

### For New Developers

1. Clone the repo
2. Run `python generate_vapid.py` - choose auto-update
3. Run `python check_vapid.py` - verify setup
4. `cd backend && python manage.py migrate`
5. `python manage.py runserver`
6. `cd frontend && npm install && npm run dev`
7. Open http://localhost:5173
8. Test notification toggle

### For Production Deployment

1. Generate new VAPID keys: `python generate_vapid.py`
2. Add to Railway backend env vars:
   - `VAPID_PRIVATE_KEY`
   - `VAPID_EMAIL`
3. Add to Vercel frontend env vars:
   - `VITE_VAPID_PUBLIC_KEY`
4. Ensure HTTPS is enabled (both platforms default to HTTPS)
5. Run backend migrations on deployment

## Testing Commands

### Browser Console (F12 → Console)
```javascript
// Check support
'serviceWorker' in navigator && 'PushManager' in window

// Check permission
Notification.permission

// Get service worker
navigator.serviceWorker.getRegistration()

// Get subscription
navigator.serviceWorker.getRegistration()
  .then(r => r?.pushManager.getSubscription())
```

## Performance Notes

- Service worker registers ~500ms after first page load
- Notification permission request takes ~1-2 seconds
- Push subscription creation takes ~1-2 seconds  
- Backend API call takes ~0.5-1 second
- Total time to enable: ~3-5 seconds

## Support

For detailed information, see:
- `PUSH_NOTIFICATIONS.md` - Full documentation
- `PUSH_NOTIFICATIONS_IMPROVEMENTS.md` - What changed and why

For help with browser-specific issues:
- Chrome: https://support.google.com/chrome/answer/3220216
- Firefox: https://support.mozilla.org/en-US/kb/push-notifications-firefox
- Edge: https://support.microsoft.com/en-us/microsoft-edge

## Checklist Before Reporting Issues

- [ ] Run `python troubleshoot_push.py` and all checks pass
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 5173  
- [ ] Logged in to the application
- [ ] Checked browser console (F12) for error messages
- [ ] Tried in an incognito window (rules out cache issues)
- [ ] Browser supports push (Chrome/Firefox/Edge/Opera)
- [ ] Tried resetting notification permissions

When reporting issues, include:
1. Browser type and version
2. Console error message (if any)
3. Steps to reproduce
4. Output of `python troubleshoot_push.py`
