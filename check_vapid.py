#!/usr/bin/env python
"""Check VAPID key configuration for push notifications."""
import os
import sys

def check_frontend_env():
    """Check frontend environment variables."""
    print("=" * 60)
    print("FRONTEND CONFIGURATION CHECK")
    print("=" * 60)
    
    frontend_env = "frontend/.env"
    if not os.path.exists(frontend_env):
        print(f"❌ {frontend_env} not found")
        return False
    
    try:
        with open(frontend_env, 'r') as f:
            content = f.read()
        
        has_vapid = 'VITE_VAPID_PUBLIC_KEY' in content
        has_api = 'VITE_API_URL' in content
        
        if has_vapid:
            print("✓ VITE_VAPID_PUBLIC_KEY configured")
        else:
            print("❌ VITE_VAPID_PUBLIC_KEY not found")
        
        if has_api:
            print("✓ VITE_API_URL configured")
        else:
            print("⚠ VITE_API_URL not found (will use default)")
        
        return has_vapid
    except Exception as e:
        print(f"❌ Error reading {frontend_env}: {e}")
        return False

def check_backend_env():
    """Check backend environment variables."""
    print("\n" + "=" * 60)
    print("BACKEND CONFIGURATION CHECK")
    print("=" * 60)
    
    backend_env = "backend/.env"
    if not os.path.exists(backend_env):
        print(f"❌ {backend_env} not found")
        return False
    
    try:
        with open(backend_env, 'r') as f:
            content = f.read()
        
        has_private = 'VAPID_PRIVATE_KEY' in content
        has_email = 'VAPID_EMAIL' in content
        
        if has_private:
            print("✓ VAPID_PRIVATE_KEY configured")
        else:
            print("❌ VAPID_PRIVATE_KEY not found")
        
        if has_email:
            print("✓ VAPID_EMAIL configured")
        else:
            print("⚠ VAPID_EMAIL not found (recommended for production)")
        
        return has_private
    except Exception as e:
        print(f"❌ Error reading {backend_env}: {e}")
        return False

def check_service_worker():
    """Check if service worker exists."""
    print("\n" + "=" * 60)
    print("SERVICE WORKER CHECK")
    print("=" * 60)
    
    sw_path = "frontend/public/service-worker.js"
    if os.path.exists(sw_path):
        print(f"✓ Service worker found at {sw_path}")
        return True
    else:
        print(f"❌ Service worker not found at {sw_path}")
        return False

def check_push_models():
    """Check if push models and migrations exist."""
    print("\n" + "=" * 60)
    print("DATABASE MODELS CHECK")
    print("=" * 60)
    
    models_path = "backend/core/models/push.py"
    if os.path.exists(models_path):
        print(f"✓ Push models found at {models_path}")
    else:
        print(f"❌ Push models not found at {models_path}")
        return False
    
    views_path = "backend/core/views/push.py"
    if os.path.exists(views_path):
        print(f"✓ Push views found at {views_path}")
    else:
        print(f"❌ Push views not found at {views_path}")
        return False
    
    return True

def main():
    """Run all checks."""
    print("\n🔍 PUSH NOTIFICATIONS SETUP VERIFICATION\n")
    
    frontend_ok = check_frontend_env()
    backend_ok = check_backend_env()
    sw_ok = check_service_worker()
    models_ok = check_push_models()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    all_ok = frontend_ok and backend_ok and sw_ok and models_ok
    
    if all_ok:
        print("✓ All checks passed! Push notifications should work.")
        print("\nNext steps:")
        print("1. Start backend: cd backend && python manage.py runserver")
        print("2. Start frontend: cd frontend && npm run dev")
        print("3. Open http://localhost:5173")
        print("4. Click notification icon in header")
        print("5. Grant permission when prompted")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print("\nTo generate VAPID keys, run:")
        print("  python generate_vapid.py")
        print("\nFor detailed setup, see PUSH_NOTIFICATIONS.md")
    
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
