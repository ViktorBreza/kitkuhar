// API Configuration - use environment variable or default to empty string (nginx handles /api prefix)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `/api/auth/login`,
  AUTH_REGISTER: `/api/auth/register`,
  AUTH_ME: `/api/auth/me`,
  
  // Recipes  
  RECIPES: `/api/recipes`,
  RECIPE_DELETE: (id: number) => `/api/recipes/${id}`,
  
  // Categories - add trailing slash to match backend routing
  CATEGORIES: `/api/categories/`,
  
  // Tags - add trailing slash to match backend routing
  TAGS: `/api/tags/`,
  
  // Media
  MEDIA_UPLOAD: `/api/media`,
  
  // Ratings
  RATINGS: `/api/ratings`,
  
  // Comments
  COMMENTS: `/api/comments`,
};