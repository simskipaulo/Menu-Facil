def get_token(client, email="admin@test.com", password="password123"):
    return client.post("/auth/login", json={"email": email, "password": password}).json()["access_token"]

def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_create_tenant(client, super_admin):
    token = get_token(client)
    resp = client.post("/tenants/", json={"name": "Pizza Place", "slug": "pizza-place"}, headers=auth_header(token))
    assert resp.status_code == 201
    assert resp.json()["slug"] == "pizza-place"


def test_duplicate_slug(client, super_admin, tenant):
    token = get_token(client)
    resp = client.post("/tenants/", json={"name": "Other", "slug": "test-restaurant"}, headers=auth_header(token))
    assert resp.status_code == 409


def test_list_tenants(client, super_admin, tenant):
    token = get_token(client)
    resp = client.get("/tenants/", headers=auth_header(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_tenant(client, super_admin, tenant):
    token = get_token(client)
    resp = client.get(f"/tenants/{tenant.id}", headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["slug"] == "test-restaurant"


def test_update_tenant(client, super_admin, tenant):
    token = get_token(client)
    resp = client.patch(f"/tenants/{tenant.id}", json={"opening_hours": "Seg-Sex 12h-22h"}, headers=auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["opening_hours"] == "Seg-Sex 12h-22h"


def test_delete_tenant(client, super_admin, tenant):
    token = get_token(client)
    resp = client.delete(f"/tenants/{tenant.id}", headers=auth_header(token))
    assert resp.status_code == 204


def test_restaurant_admin_cannot_list_tenants(client, restaurant_admin):
    token = get_token(client, "restaurant@test.com")
    resp = client.get("/tenants/", headers=auth_header(token))
    assert resp.status_code == 403


def test_restaurant_admin_cannot_get_tenant(client, restaurant_admin, tenant):
    token = get_token(client, "restaurant@test.com")
    resp = client.get(f"/tenants/{tenant.id}", headers=auth_header(token))
    assert resp.status_code == 403


def test_restaurant_admin_cannot_patch_tenant(client, restaurant_admin, tenant):
    token = get_token(client, "restaurant@test.com")
    resp = client.patch(f"/tenants/{tenant.id}", json={"name": "Hack"}, headers=auth_header(token))
    assert resp.status_code == 403


def test_restaurant_admin_cannot_delete_tenant(client, restaurant_admin, tenant):
    token = get_token(client, "restaurant@test.com")
    resp = client.delete(f"/tenants/{tenant.id}", headers=auth_header(token))
    assert resp.status_code == 403


def test_create_restaurant_admin(client, super_admin, tenant):
    token = get_token(client)
    resp = client.post(
        f"/tenants/{tenant.id}/users",
        json={"email": "chef@restaurant.com", "password": "chef123"},
        headers=auth_header(token),
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "restaurant_admin"
    assert resp.json()["tenant_id"] == tenant.id


def test_create_restaurant_admin_duplicate_email(client, super_admin, tenant, restaurant_admin):
    token = get_token(client)
    resp = client.post(
        f"/tenants/{tenant.id}/users",
        json={"email": "restaurant@test.com", "password": "any"},
        headers=auth_header(token),
    )
    assert resp.status_code == 409


def test_create_restaurant_admin_nonexistent_tenant(client, super_admin):
    token = get_token(client)
    resp = client.post(
        "/tenants/99999/users",
        json={"email": "newadmin@test.com", "password": "pass123"},
        headers=auth_header(token),
    )
    assert resp.status_code == 404
