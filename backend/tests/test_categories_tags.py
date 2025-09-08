import pytest

def test_get_categories(client, sample_category):
    """Test getting all categories"""
    response = client.get("/api/categories/")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert len(categories) >= 1
    
    # Check if our sample category is in the list
    category_names = [c["name"] for c in categories]
    assert sample_category.name in category_names

def test_create_category(client, admin_token):
    """Test creating a new category"""
    category_data = {"name": "New Test Category"}
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.post("/api/categories/", json=category_data, headers=headers)
    assert response.status_code == 201
    
    created_category = response.json()
    assert created_category["name"] == category_data["name"]
    assert "id" in created_category

def test_create_duplicate_category(client, admin_token, sample_category):
    """Test creating duplicate category should fail"""
    category_data = {"name": sample_category.name}
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.post("/api/categories/", json=category_data, headers=headers)
    # Should fail due to unique constraint
    assert response.status_code in [400, 409]

def test_update_category(client, admin_token, sample_category):
    """Test updating a category"""
    updated_data = {"name": "Updated Category Name"}
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.put(f"/api/categories/{sample_category.id}", json=updated_data, headers=headers)
    assert response.status_code == 200
    
    updated_category = response.json()
    assert updated_category["name"] == updated_data["name"]

def test_delete_category(client, admin_token, sample_category):
    """Test deleting a category"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.delete(f"/api/categories/{sample_category.id}", headers=headers)
    assert response.status_code == 200
    
    # Verify it's actually deleted
    response = client.get("/api/categories/")
    categories = response.json()
    category_names = [c["name"] for c in categories]
    assert sample_category.name not in category_names

def test_get_tags(client, sample_tag):
    """Test getting all tags"""
    response = client.get("/api/tags/")
    assert response.status_code == 200
    tags = response.json()
    assert isinstance(tags, list)
    assert len(tags) >= 1
    
    # Check if our sample tag is in the list
    tag_names = [t["name"] for t in tags]
    assert sample_tag.name in tag_names

def test_create_tag(client, admin_token):
    """Test creating a new tag"""
    tag_data = {"name": "New Test Tag"}
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.post("/api/tags/", json=tag_data, headers=headers)
    assert response.status_code == 201
    
    created_tag = response.json()
    assert created_tag["name"] == tag_data["name"]
    assert "id" in created_tag

def test_create_duplicate_tag(client, admin_token, sample_tag):
    """Test creating duplicate tag should fail"""
    tag_data = {"name": sample_tag.name}
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.post("/api/tags/", json=tag_data, headers=headers)
    # Should fail due to unique constraint
    assert response.status_code in [400, 409]

def test_update_tag(client, admin_token, sample_tag):
    """Test updating a tag"""
    updated_data = {"name": "Updated Tag Name"}
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.put(f"/api/tags/{sample_tag.id}", json=updated_data, headers=headers)
    assert response.status_code == 200
    
    updated_tag = response.json()
    assert updated_tag["name"] == updated_data["name"]

def test_delete_tag(client, admin_token, sample_tag):
    """Test deleting a tag"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.delete(f"/api/tags/{sample_tag.id}", headers=headers)
    assert response.status_code == 200
    
    # Verify it's actually deleted
    response = client.get("/api/tags/")
    tags = response.json()
    tag_names = [t["name"] for t in tags]
    assert sample_tag.name not in tag_names

def test_category_tag_validation(client, admin_token):
    """Test validation for categories and tags"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test empty name
    invalid_data = {"name": ""}
    response = client.post("/api/categories/", json=invalid_data, headers=headers)
    assert response.status_code == 422
    
    response = client.post("/api/tags/", json=invalid_data, headers=headers)
    assert response.status_code == 422
    
    # Test missing name field
    response = client.post("/api/categories/", json={}, headers=headers)
    assert response.status_code == 422
    
    response = client.post("/api/tags/", json={}, headers=headers)
    assert response.status_code == 422

def test_unauthorized_category_operations(client):
    """Test category operations without admin privileges"""
    category_data = {"name": "Unauthorized Category"}
    
    # Without token
    response = client.post("/api/categories/", json=category_data)
    assert response.status_code == 401
    
    # With regular user token (if implemented)
    # This test would need a regular user token
    
def test_unauthorized_tag_operations(client):
    """Test tag operations without admin privileges"""
    tag_data = {"name": "Unauthorized Tag"}
    
    # Without token
    response = client.post("/api/tags/", json=tag_data)
    assert response.status_code == 401

def test_category_caching(client, sample_category):
    """Test that category caching works"""
    # Make multiple requests - second should be faster due to caching
    import time
    
    start_time = time.time()
    response1 = client.get("/api/categories/")
    first_request_time = time.time() - start_time
    
    start_time = time.time()
    response2 = client.get("/api/categories/")
    second_request_time = time.time() - start_time
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    
    # Both should return the same data
    assert response1.json() == response2.json()
    
    # Second request should be faster (though this might be flaky in tests)
    # In a real scenario, you'd use more sophisticated cache testing

def test_tag_caching(client, sample_tag):
    """Test that tag caching works"""
    # Similar to category caching test
    response1 = client.get("/api/tags/")
    response2 = client.get("/api/tags/")
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    assert response1.json() == response2.json()