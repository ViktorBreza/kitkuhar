// ============================================================================
// NEXT.JS CONFIGURATION - CRITICAL: API Proxy and Development Setup
// ============================================================================
//
// IMPORTANT: This configuration is ESSENTIAL for the API flow to work
// DO NOT MODIFY the rewrites without understanding the full request flow
//
/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for better development experience
  reactStrictMode: true,
  
  // ========================================================================
  // IMAGE CONFIGURATION - For recipe media handling
  // ========================================================================
  images: {
    domains: ['localhost', '127.0.0.1'],  // Allow images from local development
    unoptimized: true  // Disable Next.js image optimization for development
  },
  
  // ========================================================================
  // API REWRITES - CRITICAL: This enables frontend->backend communication
  // ========================================================================
  // 
  // FLOW EXPLANATION:
  // 1. Frontend makes request to: /api/recipes/
  // 2. Next.js rewrites to: http://localhost:8000/api/recipes/
  // 3. Backend receives request and responds
  // 4. Next.js proxies response back to frontend
  //
  // BENEFITS:
  // - Avoids CORS issues in development
  // - Single origin for frontend and API calls
  // - Transparent proxy - frontend doesn't know about backend URL
  //
  // CRITICAL: Destination MUST include /api/ prefix to match backend routes
  async rewrites() {
    return [
      {
        // Match any request starting with /api/
        source: '/api/:path*',
        // Forward to backend with /api/ prefix preserved
        // :path* captures everything after /api/ (e.g., recipes/, recipes/3, etc.)
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig