import pytest

def test_create_rating(client, sample_recipe):
    """Test creating a rating for a recipe"""
    rating_data = {
        "recipe_id": sample_recipe.id,
        "rating": 5,
        "session_id": "test_session_123"
    }
    
    response = client.post("/api/ratings/", json=rating_data)
    assert response.status_code == 200
    
    created_rating = response.json()
    assert created_rating["rating"] == 5
    assert created_rating["recipe_id"] == sample_recipe.id

def test_create_rating_with_auth(client, sample_recipe, auth_token):
    """Test creating a rating with authenticated user"""
    rating_data = {
        "recipe_id": sample_recipe.id,
        "rating": 4
    }
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/api/ratings/", json=rating_data, headers=headers)
    assert response.status_code == 200
    
    created_rating = response.json()
    assert created_rating["rating"] == 4
    assert created_rating["user_id"] is not None

def test_update_existing_rating(client, sample_recipe):
    """Test updating an existing rating"""
    session_id = "test_session_update"
    
    # Create initial rating
    rating_data = {
        "recipe_id": sample_recipe.id,
        "rating": 3,
        "session_id": session_id
    }
    response = client.post("/api/ratings/", json=rating_data)
    assert response.status_code == 200
    
    # Update the rating
    updated_rating_data = {
        "recipe_id": sample_recipe.id,
        "rating": 5,
        "session_id": session_id
    }
    response = client.post("/api/ratings/", json=updated_rating_data)
    assert response.status_code == 200
    
    updated_rating = response.json()
    assert updated_rating["rating"] == 5

def test_invalid_rating_values(client, sample_recipe):
    """Test validation of rating values"""
    # Rating too low
    invalid_data = {
        "recipe_id": sample_recipe.id,
        "rating": 0,  # Should be 1-5
        "session_id": "test_session"
    }
    response = client.post("/api/ratings/", json=invalid_data)
    assert response.status_code == 422
    
    # Rating too high
    invalid_data["rating"] = 6  # Should be 1-5
    response = client.post("/api/ratings/", json=invalid_data)
    assert response.status_code == 422

def test_get_recipe_stats(client, sample_recipe):
    """Test getting recipe statistics"""
    # First create some ratings
    ratings = [
        {"recipe_id": sample_recipe.id, "rating": 5, "session_id": "session1"},
        {"recipe_id": sample_recipe.id, "rating": 4, "session_id": "session2"},
        {"recipe_id": sample_recipe.id, "rating": 3, "session_id": "session3"}
    ]
    
    for rating_data in ratings:
        client.post("/api/ratings/", json=rating_data)
    
    # Get stats
    response = client.get(f"/api/ratings/{sample_recipe.id}/stats")
    assert response.status_code == 200
    
    stats = response.json()
    assert "average_rating" in stats
    assert "total_ratings" in stats
    assert stats["total_ratings"] >= 3
    assert stats["average_rating"] == 4.0  # (5+4+3)/3

def test_create_comment(client, sample_recipe):
    """Test creating a comment"""
    comment_data = {
        "recipe_id": sample_recipe.id,
        "author_name": "Anonymous User",
        "content": "This recipe is amazing!",
        "session_id": "test_comment_session"
    }
    
    response = client.post("/api/comments/", json=comment_data)
    assert response.status_code == 200
    
    created_comment = response.json()
    assert created_comment["content"] == comment_data["content"]
    assert created_comment["author_name"] == comment_data["author_name"]

def test_create_comment_with_auth(client, sample_recipe, auth_token, sample_user):
    """Test creating a comment with authenticated user"""
    comment_data = {
        "recipe_id": sample_recipe.id,
        "author_name": sample_user.username,
        "content": "Great recipe, I loved it!"
    }
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/api/comments/", json=comment_data, headers=headers)
    assert response.status_code == 200
    
    created_comment = response.json()
    assert created_comment["content"] == comment_data["content"]
    assert created_comment["user_id"] == sample_user.id

def test_get_recipe_comments(client, sample_recipe):
    """Test getting comments for a recipe"""
    # Create some comments
    comments = [
        {
            "recipe_id": sample_recipe.id,
            "author_name": "User 1",
            "content": "Comment 1",
            "session_id": "session1"
        },
        {
            "recipe_id": sample_recipe.id,
            "author_name": "User 2", 
            "content": "Comment 2",
            "session_id": "session2"
        }
    ]
    
    for comment_data in comments:
        client.post("/api/comments/", json=comment_data)
    
    # Get comments
    response = client.get(f"/api/comments/{sample_recipe.id}")
    assert response.status_code == 200
    
    recipe_comments = response.json()
    assert len(recipe_comments) >= 2

def test_comment_validation(client, sample_recipe):
    """Test comment validation"""
    # Empty content
    invalid_data = {
        "recipe_id": sample_recipe.id,
        "author_name": "Test User",
        "content": "",  # Empty content should fail
        "session_id": "test_session"
    }
    response = client.post("/api/comments/", json=invalid_data)
    assert response.status_code == 422
    
    # Empty author name
    invalid_data = {
        "recipe_id": sample_recipe.id,
        "author_name": "",  # Empty name should fail
        "content": "Test comment",
        "session_id": "test_session"
    }
    response = client.post("/api/comments/", json=invalid_data)
    assert response.status_code == 422
    
    # Content too long
    invalid_data = {
        "recipe_id": sample_recipe.id,
        "author_name": "Test User",
        "content": "x" * 1001,  # Too long content should fail
        "session_id": "test_session"
    }
    response = client.post("/api/comments/", json=invalid_data)
    assert response.status_code == 422

def test_update_comment(client, sample_recipe):
    """Test updating a comment"""
    session_id = "update_comment_session"
    
    # Create comment
    comment_data = {
        "recipe_id": sample_recipe.id,
        "author_name": "Test User",
        "content": "Original comment",
        "session_id": session_id
    }
    response = client.post("/api/comments/", json=comment_data)
    assert response.status_code == 200
    comment = response.json()
    
    # Update comment
    update_data = {"content": "Updated comment content"}
    response = client.put(f"/api/comments/{comment['id']}?session_id={session_id}", json=update_data)
    assert response.status_code == 200
    
    updated_comment = response.json()
    assert updated_comment["content"] == "Updated comment content"

def test_delete_comment(client, sample_recipe):
    """Test deleting a comment"""
    session_id = "delete_comment_session"
    
    # Create comment
    comment_data = {
        "recipe_id": sample_recipe.id,
        "author_name": "Test User",
        "content": "Comment to delete",
        "session_id": session_id
    }
    response = client.post("/api/comments/", json=comment_data)
    assert response.status_code == 200
    comment = response.json()
    
    # Delete comment
    response = client.delete(f"/api/comments/{comment['id']}?session_id={session_id}")
    assert response.status_code == 200

def test_anonymous_user_interactions(client, sample_recipe):
    """Test that anonymous users can interact with ratings and comments"""
    session_id = "anonymous_session_123"
    
    # Anonymous rating
    rating_data = {
        "recipe_id": sample_recipe.id,
        "rating": 4,
        "session_id": session_id
    }
    response = client.post("/api/ratings/", json=rating_data)
    assert response.status_code == 200
    
    # Anonymous comment
    comment_data = {
        "recipe_id": sample_recipe.id,
        "author_name": "Anonymous Foodie",
        "content": "Love this recipe!",
        "session_id": session_id
    }
    response = client.post("/api/comments/", json=comment_data)
    assert response.status_code == 200