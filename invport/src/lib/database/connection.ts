// Azure SQL Database connection for server-side environments only
// This file will only work in Node.js environments, not in the browser

let sql: typeof import('mssql') | null = null;

// Dynamically import mssql only in server environment
async function getMssql() {
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are only available on the server side');
  }
  
  if (!sql) {
    sql = await import('mssql');
  }
  return sql;
}

// Azure SQL Database connection configuration following Azure best practices
const getConfig = (): import('mssql').config | string => {
  // Priority order for connection strings:
  // 1. SQL_CONN_STRING - Azure Static Web App environment variable (Production)
  // 2. AZURE_SQL_CONNECTION_STRING - Local development
  // 3. AZURE_ADMIN_SQL_CONN_STRING - Alternative/legacy
  const connectionString = 
    process.env.SQL_CONN_STRING || 
    process.env.AZURE_SQL_CONNECTION_STRING || 
    process.env.AZURE_ADMIN_SQL_CONN_STRING;
  
  if (connectionString) {
    console.log('🔐 Using connection string for database configuration');
    return connectionString;
  }
  
  // Fallback to individual environment variables for local development
  console.log('🔧 Using individual environment variables for database configuration');
  return {
    server: process.env.DB_HOST || 'flatt-db-server.database.windows.net',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME || 'flatt-inv-sql',
    user: process.env.DB_USER || 'admin_panel',
    password: process.env.DB_PASSWORD || 'Jumping11!',
    options: {
      encrypt: true, // Required for Azure SQL Database
      trustServerCertificate: false, // Security best practice
      enableArithAbort: true,
      requestTimeout: 30000,
      connectTimeout: 30000,
    },
    pool: {
      max: 10, // Maximum number of connections in pool
      min: 2,  // Minimum number of connections kept alive (warm pool)
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      acquireTimeoutMillis: 15000, // Maximum time to wait for a connection from the pool
    },
  };
};

// Global connection pool instance
let pool: import('mssql').ConnectionPool | null = null;

// Connection failure tracking for circuit breaker pattern
let consecutiveFailures = 0;
let lastFailureTime = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5; // After 5 consecutive failures
const CIRCUIT_BREAKER_TIMEOUT = 60000; // Wait 60 seconds before trying again

/**
 * Get database connection pool with retry logic and circuit breaker
 * Implements connection pooling as per Azure best practices
 */
