// ============================================================================
// API CONFIGURATION - CRITICAL: DO NOT MODIFY WITHOUT UNDERSTANDING FLOW
// ============================================================================
// 
// IMPORTANT: This configuration works with Next.js rewrites in next.config.js
// Flow: Frontend -> Next.js rewrite -> Backend
// 
// API_BASE_URL should be EMPTY STRING for development to use Next.js proxy
// - Frontend makes request to: /api/recipes/
// - Next.js rewrite forwards to: http://localhost:8000/api/recipes/
// - If API_BASE_URL is set to backend URL, it bypasses proxy and causes CORS
//
// For production, set NEXT_PUBLIC_API_URL environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ============================================================================
// API ENDPOINTS - All paths start with /api/ for Next.js rewrite matching
// ============================================================================
// 
// CRITICAL: All endpoints MUST start with /api/ to match the rewrite rule
// Next.js config rewrites /api/:path* to backend/api/:path*
// Trailing slashes are IMPORTANT for some endpoints to avoid redirects
//
export const API_ENDPOINTS = {
  // Auth 
  AUTH_LOGIN: `/api/auth/login`,
  AUTH_REGISTER: `/api/auth/register`,
  AUTH_ME: `/api/auth/me`,
  
  // ========================================================================
  // RECIPES - Main recipe CRUD operations with structured steps
  // ========================================================================
  RECIPES: `/api/recipes/`,  // GET: list all recipes, POST: create new recipe
  RECIPE_DELETE: (id: number) => `/api/recipes/${id}`,  // DELETE: remove recipe by ID
  // Individual recipe endpoint: /api/recipes/:id (GET) - handled by dynamic route
  
  // ========================================================================
  // ADMIN RECIPES - Administrative recipe management
  // ========================================================================
  ADMIN_RECIPES: `/api/recipes/admin/?v=2`,  // GET: admin view of recipes - force cache refresh
  ADMIN_RECIPE_DELETE: (id: number) => `/api/recipes/admin/${id}/`,  // Admin delete
  ADMIN_RECIPE_UPDATE: (id: number) => `/api/recipes/admin/${id}/`,  // Admin update
  
  // ========================================================================
  // CATEGORIES & TAGS - Recipe classification system
  // ========================================================================
  CATEGORIES: `/api/categories`,  // GET: list all categories for dropdowns
  TAGS: `/api/tags`,  // GET: list all tags for multi-select
  
  // ========================================================================
  // MEDIA UPLOADS - File handling for recipe step images/videos
  // ========================================================================
  // IMPORTANT: These handle media for structured recipe steps
  // Backend automatically resizes images to 800x600 maintaining aspect ratio
  MEDIA_UPLOAD: `/api/media/upload-step-file`,  // POST: single file upload
  MEDIA_UPLOAD_MULTIPLE: `/api/media/upload-step-files`,  // POST: multiple files
  MEDIA_DELETE: `/api/media/delete-step-file`,  // DELETE: remove media file
  
  // ========================================================================
  // RATINGS & COMMENTS - User interaction features
  // ========================================================================
  RATINGS: `/api/ratings`,  // GET/POST: recipe ratings
  COMMENTS: `/api/comments`,  // GET/POST: recipe comments
};