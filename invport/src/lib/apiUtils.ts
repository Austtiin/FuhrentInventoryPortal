/**
 * Get the appropriate API base URL based on environment
 * Development: http://localhost:7071/api (Local Azure Functions)
 * Production: /api (Azure Static Web Apps managed functions)
 */
export function getApiBaseUrl(): string {
  // Check if running in browser
  if (typeof window !== 'undefined') {
    // Browser environment
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      return process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071/api';
    }
    
    // In production, Azure Static Web Apps serves functions at /api
    return '/api';
  }
  
  // Server-side (during build) - use production path
  return '/api';
}

/**
 * Make a request to Azure Functions API
 * Works in both development (local functions) and production (Azure managed functions)
 */
export async function callExternalApi(endpoint: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/${endpoint.replace(/^\//, '')}`;
  
  // Log only in development
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log(`🔗 Calling Azure Functions: ${url}`);
  }
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

