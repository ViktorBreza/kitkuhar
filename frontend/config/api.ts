// API Configuration - use environment variable or default to /api
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// API Endpoints - exactly as in stable version
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/auth/register`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  
  // Recipes - direct path without API_BASE_URL (as in stable)
  RECIPES: `/recipes/`,
  RECIPE_DELETE: (id: number) => `${API_BASE_URL}/recipes/${id}`,
  
  // Categories
  CATEGORIES: `${API_BASE_URL}/categories`,
  
  // Tags  
  TAGS: `${API_BASE_URL}/tags`,
  
  // Media
  MEDIA_UPLOAD: `${API_BASE_URL}/media`,
  
  // Ratings
  RATINGS: `${API_BASE_URL}/ratings`,
  
  // Comments
  COMMENTS: `${API_BASE_URL}/comments`,
};