export async function getConnection(): Promise<import('mssql').ConnectionPool> {
  if (typeof window !== 'undefined') {
    throw new Error('Database connections are only available on the server side');
  }

  // Circuit breaker: If too many consecutive failures, pause attempts
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    const timeSinceLastFailure = Date.now() - lastFailureTime;
    if (timeSinceLastFailure < CIRCUIT_BREAKER_TIMEOUT) {
      const waitTime = Math.ceil((CIRCUIT_BREAKER_TIMEOUT - timeSinceLastFailure) / 1000);
      throw new Error(`⏸️ Database connection circuit breaker active. Too many consecutive failures (${consecutiveFailures}). Please wait ${waitTime} seconds before retrying.`);
    } else {
      // Reset after timeout period
      console.log('🔄 Circuit breaker timeout expired, resetting failure count...');
      consecutiveFailures = 0;
    }
  }

  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const mssql = await getMssql();
      
      if (!pool || !pool.connected) {
        if (pool) {
          // Clean up any existing broken connection
          try {
            await pool.close();
          } catch (closeError) {
            console.warn('⚠️ Error closing existing pool:', closeError);
          }
          pool = null;
        }

        console.log(`🔄 Initializing Azure SQL Database connection (attempt ${attempt}/${maxRetries})...`);
        
        const config = getConfig();
        // TypeScript requires explicit handling of union types for ConnectionPool constructor
        if (typeof config === 'string') {
          pool = new mssql.ConnectionPool(config);
        } else {
          pool = new mssql.ConnectionPool(config);
        }
        
        // Add error handlers
        pool.on('error', (err) => {
          console.error('❌ Database pool error:', err);
          pool = null; // Reset pool on error
        });

        // Connect with timeout (reduced to 10 seconds)
        await Promise.race([
          pool.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
          )
        ]);
        
        console.log('✅ Connected to Azure SQL Database successfully');
        // Reset failure count on successful connection
        consecutiveFailures = 0;
      }
      
      return pool;
    } catch (error) {
      console.error(`❌ Connection attempt ${attempt}/${maxRetries} failed:`, error);
      pool = null; // Reset pool on connection failure
      consecutiveFailures++;
      lastFailureTime = Date.now();
      
      if (attempt === maxRetries) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${errorMsg}. Total consecutive failures: ${consecutiveFailures}`);
      }
      
      // Wait before retrying with exponential backoff
      if (attempt < maxRetries) {
        const backoffDelay = retryDelay * attempt;
        console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw new Error('Failed to establish database connection');
}

/**
 * Test database connection health
 * Used for status monitoring and health checks
 */
export async function testConnection(): Promise<{ success: boolean; error?: string; latency?: number }> {
  if (typeof window !== 'undefined') {
    return {
      success: false,
      error: 'Database operations are only available on the server side'
    };
  }

  const startTime = Date.now();
  
  try {
    const connection = await getConnection();
    
    // Execute a simple health check query
    const result = await connection.request().query('SELECT 1 as HealthCheck, GETDATE() as ServerTime');
    
    const latency = Date.now() - startTime;
    
    if (result.recordset && result.recordset.length > 0) {
      console.log('✅ Database health check passed', { latency: `${latency}ms` });
      return {
        success: true,
        latency,
      };
    } else {
      return {
        success: false,
        error: 'Health check query returned no results',
      };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('❌ Database health check failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      latency,
    };
  }
}

/**
 * Execute parameterized query safely
 * Prevents SQL injection by using parameterized queries
 */
export async function executeQuery<T = Record<string, unknown>>(
  query: string,
  parameters?: { [key: string]: string | number | boolean | Date | null }
): Promise<{ success: boolean; data?: T[]; error?: string; recordCount?: number }> {
  if (typeof window !== 'undefined') {
    return {
      success: false,
      error: 'Database operations are only available on the server side'
    };
  }

  try {
    const connection = await getConnection();
    const request = connection.request();

    // Add parameters to prevent SQL injection
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    console.log('📊 Executing query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
    
    const result = await request.query(query);
    
    return {
      success: true,
      data: result.recordset || [],
      recordCount: result.recordset ? result.recordset.length : result.rowsAffected[0] || 0,
    };
  } catch (error) {
    console.error('❌ Query execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query execution failed',
    };
  }
}

/**
 * Execute scalar query (returns single value)
 * Useful for COUNT queries and single value results
 */
export async function executeScalar<T = string | number>(
  query: string,
  parameters?: { [key: string]: string | number | boolean | Date | null }
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (typeof window !== 'undefined') {
    return {
      success: false,
      error: 'Database operations are only available on the server side'
    };
  }

  try {
    const result = await executeQuery<Record<string, unknown>>(query, parameters);
    
    if (result.success && result.data && result.data.length > 0) {
      const firstRow = result.data[0];
      const firstValue = Object.values(firstRow)[0] as T;
      
      return {
        success: true,
        data: firstValue,
      };
    }
    
    return {
      success: false,
      error: 'No data returned from scalar query',
    };
  } catch (error) {
    console.error('❌ Scalar query execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Scalar query execution failed',
    };
  }
}

/**
 * Close database connection pool
 * Clean up resources when shutting down
 */
export async function closeConnection(): Promise<void> {
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('🔌 Database connection pool closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

/**
 * Get connection pool status
 * Returns information about the current connection pool
 */
export function getPoolStatus(): {
  isConnected: boolean;
  connecting: boolean;
  healthy: boolean;
} {
  if (typeof window !== 'undefined') {
    return {
      isConnected: false,
      connecting: false,
      healthy: false,
    };
  }

  if (!pool) {
    return {
      isConnected: false,
      connecting: false,
      healthy: false,
    };
  }

  return {
    isConnected: pool.connected,
    connecting: pool.connecting,
    healthy: pool.healthy,
  };
}

/**
 * Get detailed connection pool statistics
 * Useful for monitoring and debugging connection pooling
 */
export function getPoolStats(): {
  exists: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isHealthy: boolean;
  consecutiveFailures: number;
  circuitBreakerActive: boolean;
  secondsUntilReset?: number;
} {
  if (typeof window !== 'undefined') {
    return {
      exists: false,
      isConnected: false,
      isConnecting: false,
      isHealthy: false,
      consecutiveFailures: 0,
      circuitBreakerActive: false,
    };
  }

  const circuitBreakerActive = consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD;
  let secondsUntilReset: number | undefined;

  if (circuitBreakerActive) {
    const timeSinceLastFailure = Date.now() - lastFailureTime;
    const timeRemaining = CIRCUIT_BREAKER_TIMEOUT - timeSinceLastFailure;
    if (timeRemaining > 0) {
      secondsUntilReset = Math.ceil(timeRemaining / 1000);
    }
  }

  return {
    exists: pool !== null,
    isConnected: pool?.connected || false,
    isConnecting: pool?.connecting || false,
    isHealthy: pool?.healthy || false,
    consecutiveFailures,
    circuitBreakerActive,
    secondsUntilReset,
  };
}

/**
 * Reset the circuit breaker manually
 * Use this for administrative purposes or after resolving connectivity issues
 */
export function resetCircuitBreaker(): void {
  if (typeof window !== 'undefined') {
    return;
  }

  console.log('🔄 Manually resetting circuit breaker...');
  consecutiveFailures = 0;
  lastFailureTime = 0;
  console.log('✅ Circuit breaker reset complete');
}

/**
 * Log current pool statistics to console
 * Useful for debugging and monitoring
 */
export function logPoolStats(): void {
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Pool stats not available on client side');
    return;
  }

  const stats = getPoolStats();
  console.log('📊 Connection Pool Statistics:', {
    'Pool Exists': stats.exists,
    'Connected': stats.isConnected,
    'Connecting': stats.isConnecting,
    'Healthy': stats.isHealthy,
    'Consecutive Failures': stats.consecutiveFailures,
    'Circuit Breaker Active': stats.circuitBreakerActive,
    'Seconds Until Reset': stats.secondsUntilReset || 'N/A',
  });
}