#!/usr/bin/env python
"""Comprehensive push notifications troubleshooting tool."""
import os
import sys
import subprocess

def run_command(cmd, description):
    """Run a command and report results."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=os.getcwd())
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def print_section(title):
    """Print a section header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def check_python_dependencies():
    """Check if required Python packages are installed."""
    print_section("PYTHON DEPENDENCIES CHECK")
    
    packages = [
        ('cryptography', 'cryptography'),
        ('pywebpush', 'pywebpush'),
        ('django', 'Django REST Framework'),
        ('rest_framework', 'Django REST Framework'),
    ]
    
    all_ok = True
    for module, name in packages:
        try:
            __import__(module)
            print(f"✓ {name} installed")
        except ImportError:
            print(f"❌ {name} NOT installed")
            print(f"   Run: pip install {module}")
            all_ok = False
    
    return all_ok

def check_env_files():
    """Check environment variable files."""
    print_section("ENVIRONMENT FILES CHECK")
    
    files_to_check = [
        ('backend/.env', ['VAPID_PRIVATE_KEY', 'DJANGO_SECRET_KEY']),
        ('frontend/.env', ['VITE_VAPID_PUBLIC_KEY']),
    ]
    
    all_ok = True
    for filepath, required_keys in files_to_check:
        if not os.path.exists(filepath):
            print(f"❌ {filepath} not found")
            print(f"   Create it from {filepath.replace('.env', 'env.example')}")
            all_ok = False
            continue
        
        with open(filepath, 'r') as f:
            content = f.read()
        
        print(f"\n📄 {filepath}:")
        for key in required_keys:
            if key in content:
                # Get the value (redact if it's a key)
                lines = [l for l in content.split('\n') if l.startswith(f"{key}=")]
                if lines:
                    value = lines[0].split('=', 1)[1]
                    # Redact long keys
                    if len(value) > 20:
                        value = value[:10] + "..." + value[-10:]
                    print(f"  ✓ {key} = {value}")
            else:
                print(f"  ❌ {key} not found")
                all_ok = False
    
    return all_ok

def check_backend_setup():
    """Check backend setup."""
    print_section("BACKEND SETUP CHECK")
    
    checks = [
        ('backend/manage.py', 'Django manage.py'),
        ('backend/core/models/push.py', 'Push models'),
        ('backend/core/views/push.py', 'Push views'),
        ('backend/core/serializers.py', 'Serializers'),
    ]
    
    all_ok = True
    for filepath, desc in checks:
        if os.path.exists(filepath):
            print(f"✓ {desc} ({filepath})")
        else:
            print(f"❌ {desc} NOT found ({filepath})")
            all_ok = False
    
    return all_ok

def check_frontend_setup():
    """Check frontend setup."""
    print_section("FRONTEND SETUP CHECK")
    
    checks = [
        ('frontend/src/utils/push.ts', 'Push utilities'),
        ('frontend/public/service-worker.js', 'Service worker'),
        ('frontend/src/components/Header.tsx', 'Header component'),
    ]
    
    all_ok = True
    for filepath, desc in checks:
        if os.path.exists(filepath):
            print(f"✓ {desc} ({filepath})")
        else:
            print(f"❌ {desc} NOT found ({filepath})")
            all_ok = False
    
    return all_ok

def check_database_migrations():
    """Check if migrations are applied."""
    print_section("DATABASE MIGRATIONS CHECK")
    
    migration_file = 'backend/core/migrations/0008_push_subscription.py'
    if os.path.exists(migration_file):
        print(f"✓ Push subscription migration found")
        print(f"  To apply: python backend/manage.py migrate")
    else:
        # Check for alternative migration files
        migration_dir = 'backend/core/migrations/'
        if os.path.exists(migration_dir):
            migrations = [f for f in os.listdir(migration_dir) if f.endswith('.py')]
            print(f"Found {len(migrations)} migration files")
            for mig in sorted(migrations)[-3:]:
                print(f"  - {mig}")
        print(f"⚠️ Push subscription migration status unclear")
        print(f"   Run: python backend/manage.py migrate")

def check_vapid_keys():
    """Check if VAPID keys are properly formatted."""
    print_section("VAPID KEY FORMAT CHECK")
    
    frontend_env = 'frontend/.env'
    backend_env = 'backend/.env'
    
    # Check frontend
    if os.path.exists(frontend_env):
        with open(frontend_env, 'r') as f:
            for line in f:
                if line.startswith('VITE_VAPID_PUBLIC_KEY='):
                    key = line.split('=', 1)[1].strip()
                    if len(key) > 80:  # VAPID keys are typically 86-88 chars
                        print(f"✓ Frontend VAPID public key looks valid ({len(key)} chars)")
                    else:
                        print(f"⚠️ Frontend VAPID public key might be incorrect ({len(key)} chars)")
                    break
    
    # Check backend
    if os.path.exists(backend_env):
        with open(backend_env, 'r') as f:
            for line in f:
                if line.startswith('VAPID_PRIVATE_KEY='):
                    key = line.split('=', 1)[1].strip()
                    if 'BEGIN' in key or 'PRIVATE KEY' in key:
                        print(f"✓ Backend VAPID private key looks valid (PEM format)")
                    else:
                        print(f"⚠️ Backend VAPID private key might not be PEM format")
                    break

def suggest_next_steps():
    """Suggest next steps."""
    print_section("NEXT STEPS")
    
    print("""
1. Generate VAPID Keys (if not done):
   python generate_vapid.py

2. Check Configuration:
   python check_vapid.py

3. Start Backend Server:
   cd backend
   python manage.py migrate
   python manage.py runserver

4. Start Frontend Server (in another terminal):
   cd frontend
   npm install
   npm run dev

5. Test Push Notifications:
   - Open http://localhost:5173
   - Log in with your credentials
   - Click notification icon in header
   - Click "Allow" when prompted
   - You should see "Push известията са включени"

6. Check Browser Console (F12 → Console):
   - Look for detailed log messages
   - Each step should show success/error
   - Report specific error if it fails

7. Enable Push Notifications in Backend:
   - In Django admin: add PushSubscription entries
   - Or use: python manage.py send_test_push --user=1

For detailed debugging, see: PUSH_NOTIFICATIONS.md
""")

def main():
    """Run all checks."""
    print("\n" + "█" * 70)
    print("  PUSH NOTIFICATIONS TROUBLESHOOTING TOOL")
    print("█" * 70)
    
    checks = [
        ("Python Dependencies", check_python_dependencies),
        ("Environment Files", check_env_files),
        ("Backend Setup", check_backend_setup),
        ("Frontend Setup", check_frontend_setup),
    ]
    
    results = {}
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            print(f"\n❌ Error in {name}: {e}")
            results[name] = False
    
    # Additional checks that don't need to pass
    try:
        check_database_migrations()
    except Exception as e:
        print(f"\n⚠️ Warning in migrations check: {e}")
    
    try:
        check_vapid_keys()
    except Exception as e:
        print(f"\n⚠️ Warning in VAPID key check: {e}")
    
    # Summary
    print_section("SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\nChecks passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All checks passed! Push notifications should work.\n")
    else:
        print("⚠️ Some checks failed. Please fix the issues above.\n")
    
    suggest_next_steps()
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
