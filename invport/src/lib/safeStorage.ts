/**
 * Safe Storage Utilities
 * 
 * Provides safe wrappers for localStorage/sessionStorage operations with proper error handling
 * and JSON serialization to prevent "[object Object]" errors
 */

/**
 * Safe localStorage operations
 */
export const safeLocalStorage = {
  /**
   * Get item from localStorage with safe JSON parsing
   */
  getItem<T = string>(key: string, defaultValue: T | null = null): T | null {
    try {
      if (typeof window === 'undefined') return defaultValue;
      
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // If item is a simple string (doesn't start with { or [), return as-is
      if (typeof defaultValue === 'string' && !item.startsWith('{') && !item.startsWith('[')) {
        return item as T;
      }
      
      // Try to parse as JSON
      try {
        return JSON.parse(item) as T;
      } catch {
        // If JSON parsing fails, return the string value
        return item as T;
      }
    } catch (error) {
      console.error('[SafeStorage] Failed to get localStorage item:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage with safe JSON stringification
   */
  setItem(key: string, value: unknown): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      let stringValue: string;
      
      if (typeof value === 'string') {
        stringValue = value;
      } else if (typeof value === 'object' && value !== null) {
        // Properly stringify objects
        stringValue = JSON.stringify(value);
      } else {
        // Convert other types to string
        stringValue = String(value);
      }
      
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error('[SafeStorage] Failed to set localStorage item:', {
        key,
        valueType: typeof value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[SafeStorage] Failed to remove localStorage item:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  },

  /**
   * Clear all localStorage
   */
  clear(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('[SafeStorage] Failed to clear localStorage:', error);
      return false;
    }
  }
};

/**
 * Safe sessionStorage operations
 */
export const safeSessionStorage = {
  /**
   * Get item from sessionStorage with safe JSON parsing
   */
  getItem<T = string>(key: string, defaultValue: T | null = null): T | null {
    try {
      if (typeof window === 'undefined') return defaultValue;
      
      const item = sessionStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // If item is a simple string (doesn't start with { or [), return as-is
      if (typeof defaultValue === 'string' && !item.startsWith('{') && !item.startsWith('[')) {
        return item as T;
      }
      
      // Try to parse as JSON
      try {
        return JSON.parse(item) as T;
      } catch {
        // If JSON parsing fails, return the string value
        return item as T;
      }
    } catch (error) {
      console.error('[SafeStorage] Failed to get sessionStorage item:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return defaultValue;
    }
  },

  /**
   * Set item in sessionStorage with safe JSON stringification
   */
  setItem(key: string, value: unknown): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      let stringValue: string;
      
      if (typeof value === 'string') {
        stringValue = value;
      } else if (typeof value === 'object' && value !== null) {
        // Properly stringify objects
        stringValue = JSON.stringify(value);
      } else {
        // Convert other types to string
        stringValue = String(value);
      }
      
      sessionStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error('[SafeStorage] Failed to set sessionStorage item:', {
        key,
        valueType: typeof value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  },

  /**
   * Remove item from sessionStorage
   */
  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[SafeStorage] Failed to remove sessionStorage item:', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  },

  /**
   * Clear all sessionStorage
   */
  clear(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('[SafeStorage] Failed to clear sessionStorage:', error);
      return false;
    }
  }
};