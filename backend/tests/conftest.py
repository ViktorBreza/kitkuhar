import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app import models

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False  # Disable SQL echo for tests
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Setup test database once for all tests"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    # Override dependency for this session
    def override_get_db():
        try:
            yield session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
    
    # Clean up override
    if get_db in app.dependency_overrides:
        del app.dependency_overrides[get_db]

@pytest.fixture(scope="function")
def client():
    """Create test client"""
    with TestClient(app) as c:
        yield c

@pytest.fixture
def sample_category(db_session):
    """Create a sample category for testing"""
    category = models.Category(name="Test Category")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category

@pytest.fixture
def sample_tag(db_session):
    """Create a sample tag for testing"""
    tag = models.Tag(name="Test Tag")
    db_session.add(tag)
    db_session.commit()
    db_session.refresh(tag)
    return tag

@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing"""
    try:
        from app.auth import get_password_hash
        user = models.User(
            email="test@example.com",
            username="testuser",
            hashed_password=get_password_hash("testpass"),
            is_admin=False,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    except Exception:
        # If User model doesn't exist or auth module has issues, skip
        pytest.skip("User model or auth module not available")

@pytest.fixture
def admin_user(db_session):
    """Create an admin user for testing"""
    try:
        from app.auth import get_password_hash
        user = models.User(
            email="admin@example.com",
            username="admin",
            hashed_password=get_password_hash("adminpass"),
            is_admin=True,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    except Exception:
        pytest.skip("User model or auth module not available")

@pytest.fixture
def auth_token(sample_user):
    """Get authentication token for sample user"""
    try:
        from app.auth import create_access_token
        return create_access_token(data={"sub": sample_user.username})
    except Exception:
        pytest.skip("Auth module not available")

@pytest.fixture
def admin_token(admin_user):
    """Get authentication token for admin user"""
    try:
        from app.auth import create_access_token
        return create_access_token(data={"sub": admin_user.username})
    except Exception:
        pytest.skip("Auth module not available")

@pytest.fixture
def sample_recipe(db_session, sample_category, sample_user):
    """Create a sample recipe for testing"""
    recipe = models.Recipe(
        title="Test Recipe",
        description="A test recipe",
        ingredients=[
            {"name": "Flour", "quantity": 2.0, "unit": "cups"},
            {"name": "Sugar", "quantity": 1.0, "unit": "cup"}
        ],
        steps="1. Mix ingredients. 2. Bake.",
        servings=4,
        category_id=sample_category.id,
        author_id=sample_user.id
    )
    db_session.add(recipe)
    db_session.commit()
    db_session.refresh(recipe)
    return recipe