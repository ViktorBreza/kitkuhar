from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app import crud, schemas, database, models
from app.auth import get_current_user_optional, get_current_active_user, get_current_admin_user
from app.logger import log_database_event, log_error

router = APIRouter(prefix="/api/recipes", tags=["recipes"])
get_db = database.get_db

# -------------------------------
# READ: recipes list with filtering
# -------------------------------
@router.get("/", response_model=List[schemas.Recipe])
def read_recipes(
    skip: int = 0,
    limit: int = 10,
    search: str = "",
    category_id: Optional[int] = None,
    tag_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns list of recipes.
    Can be filtered by name, category and tags.
    """
    return crud.get_recipes(db, skip, limit, search, category_id, tag_ids)

# -------------------------------
# CREATE: add new recipe
# -------------------------------
@router.post("/", response_model=schemas.Recipe)
def create_recipe(
    recipe: schemas.RecipeCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Creates new recipe with category and tags.
    """
    try:
        # Verify category exists
        category = crud.get_category_by_id(db, recipe.category_id)
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
        
        # Verify tags exist
        if recipe.tags:
            existing_tags = crud.get_tags(db)
            existing_tag_ids = {tag.id for tag in existing_tags}
            invalid_tags = set(recipe.tags) - existing_tag_ids
            if invalid_tags:
                raise HTTPException(status_code=400, detail=f"Tags not found: {invalid_tags}")
        
        author_id = current_user.id if current_user else None
        db_recipe = crud.create_recipe(db, recipe, author_id)
        log_database_event("create", "recipe", db_recipe.id)
        return db_recipe
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "create_recipe")
        raise HTTPException(status_code=500, detail="Failed to create recipe")

# -------------------------------
# READ: get recipe by id
# -------------------------------
@router.get("/{recipe_id}", response_model=schemas.Recipe)
def read_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = crud.get_recipe_by_id(db, recipe_id)
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

# -------------------------------
# UPDATE: update recipe
# -------------------------------
@router.put("/{recipe_id}", response_model=schemas.Recipe)
def update_recipe(
    recipe_id: int, 
    recipe: schemas.RecipeCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    try:
        # Get existing recipe to check ownership
        existing_recipe = crud.get_recipe_by_id(db, recipe_id)
        if not existing_recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Check if user can edit this recipe (author or admin)
        if current_user and existing_recipe.author_id:
            if existing_recipe.author_id != current_user.id and not current_user.is_admin:
                raise HTTPException(status_code=403, detail="Not authorized to edit this recipe")
        
        # Verify category exists
        category = crud.get_category_by_id(db, recipe.category_id)
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
        
        # Verify tags exist
        if recipe.tags:
            existing_tags = crud.get_tags(db)
            existing_tag_ids = {tag.id for tag in existing_tags}
            invalid_tags = set(recipe.tags) - existing_tag_ids
            if invalid_tags:
                raise HTTPException(status_code=400, detail=f"Tags not found: {invalid_tags}")
        
        user_id = current_user.id if current_user else None
        db_recipe = crud.update_recipe(db, recipe_id, recipe, user_id)
        if not db_recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        log_database_event("update", "recipe", recipe_id)
        return db_recipe
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "update_recipe")
        raise HTTPException(status_code=500, detail="Failed to update recipe")

# -------------------------------
# DELETE: delete recipe
# -------------------------------
@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    try:
        success = crud.delete_recipe(db, recipe_id)
        if not success:
            raise HTTPException(status_code=404, detail="Recipe not found")
        log_database_event("delete", "recipe", recipe_id)
        return {"detail": "Recipe deleted"}
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "delete_recipe")
        raise HTTPException(status_code=500, detail="Failed to delete recipe")

# -------------------------------
# ADMIN-ONLY ENDPOINTS
# -------------------------------

@router.post("/admin/", response_model=schemas.Recipe)
def admin_create_recipe(
    recipe: schemas.RecipeCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Admin-only: Creates new recipe with category and tags.
    """
    try:
        # Verify category exists
        category = crud.get_category_by_id(db, recipe.category_id)
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
        
        # Verify tags exist
        if recipe.tags:
            existing_tags = crud.get_tags(db)
            existing_tag_ids = {tag.id for tag in existing_tags}
            invalid_tags = set(recipe.tags) - existing_tag_ids
            if invalid_tags:
                raise HTTPException(status_code=400, detail=f"Tags not found: {invalid_tags}")
        
        db_recipe = crud.create_recipe(db, recipe, current_user.id)
        log_database_event("admin_create", "recipe", db_recipe.id)
        return db_recipe
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "admin_create_recipe")
        raise HTTPException(status_code=500, detail="Failed to create recipe")

@router.put("/admin/{recipe_id}", response_model=schemas.Recipe)
def admin_update_recipe(
    recipe_id: int, 
    recipe: schemas.RecipeCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Admin-only: Updates any recipe regardless of ownership.
    """
    try:
        # Verify category exists
        category = crud.get_category_by_id(db, recipe.category_id)
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
        
        # Verify tags exist
        if recipe.tags:
            existing_tags = crud.get_tags(db)
            existing_tag_ids = {tag.id for tag in existing_tags}
            invalid_tags = set(recipe.tags) - existing_tag_ids
            if invalid_tags:
                raise HTTPException(status_code=400, detail=f"Tags not found: {invalid_tags}")
        
        db_recipe = crud.update_recipe(db, recipe_id, recipe, current_user.id)
        if not db_recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        log_database_event("admin_update", "recipe", recipe_id)
        return db_recipe
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "admin_update_recipe")
        raise HTTPException(status_code=500, detail="Failed to update recipe")

@router.delete("/admin/{recipe_id}")
def admin_delete_recipe(
    recipe_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Admin-only: Deletes any recipe regardless of ownership.
    """
    try:
        success = crud.delete_recipe(db, recipe_id)
        if not success:
            raise HTTPException(status_code=404, detail="Recipe not found")
        log_database_event("admin_delete", "recipe", recipe_id)
        return {"detail": "Recipe deleted"}
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, "admin_delete_recipe")
        raise HTTPException(status_code=500, detail="Failed to delete recipe")

@router.get("/admin/", response_model=List[schemas.Recipe])
def admin_read_all_recipes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Admin-only: Gets all recipes with extended limit for management.
    """
    return crud.get_recipes(db, skip, limit)
