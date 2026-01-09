#!/usr/bin/env python
"""
Test script for forgot password flow
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from django.contrib.auth.models import User
from core.models import PasswordResetToken
from core.utils.email_sender import send_password_reset_email
from django.test import Client
import json

# Test 1: Verify email address is available for testing
print("=" * 60)
print("TEST 1: Checking test user")
print("=" * 60)

# Try to create a test user if it doesn't exist
test_email = 'test@example.com'
test_user, created = User.objects.get_or_create(
    email=test_email,
    defaults={
        'username': 'testuser',
        'first_name': 'Test',
        'last_name': 'User',
    }
)

if created:
    test_user.set_password('originalpassword123')
    test_user.save()
    print(f"✓ Created test user: {test_user.username} ({test_user.email})")
else:
    print(f"✓ Test user already exists: {test_user.username} ({test_user.email})")

# Test 2: Request password reset via API
print("\n" + "=" * 60)
print("TEST 2: Request password reset via API")
print("=" * 60)

client = Client()
response = client.post(
    '/api/auth/request-password-reset/',
    data=json.dumps({'email': test_email}),
    content_type='application/json'
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Test 3: Verify reset token was created
print("\n" + "=" * 60)
print("TEST 3: Verify reset token created")
print("=" * 60)

tokens = PasswordResetToken.objects.filter(user=test_user, used=False).order_by('-created_at')
if tokens.exists():
    reset_token = tokens.first()
    print(f"✓ Reset token created: {reset_token.token[:20]}...")
    print(f"  User: {reset_token.user.email}")
    print(f"  Created: {reset_token.created_at}")
    
    # Test 4: Validate the token
    print("\n" + "=" * 60)
    print("TEST 4: Validate reset token")
    print("=" * 60)
    
    response = client.post(
        '/api/auth/validate-reset-token/',
        data=json.dumps({'token': reset_token.token}),
        content_type='application/json'
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test 5: Reset password with the token
    print("\n" + "=" * 60)
    print("TEST 5: Reset password with token")
    print("=" * 60)
    
    new_password = 'newpassword123'
    response = client.post(
        '/api/auth/reset-password/',
        data=json.dumps({
            'token': reset_token.token,
            'password': new_password
        }),
        content_type='application/json'
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test 6: Try logging in with new password
    print("\n" + "=" * 60)
    print("TEST 6: Login with new password")
    print("=" * 60)
    
    response = client.post(
        '/api/token/',
        data=json.dumps({
            'username': test_user.username,
            'password': new_password
        }),
        content_type='application/json'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✓ Login successful with new password")
        print(f"  Access token: {response.json().get('access', 'N/A')[:20]}...")
    else:
        print(f"✗ Login failed: {response.json()}")

else:
    print("✗ No reset token found")

print("\n" + "=" * 60)
print("TESTS COMPLETED")
print("=" * 60)
