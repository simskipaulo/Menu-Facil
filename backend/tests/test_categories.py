import pytest


def get_token(client, email="restaurant@test.com", password="password123"):
    return client.post("/auth/login", json={"email": email, "password": password}).json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_create_category(client, restaurant_admin):
    token = get_token(client)
    resp = client.post("/categories/", json={"name": "Pizzas", "emoji": "🍕", "order": 0}, headers=auth_header(token))
    assert resp.status_code == 201
    assert resp.json()["name"] == "Pizzas"
    assert resp.json()["emoji"] == "🍕"


def test_list_categories_scoped_to_tenant(client, restaurant_admin):
    token = get_token(client)
    client.post("/categories/", json={"name": "Bebidas", "order": 1}, headers=auth_header(token))
    resp = client.get("/categories/", headers=auth_header(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["name"] == "Bebidas"


def test_update_category(client, restaurant_admin):
    token = get_token(client)
    cat = client.post("/categories/", json={"name": "Old", "order": 0}, headers=auth_header(token)).json()
    resp = client.patch(f"/categories/{cat['id']}", json={"name": "New", "order": 0}, headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


def test_delete_category(client, restaurant_admin):
    token = get_token(client)
    cat = client.post("/categories/", json={"name": "ToDelete", "order": 0}, headers=auth_header(token)).json()
    resp = client.delete(f"/categories/{cat['id']}", headers=auth_header(token))
    assert resp.status_code == 204


def test_category_not_found(client, restaurant_admin):
    token = get_token(client)
    resp = client.patch("/categories/99999", json={"name": "Ghost", "order": 0}, headers=auth_header(token))
    assert resp.status_code == 404


def test_delete_category_not_found(client, restaurant_admin):
    token = get_token(client)
    resp = client.delete("/categories/99999", headers=auth_header(token))
    assert resp.status_code == 404


def test_categories_ordered_by_order_field(client, restaurant_admin):
    token = get_token(client)
    client.post("/categories/", json={"name": "B", "order": 2}, headers=auth_header(token))
    client.post("/categories/", json={"name": "A", "order": 1}, headers=auth_header(token))
    resp = client.get("/categories/", headers=auth_header(token))
    names = [c["name"] for c in resp.json()]
    assert names == ["A", "B"]


def test_cross_tenant_category_isolation(client, db, restaurant_admin):
    """Tenant A cannot see or modify Tenant B's categories."""
    from app.models import Tenant, Category as Cat
    t2 = Tenant(name="Tenant B", slug="tenant-b-cat")
    db.add(t2)
    db.commit()
    db.refresh(t2)
    cat_b = Cat(name="Hambúrgueres", order=0, tenant_id=t2.id)
    db.add(cat_b)
    db.commit()

    token = get_token(client)
    # List should not include tenant B's category
    resp = client.get("/categories/", headers=auth_header(token))
    assert all(c["name"] != "Hambúrgueres" for c in resp.json())

    # Delete should return 404
    resp = client.delete(f"/categories/{cat_b.id}", headers=auth_header(token))
    assert resp.status_code == 404
