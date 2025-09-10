#!/usr/bin/env python3
"""
Script to make a user admin
Usage: 
  - From host: sudo docker exec -it kitkuhar-backend-1 python make_admin.py
  - From container: python make_admin.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User

def make_admin(username="Adminsobaka"):
    db = SessionLocal()
    try:
        # Find user
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print(f"❌ User '{username}' not found!")
            return False
            
        # Make admin
        user.is_admin = True
        db.commit()
        
        print(f"✅ User '{username}' is now an admin!")
        print(f"📧 Email: {user.email}")
        print(f"🔑 Admin status: {user.is_admin}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    make_admin()