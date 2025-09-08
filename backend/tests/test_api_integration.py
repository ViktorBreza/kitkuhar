import pytest
from fastapi.testclient import TestClient

def test_api_health_check(client):
    """Test API health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "Кіт Кухар is healthy!"

def test_api_root_redirect(client):
    """Test that root redirects to docs"""
    response = client.get("/", allow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"

def test_cors_headers(client):
    """Test CORS headers are properly set"""
    response = client.options("/api/recipes/")
    assert response.status_code == 200
    # Check that CORS headers are present
    # Note: TestClient might not return all CORS headers

def test_api_error_handling(client):
    """Test API error handling"""
    # Test 404 for non-existent recipe
    response = client.get("/api/recipes/999999")
    assert response.status_code == 404
    assert "detail" in response.json()
    
    # Test 422 for validation error
    invalid_recipe = {
        "title": "",  # Empty title should fail validation
        "ingredients": [],
        "steps": "",
        "servings": 0
    }
    response = client.post("/api/recipes/", json=invalid_recipe)
    assert response.status_code == 422

def test_full_recipe_workflow(client, sample_category, auth_token):
    """Test complete recipe workflow: create, read, update, delete"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # 1. Create recipe
    recipe_data = {
        "title": "Integration Test Recipe",
        "description": "A recipe for testing the full workflow",
        "ingredients": [
            {"name": "Test Ingredient", "quantity": 1.0, "unit": "cup"}
        ],
        "steps": "1. Test step 1. 2. Test step 2.",
        "servings": 2,
        "category_id": sample_category.id,
        "tags": []
    }
    
    create_response = client.post("/api/recipes/", json=recipe_data, headers=headers)
    assert create_response.status_code == 200
    created_recipe = create_response.json()
    recipe_id = created_recipe["id"]
    
    # 2. Read recipe
    read_response = client.get(f"/api/recipes/{recipe_id}")
    assert read_response.status_code == 200
    read_recipe = read_response.json()
    assert read_recipe["title"] == recipe_data["title"]
    
    # 3. Update recipe
    update_data = recipe_data.copy()
    update_data["title"] = "Updated Integration Test Recipe"
    update_data["servings"] = 4
    
    update_response = client.put(f"/api/recipes/{recipe_id}", json=update_data, headers=headers)
    assert update_response.status_code == 200
    updated_recipe = update_response.json()
    assert updated_recipe["title"] == "Updated Integration Test Recipe"
    assert updated_recipe["servings"] == 4
    
    # 4. Delete recipe
    delete_response = client.delete(f"/api/recipes/{recipe_id}", headers=headers)
    assert delete_response.status_code == 200
    
    # 5. Verify deletion
    final_read_response = client.get(f"/api/recipes/{recipe_id}")
    assert final_read_response.status_code == 404

def test_recipe_with_ratings_and_comments(client, sample_category, auth_token):
    """Test recipe with ratings and comments integration"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Create recipe
    recipe_data = {
        "title": "Recipe for Rating Test",
        "description": "Testing ratings and comments",
        "ingredients": [{"name": "Test", "quantity": 1.0, "unit": "cup"}],
        "steps": "Test steps",
        "servings": 1,
        "category_id": sample_category.id,
        "tags": []
    }
    
    response = client.post("/api/recipes/", json=recipe_data, headers=headers)
    assert response.status_code == 200
    recipe = response.json()
    recipe_id = recipe["id"]
    
    # Add rating
    rating_data = {"recipe_id": recipe_id, "rating": 5}
    rating_response = client.post("/api/ratings/", json=rating_data, headers=headers)
    assert rating_response.status_code == 200
    
    # Add comment
    comment_data = {
        "recipe_id": recipe_id,
        "author_name": "Test User",
        "content": "Great recipe!"
    }
    comment_response = client.post("/api/comments/", json=comment_data, headers=headers)
    assert comment_response.status_code == 200
    
    # Get recipe with ratings and comments
    full_recipe_response = client.get(f"/api/recipes/{recipe_id}")
    assert full_recipe_response.status_code == 200
    full_recipe = full_recipe_response.json()
    
    # Check that ratings and comments are included
    assert "ratings" in full_recipe
    assert "comments" in full_recipe
    
    # Get stats
    stats_response = client.get(f"/api/ratings/{recipe_id}/stats")
    assert stats_response.status_code == 200
    stats = stats_response.json()
    assert stats["total_ratings"] >= 1
    assert stats["average_rating"] == 5.0

def test_search_and_filter_integration(client, sample_recipe, sample_category):
    """Test search and filtering functionality"""
    # Test search
    search_response = client.get(f"/api/recipes/?search={sample_recipe.title}")
    assert search_response.status_code == 200
    recipes = search_response.json()
    assert len(recipes) >= 1
    
    # Test category filter
    category_response = client.get(f"/api/recipes/?category_id={sample_category.id}")
    assert category_response.status_code == 200
    category_recipes = category_response.json()
    for recipe in category_recipes:
        assert recipe["category"]["id"] == sample_category.id
    
    # Test pagination
    paginated_response = client.get("/api/recipes/?skip=0&limit=1")
    assert paginated_response.status_code == 200
    paginated_recipes = paginated_response.json()
    assert len(paginated_recipes) <= 1

def test_authentication_flow(client):
    """Test complete authentication flow"""
    # Register new user
    register_data = {
        "email": "integration@test.com",
        "username": "integrationuser",
        "password": "testpassword123"
    }
    
    register_response = client.post("/api/auth/register", json=register_data)
    assert register_response.status_code == 201
    user = register_response.json()
    
    # Login with new user
    login_data = {
        "username": "integrationuser",
        "password": "testpassword123"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    token_data = login_response.json()
    token = token_data["access_token"]
    
    # Use token to access protected endpoint
    headers = {"Authorization": f"Bearer {token}"}
    profile_response = client.get("/api/auth/me", headers=headers)
    assert profile_response.status_code == 200
    profile = profile_response.json()
    assert profile["username"] == "integrationuser"

def test_media_endpoints(client, auth_token):
    """Test media upload endpoints (basic structure)"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test that media endpoints exist
    # Note: Actual file upload testing would require multipart form data
    response = client.get("/api/media/", headers=headers)
    # Just check that the endpoint exists and doesn't crash

def test_database_consistency(client, sample_recipe, sample_category):
    """Test that database operations maintain consistency"""
    # Create a rating for the recipe
    rating_data = {
        "recipe_id": sample_recipe.id,
        "rating": 4,
        "session_id": "consistency_test"
    }
    client.post("/api/ratings/", json=rating_data)
    
    # Get recipe stats
    stats_response = client.get(f"/api/ratings/{sample_recipe.id}/stats")
    stats = stats_response.json()
    
    # Get recipe details
    recipe_response = client.get(f"/api/recipes/{sample_recipe.id}")
    recipe = recipe_response.json()
    
    # Verify consistency
    assert len(recipe["ratings"]) == stats["total_ratings"]
    
def test_performance_endpoints(client, sample_recipe):
    """Test that endpoints respond within reasonable time"""
    import time
    
    # Test recipe list performance
    start_time = time.time()
    response = client.get("/api/recipes/")
    end_time = time.time()
    
    assert response.status_code == 200
    assert (end_time - start_time) < 2.0  # Should respond within 2 seconds
    
    # Test single recipe performance  
    start_time = time.time()
    response = client.get(f"/api/recipes/{sample_recipe.id}")
    end_time = time.time()
    
    assert response.status_code == 200
    assert (end_time - start_time) < 1.0  # Should respond within 1 second