/**
 * API Client Configuration
 * 
 * Handles API base URL switching between development and production:
 * - Development: http://localhost:7071/api (Azure Functions local)
 * - Production: /api (Azure Static Web App proxy)
 */

import { safeResponseJson, safeJsonParse } from './safeJson';

// Control debug output
const DEBUG_ENABLED = true; // Set to false to disable all debug logs
const DEBUG_RESPONSE_BODY = true; // Set to false to hide response body in logs

// Retry configuration
const DEFAULT_MAX_RETRIES = 3; // Default number of retry attempts
const DEFAULT_RETRY_DELAY = 1000; // Default delay between retries (ms)
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]; // Status codes that trigger retry

/**
 * Format console output with colors and styling
 */
const debugLog = {
  request: (method: string, url: string, body?: unknown) => {
    if (!DEBUG_ENABLED) return;
    
    console.group(`🚀 [API Request] ${method} ${url}`);
    console.log('%c⏰ Timestamp:', 'color: #888', new Date().toISOString());
    console.log('%c🌐 Full URL:', 'color: #2196F3', url);
    console.log('%c📤 Method:', 'color: #4CAF50', method);
    
    if (body) {
      console.log('%c📦 Request Body:', 'color: #FF9800');
      console.log(JSON.stringify(body, null, 2));
    }
    
    console.groupEnd();
  },
  
  response: (method: string, url: string, status: number, statusText: string, data?: unknown, duration?: number) => {
    if (!DEBUG_ENABLED) return;
    
    const isSuccess = status >= 200 && status < 300;
    const emoji = isSuccess ? '✅' : '❌';
    const color = isSuccess ? '#4CAF50' : '#F44336';
    
    console.group(`${emoji} [API Response] ${status} ${method} ${url}`);
    console.log('%c⏰ Timestamp:', 'color: #888', new Date().toISOString());
    console.log(`%c📊 Status:`, `color: ${color}; font-weight: bold`, `${status} ${statusText}`);
    
    if (duration !== undefined) {
      console.log('%c⚡ Duration:', 'color: #9C27B0', `${duration}ms`);
    }
    
    if (DEBUG_RESPONSE_BODY && data !== undefined) {
      console.log('%c📥 Response Data:', 'color: #00BCD4');
      console.log(data);
    }
    
    console.groupEnd();
  },
  
  error: (method: string, url: string, error: unknown) => {
    if (!DEBUG_ENABLED) return;
    
    console.group(`❌ [API Error] ${method} ${url}`);
    console.log('%c⏰ Timestamp:', 'color: #888', new Date().toISOString());
    console.log('%c🚨 Error:', 'color: #F44336; font-weight: bold', error);
    console.groupEnd();
  },
  
  retry: (attempt: number, maxRetries: number, url: string, delay: number) => {
    if (!DEBUG_ENABLED) return;
    
    console.log(
      `%c🔄 [API Retry] Attempt ${attempt}/${maxRetries} for ${url} (waiting ${delay}ms)`,
      'color: #FF9800; font-weight: bold'
    );
  }
};

/**
 * Get the API base URL based on environment
 * @returns Base URL for API calls
 * 
 * Azure Static Web Apps automatically routes /api/* to managed functions.
 * 
 * Development: http://localhost:7071/api (local Azure Functions)
 * Production:  /api (relative - Azure Static Web Apps handles routing)
 */
export function getApiBaseUrl(): string {
  // In development, use local Azure Functions Core Tools
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:7071/api';
  }
  
  // In production, use relative /api path
  // Azure Static Web Apps automatically routes this to managed functions
  return '/api';
}

/**
 * Build full API URL with base URL
 * @param endpoint - API endpoint (e.g., '/GrabInventoryAll' or 'GrabInventoryAll')
 * @returns Full API URL
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  
  // Remove leading slash from endpoint if present (we'll add it back)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure proper path joining
  // If baseUrl ends with /api, don't add another /api
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}/${cleanEndpoint}`;
  }
  
  // Otherwise, baseUrl should be /api
  return `${baseUrl}/${cleanEndpoint}`;
}

/**
 * Fetch wrapper that automatically uses correct API base URL with retry logic
 * @param endpoint - API endpoint (e.g., '/GrabInventoryAll')
 * @param options - Fetch options with optional retry configuration
 * @returns Fetch response
 */
export async function apiFetch(
  endpoint: string, 
  options?: RequestInit & { 
    maxRetries?: number; 
    retryDelay?: number;
    skipRetry?: boolean;
  }
): Promise<Response> {
  const url = buildApiUrl(endpoint);
  const method = options?.method || 'GET';
  const maxRetries = options?.skipRetry ? 0 : (options?.maxRetries ?? DEFAULT_MAX_RETRIES);
  const retryDelay = options?.retryDelay ?? DEFAULT_RETRY_DELAY;
  
  // Parse request body if present (safely)
  let requestBody: unknown = undefined;
  if (options?.body) {
    if (typeof options.body === 'string') {
      requestBody = safeJsonParse(options.body, options.body);
    } else {
      requestBody = options.body;
    }
  }
  
  // Log the request
  debugLog.request(method, url, requestBody);
  
  let lastError: Error | null = null;
  
  // Retry loop
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const startTime = performance.now();
      const response = await fetch(url, options);
      const duration = Math.round(performance.now() - startTime);
      
      // Clone response to read body for logging without consuming it
      const responseClone = response.clone();
      
      // Try to parse response as JSON for logging (safely)
      let responseData: unknown = undefined;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          responseData = await safeResponseJson(responseClone);
        }
      } catch {
        // If JSON parsing fails, skip logging response body
        responseData = '[Response body not JSON or failed to parse]';
      }
      
      // Log the response
      debugLog.response(
        method,
        url,
        response.status,
        response.statusText,
        responseData,
        duration
      );
      
      // Check if we should retry based on status code
      if (RETRY_STATUS_CODES.includes(response.status) && attempt < maxRetries) {
        debugLog.retry(attempt + 1, maxRetries, url, retryDelay);
        await sleep(retryDelay);
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // If this is not the last attempt, retry
      if (attempt < maxRetries) {
        debugLog.retry(attempt + 1, maxRetries, url, retryDelay);
        await sleep(retryDelay);
        continue;
      }
      
      // Last attempt failed, log and throw
      debugLog.error(method, url, error);
      throw error;
    }
  }
  
  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Type-safe API fetch with JSON response
 * @param endpoint - API endpoint
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function apiFetchJson<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch(endpoint, options);
  
  if (!response.ok) {
    const errorMessage = `API Error: ${response.status} ${response.statusText}`;
    
    // Try to get error details from response (safely)
    let errorDetails: unknown = undefined;
    try {
      errorDetails = await safeResponseJson(response);
    } catch {
      // If can't parse error response, use status text
      errorDetails = response.statusText;
    }
    
    if (DEBUG_ENABLED) {
      console.error('❌ API Error Details:', errorDetails);
    }
    
    throw new Error(errorMessage);
  }
  
  return safeResponseJson<T>(response);
}

// Export for debugging
export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  environment: process.env.NODE_ENV,
  isLocal: process.env.NEXT_PUBLIC_API_BASE_URL?.includes('localhost'),
} as const;

