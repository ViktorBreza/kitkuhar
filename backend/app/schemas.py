from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Union, Any
from datetime import datetime

# -------------------------------
# Categories and tags
# -------------------------------
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

# -------------------------------
# Ingredient structure
# -------------------------------
class Ingredient(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Ingredient name")
    quantity: float = Field(..., gt=0, description="Quantity must be positive")
    unit: str = Field(..., min_length=1, max_length=20, description="Unit of measurement")

# -------------------------------
# Media for steps
# -------------------------------
class StepMedia(BaseModel):
    id: Optional[str] = None
    type: str  # 'image' or 'video'
    filename: str
    url: str
    alt: Optional[str] = None

# -------------------------------
# Cooking step
# -------------------------------
class CookingStep(BaseModel):
    id: Optional[str] = None
    stepNumber: int
    description: str
    media: Optional[List[StepMedia]] = []

# -------------------------------
# Recipes
# -------------------------------
class RecipeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Recipe title")
    description: Optional[str] = Field(None, max_length=1000, description="Recipe description")
    ingredients: List[Ingredient] = Field(..., min_items=1, description="List of ingredients")
    steps: Union[str, List[CookingStep]] = Field(..., description="Cooking steps")
    servings: int = Field(..., gt=0, le=50, description="Number of servings")
    category_id: int = Field(..., gt=0, description="Category ID must be positive")
    tags: Optional[List[int]] = Field(default=[], description="List of tag IDs")
    
    @validator('tags')
    def validate_tags(cls, v):
        if v and any(
            (isinstance(tag, int) and tag <= 0) or 
            (hasattr(tag, 'id') and tag.id <= 0) 
            for tag in v
        ):
            raise ValueError('All tag IDs must be positive')
        return v

class RecipeCreate(RecipeBase):
    pass

# -------------------------------
# Users and authentication
# -------------------------------
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

# -------------------------------
# Ratings and comments
# -------------------------------
class RatingBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")

class RatingCreate(BaseModel):
    recipe_id: int = Field(..., gt=0, description="Recipe ID must be positive")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    session_id: Optional[str] = Field(None, min_length=1, max_length=100, description="Session ID for anonymous users")

class Rating(RatingBase):
    id: int
    recipe_id: int
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[User] = None

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="Comment content")
    author_name: str = Field(..., min_length=1, max_length=50, description="Author name")

class CommentCreate(CommentBase):
    recipe_id: int = Field(..., gt=0, description="Recipe ID must be positive")
    session_id: Optional[str] = Field(None, min_length=1, max_length=100, description="Session ID for anonymous users")

class Comment(CommentBase):
    id: int
    recipe_id: int
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[User] = None

    class Config:
        from_attributes = True

class RecipeStats(BaseModel):
    average_rating: Optional[float] = None
    total_ratings: int = 0
    total_comments: int = 0

# -------------------------------
# Updated recipe schemas
# -------------------------------
class Recipe(RecipeBase):
    id: int
    category: Optional[Category] = None
    tags: List[Tag] = []
    author: Optional[User] = None
    ratings: List[Rating] = []
    comments: List[Comment] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
