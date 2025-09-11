// User
export interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

// Categories and tags
export interface Tag {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

// Ingredient
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

// Media file for step
export interface StepMedia {
  id?: string;
  type: 'image' | 'video';
  filename: string;
  url: string;
  alt?: string;
}

// Cooking step
export interface CookingStep {
  id?: string;
  stepNumber: number;
  description: string;
  media?: StepMedia[];
}

// Rating
export interface Rating {
  id: number;
  recipe_id: number;
  user_id?: number;
  session_id?: string;
  rating: number;
  created_at: string;
  updated_at?: string;
  user?: User;
}

// Comment
export interface Comment {
  id: number;
  recipe_id: number;
  user_id?: number;
  session_id?: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user?: User;
}

// Recipe statistics
export interface RecipeStats {
  average_rating?: number | null;
  total_ratings: number;
  total_comments: number;
}

// Recipe
export interface Recipe {
  id: number;
  title: string;
  description: string | null;
  ingredients: Ingredient[];
  steps: CookingStep[]; // Now only structured steps
  servings: number;
  category: Category | null;
  tags: Tag[];
  ratings?: Rating[];
  comments?: Comment[];
}

// Recipe creation interface
export interface RecipeCreate {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: CookingStep[];
  servings: number;
  category_id: number;
  tags: number[];
}

// Creation requests
export interface RatingCreate {
  recipe_id: number;
  rating: number;
  session_id?: string;
}

export interface CommentCreate {
  recipe_id: number;
  author_name: string;
  content: string;
  session_id?: string;
}