/**
 * Get the appropriate API base URL based on environment
 * 
 * Development: http://localhost:7071/api (Local Azure Functions)
 * Production:  /api (Azure Static Web Apps routes to managed functions)
 */
export function getApiBaseUrl(): string {
  // Check if running in browser
  if (typeof window !== 'undefined') {
    // Browser environment
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      return 'http://localhost:7071/api';
    }
    
    // In production, use relative /api path
    // Azure Static Web Apps automatically routes to managed functions
    return '/api';
  }
  
  // Server-side (during build) - use production path
  return '/api';
}

/**
 * Make a request to Azure Functions API
 * 
 * Development: Calls local functions at http://localhost:7071/api
 * Production:  Uses relative /api path (Azure Static Web Apps handles routing)
 */
export async function callExternalApi(endpoint: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/${endpoint.replace(/^\//, '')}`;
  
  // Log only in development
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log(`🔗 Calling API: ${url}`);
  }
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

