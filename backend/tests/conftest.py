import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User, UserRole, Tenant
from app.core.auth import hash_password

TEST_DB_URL = os.getenv("TEST_DATABASE_URL", "postgresql://user:password@localhost:5432/menufacil_test")
engine = create_engine(TEST_DB_URL)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def super_admin(db):
    user = User(
        email="admin@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.super_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def tenant(db):
    t = Tenant(name="Test Restaurant", slug="test-restaurant")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@pytest.fixture
def restaurant_admin(db, tenant):
    user = User(
        email="restaurant@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.restaurant_admin,
        tenant_id=tenant.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
