// ============================================================================
// API CLIENT - CRITICAL: Centralized HTTP client for all API calls
// ============================================================================
//
// IMPORTANT: This client is configured to work with Next.js rewrites
// 
// Key design decisions:
// 1. baseURL = '' (empty) to use relative URLs that trigger Next.js rewrites
// 2. DO NOT set baseURL to backend URL - this bypasses proxy and causes CORS
// 3. All requests go through Next.js proxy: /api/* -> http://localhost:8000/api/*
// 4. Automatic JWT token handling from localStorage
// 5. Comprehensive error handling and logging
//
import { logger } from '@/utils/logger';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

// ============================================================================
// HTTP CLIENT CLASS - Handles all API communication
// ============================================================================
class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  // CRITICAL: baseURL must be empty string for Next.js proxy to work
  // Setting it to backend URL will bypass proxy and cause CORS errors
  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    
    // Add authorization token if exists (only in browser)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = {
      ...this.defaultHeaders,
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    const startTime = Date.now();
    
    try {
      logger.logApiCall(method, endpoint);
      
      const response = await fetch(url, requestOptions);
      const duration = Date.now() - startTime;
      
      // Log slow requests
      if (duration > 2000) {
        logger.warn(`Slow API call: ${method} ${endpoint} took ${duration}ms`);
      }
      
      let data: T | undefined;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const errorMessage = (data as any)?.detail || `HTTP ${response.status}`;
        logger.logApiCall(method, endpoint, response.status, new Error(errorMessage));
        
        return {
          error: errorMessage,
          status: response.status,
          data,
        };
      }

      logger.debug(`API call successful: ${method} ${endpoint}`, {
        data: {
          status: response.status,
          duration
        }
      });

      return {
        data,
        status: response.status,
      };

    } catch (error) {
      logger.logApiCall(method, endpoint, 0, error as Error);
      
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Special method for file uploads
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;