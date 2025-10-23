/**
 * Get the appropriate API base URL based on environment
 * Development: http://localhost:7071/api (Azure Functions)
 * Production: /api (Next.js API routes)
 */
export function getApiBaseUrl(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return process.env.AZURE_FUNCTIONS_URL || 'http://localhost:7071/api';
  }
  
  return '/api';
}

/**
 * Make a request to the Azure Functions API or Next.js API
 */
export async function callExternalApi(endpoint: string, options?: RequestInit): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development, call Azure Functions
  if (isDevelopment) {
    const url = `${baseUrl}/${endpoint.replace(/^\//, '')}`;
    console.log(`🔗 Calling Azure Functions: ${url}`);
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }
  
  // In production, this would be handled differently
  // For now, return a 501 Not Implemented response
  return new Response(JSON.stringify({
    error: true,
    message: 'Production API integration not yet implemented',
    endpoint,
    timestamp: new Date().toISOString()
  }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}