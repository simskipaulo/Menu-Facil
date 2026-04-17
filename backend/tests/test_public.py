import pytest
from app.models import MenuItem, Category, Tag


def test_public_menu_returns_items(client, db, tenant, restaurant_admin):
    cat = Category(name="Pizzas", order=0, tenant_id=tenant.id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    item = MenuItem(name="Margherita", price=42, category_id=cat.id, tenant_id=tenant.id)
    db.add(item)
    db.commit()

    resp = client.get(f"/public/{tenant.slug}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["tenant"]["name"] == tenant.name
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Margherita"
    assert len(data["categories"]) == 1


def test_public_menu_not_found(client):
    resp = client.get("/public/nonexistent-slug")
    assert resp.status_code == 404


def test_public_menu_hides_unavailable_items(client, db, tenant):
    cat = Category(name="Pizzas", order=0, tenant_id=tenant.id)
    db.add(cat)
    db.commit()
    item = MenuItem(name="Hidden", price=10, category_id=cat.id, tenant_id=tenant.id, is_available=False)
    db.add(item)
    db.commit()

    resp = client.get(f"/public/{tenant.slug}")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 0


def test_public_menu_inactive_tenant_not_found(client, db, tenant):
    tenant.is_active = False
    db.commit()
    resp = client.get(f"/public/{tenant.slug}")
    assert resp.status_code == 404


def test_public_menu_no_auth_required(client, tenant):
    # No Authorization header — should still work
    resp = client.get(f"/public/{tenant.slug}")
    assert resp.status_code == 200


def test_public_menu_categories_ordered(client, db, tenant):
    cat_b = Category(name="B", order=2, tenant_id=tenant.id)
    cat_a = Category(name="A", order=1, tenant_id=tenant.id)
    db.add_all([cat_b, cat_a])
    db.commit()

    resp = client.get(f"/public/{tenant.slug}")
    names = [c["name"] for c in resp.json()["categories"]]
    assert names == ["A", "B"]
