"""
Test script to debug login issues
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hanakotoba.settings')
django.setup()

from django.contrib.auth import authenticate, get_user_model

User = get_user_model()

# Test authentication
print("Testing authentication...")
print("-" * 50)

# Get all users
users = User.objects.all()
print(f"\nTotal users: {users.count()}")

for user in users:
    print(f"\nUser: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Has usable password: {user.has_usable_password()}")
    print(f"  Password hash: {user.password[:50]}...")
    
    # Test with common passwords
    test_passwords = ['password', 'password123', 'admin123', user.username]
    
    for pwd in test_passwords:
        auth_user = authenticate(username=user.username, password=pwd)
        if auth_user:
            print(f"  ✓ Successfully authenticated with password: '{pwd}'")
            break
    else:
        print(f"  ✗ Could not authenticate with test passwords")

print("\n" + "=" * 50)
print("To reset a user's password, run:")
print("  from django.contrib.auth import get_user_model")
print("  User = get_user_model()")
print("  u = User.objects.get(username='voxnuts')")
print("  u.set_password('newpassword123')")
print("  u.save()")
