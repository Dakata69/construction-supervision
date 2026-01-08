#!/usr/bin/env python
"""Generate VAPID keys for push notifications."""
import os
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import base64

def generate_vapid_keys():
    """Generate EC key pair for VAPID."""
    print("Generating VAPID keys for push notifications...\n")
    
    # Generate EC key pair for VAPID
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    public_key = private_key.public_key()

    # Serialize public key in raw format (uncompressed point)
    public_key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode().rstrip('=')

    # Serialize private key 
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode()

    return public_key_b64, private_key_pem

def update_env_file(filename, key, value):
    """Update or add environment variable in .env file."""
    lines = []
    found = False
    
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            lines = f.readlines()
    
    # Look for existing key
    new_lines = []
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}\n")
            found = True
        else:
            new_lines.append(line)
    
    # Add key if not found
    if not found:
        if new_lines and not new_lines[-1].endswith('\n'):
            new_lines.append('\n')
        new_lines.append(f"{key}={value}\n")
    
    # Write back
    with open(filename, 'w') as f:
        f.writelines(new_lines)

def main():
    """Main function."""
    public_key, private_key = generate_vapid_keys()
    
    # Display keys
    print("=" * 70)
    print("GENERATED VAPID KEYS")
    print("=" * 70)
    print("\n📋 Copy these values to your .env files:\n")
    
    print("🔷 Frontend .env (VITE_VAPID_PUBLIC_KEY):")
    print("-" * 70)
    print(public_key)
    print()
    
    print("🔐 Backend .env (VAPID_PRIVATE_KEY):")
    print("-" * 70)
    print(private_key)
    print()
    
    # Ask if user wants to auto-update .env files
    print("=" * 70)
    auto_update = input("Auto-update .env files? (y/n): ").strip().lower() == 'y'
    
    if auto_update:
        # Update frontend .env
        frontend_env = "frontend/.env"
        print(f"\nUpdating {frontend_env}...")
        update_env_file(frontend_env, "VITE_VAPID_PUBLIC_KEY", public_key)
        print(f"✓ {frontend_env} updated")
        
        # Update backend .env
        backend_env = "backend/.env"
        print(f"Updating {backend_env}...")
        # Extract just the private key content (without PEM headers)
        update_env_file(backend_env, "VAPID_PRIVATE_KEY", repr(private_key))
        print(f"✓ {backend_env} updated")
        
        # Set default email if not exists
        if not os.path.exists(backend_env) or "VAPID_EMAIL" not in open(backend_env).read():
            with open(backend_env, 'a') as f:
                f.write(f"VAPID_EMAIL=mailto:admin@example.com\n")
            print(f"✓ Added VAPID_EMAIL to {backend_env}")
        
        print("\n✅ .env files updated successfully!")
        print("\nNext steps:")
        print("1. Restart your development servers")
        print("2. cd backend && python manage.py runserver")
        print("3. cd frontend && npm run dev")
        print("4. Test push notifications in the browser")
    else:
        print("\nℹ️ Manual setup required:")
        print(f"1. Edit frontend/.env and add VITE_VAPID_PUBLIC_KEY")
        print(f"2. Edit backend/.env and add VAPID_PRIVATE_KEY")
        print(f"3. Restart development servers")

if __name__ == "__main__":
    main()

