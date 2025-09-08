import pytest
from fastapi import HTTPException
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
    authenticate_user
)

def test_password_hashing():
    """Test password hashing and verification"""
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    # Should be different from original password
    assert hashed != password
    
    # Should verify correctly
    assert verify_password(password, hashed) == True
    
    # Should not verify wrong password
    assert verify_password("wrongpassword", hashed) == False

def test_create_and_verify_token():
    """Test JWT token creation and verification"""
    data = {"sub": "testuser"}
    token = create_access_token(data)
    
    # Should be a string
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Should verify correctly
    token_data = verify_token(token)
    assert token_data is not None
    assert token_data.username == "testuser"

def test_verify_invalid_token():
    """Test verification of invalid token"""
    invalid_token = "invalid.token.here"
    token_data = verify_token(invalid_token)
    assert token_data is None

def test_authenticate_user(db_session, sample_user):
    """Test user authentication"""
    # Should authenticate with correct credentials
    user = authenticate_user(db_session, sample_user.username, "testpass")
    assert user is not None
    assert user.username == sample_user.username
    
    # Should not authenticate with wrong password
    user = authenticate_user(db_session, sample_user.username, "wrongpass")
    assert user is None
    
    # Should not authenticate non-existent user
    user = authenticate_user(db_session, "nonexistent", "password")
    assert user is None

def test_auth_endpoints(client):
    """Test authentication endpoints"""
    # Test registration
    register_data = {
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "newpassword"
    }
    response = client.post("/api/auth/register", json=register_data)
    assert response.status_code in [200, 201]  # Accept both status codes
    user_data = response.json()
    assert user_data["username"] == "newuser"
    assert user_data["email"] == "newuser@example.com"
    
    # Test login
    login_data = {
        "username": "newuser",
        "password": "newpassword"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_protected_endpoint(client, auth_token):
    """Test accessing protected endpoint with token"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    user_data = response.json()
    assert "username" in user_data

def test_protected_endpoint_without_token(client):
    """Test accessing protected endpoint without token"""
    response = client.get("/api/auth/me")
    assert response.status_code in [401, 403]  # Accept both unauthorized and forbidden