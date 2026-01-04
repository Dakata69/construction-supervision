#!/usr/bin/env python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import base64

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

print(f"Frontend .env (VITE_VAPID_PUBLIC_KEY):")
print(public_key_b64)
print()
print(f"Backend .env (VAPID_PRIVATE_KEY):")
print(private_key_pem.strip())
