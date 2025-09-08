import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app import models

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override the dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a fresh database session for each test"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

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

@pytest.fixture
def admin_user(db_session):
    """Create an admin user for testing"""
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

@pytest.fixture
def auth_token(sample_user):
    """Get authentication token for sample user"""
    from app.auth import create_access_token
    return create_access_token(data={"sub": sample_user.username})

@pytest.fixture
def admin_token(admin_user):
    """Get authentication token for admin user"""
    from app.auth import create_access_token
    return create_access_token(data={"sub": admin_user.username})

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