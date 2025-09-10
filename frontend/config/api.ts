// API Configuration - use environment variable or default to empty string (nginx handles /api prefix)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// API Endpoints - mixed approach: auth uses full paths, others relative to apiClient baseURL
export const API_ENDPOINTS = {
  // Auth - full paths for direct fetch usage
  AUTH_LOGIN: `/api/auth/login`,
  AUTH_REGISTER: `/api/auth/register`,
  AUTH_ME: `/api/auth/me`,
  
  // Other endpoints - relative to baseURL (apiClient adds /api prefix)
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