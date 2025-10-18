/**
 * Safe JSON Parsing Utilities
 * 
 * Provides safe wrappers for JSON operations with proper error handling
 */

/**
 * Safely parse JSON string with fallback
 * @param jsonString - String to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T = unknown>(jsonString: string, fallback: T | null = null): T | null {
  try {
    // Check if string is empty
    if (!jsonString || jsonString.trim() === '') {
      console.warn('[JSON Parse] Empty string provided');
      return fallback;
    }
    
    // Check if it's already an object
    if (typeof jsonString === 'object') {
      console.warn('[JSON Parse] Already an object, returning as-is');
      return jsonString as T;
    }
    
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('[JSON Parse] Failed to parse JSON:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input: jsonString?.substring(0, 100) + (jsonString?.length > 100 ? '...' : ''),
      inputType: typeof jsonString
    });
    return fallback;
  }
}

/**
 * Safely parse Response.json() with better error handling
 * @param response - Fetch Response object
 * @returns Parsed JSON or throws descriptive error
 */
export async function safeResponseJson<T = unknown>(response: Response): Promise<T> {
  try {
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(
        `Response is not JSON (Content-Type: ${contentType || 'none'}). ` +
        `Body: ${text.substring(0, 200)}`
      );
    }
    
    // Get response text first
    const text = await response.text();
    
    // Check if empty
    if (!text || text.trim() === '') {
      throw new Error('Response body is empty');
    }
    
    // Try to parse
    try {
      return JSON.parse(text) as T;
    } catch (parseError) {
      throw new Error(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. ` +
        `Body preview: ${text.substring(0, 200)}`
      );
    }
  } catch (error) {
    console.error('[Response JSON] Failed to parse response:', {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Safely stringify JSON with error handling
 * @param data - Data to stringify
 * @param fallback - Fallback value if stringification fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify(data: unknown, fallback = '{}'): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('[JSON Stringify] Failed to stringify data:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      dataType: typeof data
    });
    return fallback;
  }
}

/**
 * Check if a string is valid JSON
 * @param str - String to check
 * @returns True if valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
