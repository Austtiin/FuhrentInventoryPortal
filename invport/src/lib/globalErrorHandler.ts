/**
 * Global Error Handler for catching unhandled JSON parsing errors
 * and other runtime issues that might affect the application
 */

export function initializeErrorHandlers() {
  // Only run on client side
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global Error Handler] Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise
    });

    // Check if it's a JSON parsing error
    if (event.reason instanceof SyntaxError && 
        event.reason.message.includes('JSON')) {
      console.warn('[Global Error Handler] JSON parsing error caught and handled');
      // Prevent the error from bubbling up
      event.preventDefault();
    }

    // Check for the specific "[object Object]" error
    if (event.reason instanceof SyntaxError && 
        event.reason.message.includes('[object Object]')) {
      console.warn('[Global Error Handler] Object serialization error caught and handled');
      // Prevent the error from bubbling up
      event.preventDefault();
    }
  });

  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('[Global Error Handler] JavaScript error:', {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error
    });

    // Check if it's a JSON parsing error
    if (event.message.includes('JSON') || 
        event.message.includes('[object Object]')) {
      console.warn('[Global Error Handler] Potential storage/JSON error caught');
    }
  });

  // Override JSON.parse globally to add safety (development only)
  if (process.env.NODE_ENV === 'development') {
    const originalJSONParse = JSON.parse;
    JSON.parse = function(text: string, reviver?: (key: string, value: unknown) => unknown) {
      try {
        // Check for the problematic "[object Object]" string
        if (text === '[object Object]') {
          console.error('[JSON.parse Override] Attempted to parse "[object Object]" - this usually means an object was not properly stringified');
          throw new SyntaxError('Cannot parse "[object Object]" - object was not properly stringified');
        }
        
        return originalJSONParse.call(this, text, reviver);
      } catch (error) {
        console.error('[JSON.parse Override] Parse error:', {
          text: typeof text === 'string' ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : text,
          textType: typeof text,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };
  }

  console.log('[Global Error Handler] Error handlers initialized');
}

/**
 * Safe wrapper for JSON operations that might fail
 */
export function safeJSONOperation<T>(
  operation: () => T,
  fallback: T,
  context?: string
): T {
  try {
    return operation();
  } catch (error) {
    console.error(`[Safe JSON Operation] Failed${context ? ` in ${context}` : ''}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback
    });
    return fallback;
  }
}