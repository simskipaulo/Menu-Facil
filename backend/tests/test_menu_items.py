import pytest


def get_token(client, email="restaurant@test.com", password="password123"):
    return client.post("/auth/login", json={"email": email, "password": password}).json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def category(client, restaurant_admin):
    token = get_token(client)
    return client.post("/categories/", json={"name": "Pizzas", "order": 0}, headers=auth_header(token)).json()


def test_create_menu_item(client, restaurant_admin, category):
    token = get_token(client)
    resp = client.post("/menu-items/", json={
        "name": "Margherita", "price": "42.00", "category_id": category["id"], "tag_ids": []
    }, headers=auth_header(token))
    assert resp.status_code == 201
    assert resp.json()["name"] == "Margherita"
    assert resp.json()["tags"] == []


def test_create_item_with_tags(client, restaurant_admin, category):
    token = get_token(client)
    tag = client.post("/tags/", json={"name": "Vegano", "emoji": "🌱"}, headers=auth_header(token)).json()
    resp = client.post("/menu-items/", json={
        "name": "Pizza Vegana", "price": "45.00", "category_id": category["id"], "tag_ids": [tag["id"]]
    }, headers=auth_header(token))
    assert resp.status_code == 201
    assert len(resp.json()["tags"]) == 1
    assert resp.json()["tags"][0]["name"] == "Vegano"


def test_get_single_item(client, restaurant_admin, category):
    token = get_token(client)
    item = client.post("/menu-items/", json={
        "name": "Calabresa", "price": "48.00", "category_id": category["id"]
    }, headers=auth_header(token)).json()
    resp = client.get(f"/menu-items/{item['id']}", headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["name"] == "Calabresa"


def test_get_item_not_found(client, restaurant_admin):
    token = get_token(client)
    resp = client.get("/menu-items/99999", headers=auth_header(token))
    assert resp.status_code == 404


def test_update_item_toggle_availability(client, restaurant_admin, category):
    token = get_token(client)
    item = client.post("/menu-items/", json={
        "name": "Calabresa", "price": "48.00", "category_id": category["id"]
    }, headers=auth_header(token)).json()
    resp = client.patch(f"/menu-items/{item['id']}", json={"is_available": False}, headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["is_available"] is False


def test_patch_cross_tenant_category_rejected(client, db, restaurant_admin, category):
    """PATCH must not allow reassigning item to a category from another tenant."""
    from app.models import Tenant, Category as Cat
    t2 = Tenant(name="Other", slug="other-for-items")
    db.add(t2)
    db.commit()
    db.refresh(t2)
    cat2 = Cat(name="Hambúrgueres", order=0, tenant_id=t2.id)
    db.add(cat2)
    db.commit()

    token = get_token(client)
    item = client.post("/menu-items/", json={
        "name": "TestItem", "price": "10.00", "category_id": category["id"]
    }, headers=auth_header(token)).json()

    resp = client.patch(f"/menu-items/{item['id']}", json={"category_id": cat2.id}, headers=auth_header(token))
    assert resp.status_code == 400


def test_cross_tenant_tag_assignment_rejected(client, db, restaurant_admin, category):
    """Cannot assign a tag from another tenant to a menu item."""
    from app.models import Tenant, Tag as TagModel

    t2 = Tenant(name="TenantB", slug="tenant-b-items")
    db.add(t2)
    db.commit()
    db.refresh(t2)
    tag_b = TagModel(name="ForeignTag", tenant_id=t2.id)
    db.add(tag_b)
    db.commit()

    token = get_token(client)
    resp = client.post("/menu-items/", json={
        "name": "Attempt", "price": "20.00", "category_id": category["id"], "tag_ids": [tag_b.id]
    }, headers=auth_header(token))
    assert resp.status_code == 400


def test_duplicate_tag_ids_handled(client, restaurant_admin, category):
    """Duplicate tag IDs in tag_ids should not cause a spurious 400."""
    token = get_token(client)
    tag = client.post("/tags/", json={"name": "Picante"}, headers=auth_header(token)).json()
    resp = client.post("/menu-items/", json={
        "name": "Picante Pizza", "price": "50.00", "category_id": category["id"],
        "tag_ids": [tag["id"], tag["id"]]
    }, headers=auth_header(token))
    assert resp.status_code == 201
    assert len(resp.json()["tags"]) == 1


def test_delete_menu_item(client, restaurant_admin, category):
    token = get_token(client)
    item = client.post("/menu-items/", json={
        "name": "ToDelete", "price": "10.00", "category_id": category["id"]
    }, headers=auth_header(token)).json()
    resp = client.delete(f"/menu-items/{item['id']}", headers=auth_header(token))
    assert resp.status_code == 204


def test_delete_item_not_found(client, restaurant_admin):
    token = get_token(client)
    resp = client.delete("/menu-items/99999", headers=auth_header(token))
    assert resp.status_code == 404


def test_cross_tenant_isolation(client, db, restaurant_admin, category):
    """Items from another tenant must not appear in the list."""
    from app.models import Tenant, User, UserRole, Category as Cat, MenuItem
    from app.core.auth import hash_password

    t2 = Tenant(name="Other Restaurant", slug="other-restaurant")
    db.add(t2)
    db.commit()
    db.refresh(t2)
    cat2 = Cat(name="Hambúrgueres", order=0, tenant_id=t2.id)
    db.add(cat2)
    db.commit()
    item2 = MenuItem(name="X-Burguer", price=25, category_id=cat2.id, tenant_id=t2.id)
    db.add(item2)
    db.commit()

    token = get_token(client)
    resp = client.get("/menu-items/", headers=auth_header(token))
    assert resp.status_code == 200
    assert all(i["name"] != "X-Burguer" for i in resp.json())
