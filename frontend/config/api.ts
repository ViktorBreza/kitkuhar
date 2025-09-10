// API Configuration - use environment variable or default to empty string (nginx handles /api prefix)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// API Endpoints - relative to baseURL (without /api prefix since apiClient adds it)
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `/auth/login`,
  AUTH_REGISTER: `/auth/register`,
  AUTH_ME: `/auth/me`,
  
  // Recipes  
  RECIPES: `/recipes`,
  RECIPE_DELETE: (id: number) => `/recipes/${id}`,
  
  // Categories - add trailing slash to match backend routing
  CATEGORIES: `/categories/`,
  
  // Tags - add trailing slash to match backend routing
  TAGS: `/tags/`,
  
  // Media
  MEDIA_UPLOAD: `/media`,
  
  // Ratings
  RATINGS: `/ratings`,
  
  // Comments
  COMMENTS: `/comments`,
};