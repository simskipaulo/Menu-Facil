import pytest


def get_token(client, email="restaurant@test.com", password="password123"):
    return client.post("/auth/login", json={"email": email, "password": password}).json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_create_tag(client, restaurant_admin):
    token = get_token(client)
    resp = client.post("/tags/", json={"name": "Vegano", "emoji": "🌱", "color": "#dcfce7", "text_color": "#166534"}, headers=auth_header(token))
    assert resp.status_code == 201
    assert resp.json()["name"] == "Vegano"
    assert resp.json()["emoji"] == "🌱"


def test_list_tags_scoped_to_tenant(client, restaurant_admin):
    token = get_token(client)
    client.post("/tags/", json={"name": "Picante"}, headers=auth_header(token))
    resp = client.get("/tags/", headers=auth_header(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_update_tag(client, restaurant_admin):
    token = get_token(client)
    tag = client.post("/tags/", json={"name": "OldTag"}, headers=auth_header(token)).json()
    resp = client.patch(f"/tags/{tag['id']}", json={"name": "NewTag"}, headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["name"] == "NewTag"


def test_delete_tag(client, restaurant_admin):
    token = get_token(client)
    tag = client.post("/tags/", json={"name": "ToDelete"}, headers=auth_header(token)).json()
    resp = client.delete(f"/tags/{tag['id']}", headers=auth_header(token))
    assert resp.status_code == 204


def test_tag_not_found(client, restaurant_admin):
    token = get_token(client)
    resp = client.patch("/tags/99999", json={"name": "Ghost"}, headers=auth_header(token))
    assert resp.status_code == 404


def test_cross_tenant_tag_isolation(client, db, restaurant_admin):
    """Tenant A cannot see or modify Tenant B's tags."""
    from app.models import Tenant, User, UserRole, Tag as TagModel
    from app.core.auth import hash_password

    t2 = Tenant(name="Tenant B", slug="tenant-b")
    db.add(t2)
    db.commit()
    db.refresh(t2)
    tag_b = TagModel(name="TagB", tenant_id=t2.id)
    db.add(tag_b)
    db.commit()

    token = get_token(client)
    # Tenant A's list should not include Tenant B's tag
    resp = client.get("/tags/", headers=auth_header(token))
    assert resp.status_code == 200
    assert all(t["name"] != "TagB" for t in resp.json())

    # Tenant A cannot delete Tenant B's tag
    resp = client.delete(f"/tags/{tag_b.id}", headers=auth_header(token))
    assert resp.status_code == 404
