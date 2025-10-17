const sql = require('mssql');

// Circuit breaker state (shared across all functions)
const circuitBreaker = {
  failures: 0,
  threshold: 5,
  timeout: 60000,
  nextAttempt: Date.now(),
  isOpen: false
};

// Connection pool (reused across invocations for performance)
let pool = null;

/**
 * Get or create database connection pool
 */
async function getConnection() {
  // Check circuit breaker
  if (circuitBreaker.isOpen) {
    if (Date.now() < circuitBreaker.nextAttempt) {
      throw new Error(`Circuit breaker open. Retry after ${new Date(circuitBreaker.nextAttempt).toISOString()}`);
    }
    // Try to reset
    circuitBreaker.isOpen = false;
    circuitBreaker.failures = 0;
  }

  try {
    // Reuse existing pool if available
    if (pool && pool.connected) {
      return pool;
    }

    // Get connection string from environment
    const connectionString = process.env.SQL_CONN_STRING || 
                            process.env.AZURE_SQL_CONNECTION_STRING ||
                            process.env.AZURE_ADMIN_SQL_CONN_STRING;

    if (!connectionString) {
      throw new Error('No SQL connection string found in environment variables');
    }

    // Create new pool with optimized settings
    const config = {
      connectionString: connectionString,
      options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 15000,
        requestTimeout: 30000
      },
      pool: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000
      }
    };

    pool = await sql.connect(config);
    
    // Reset circuit breaker on success
    circuitBreaker.failures = 0;
    
    return pool;
  } catch (error) {
    // Increment circuit breaker
    circuitBreaker.failures++;
    
    if (circuitBreaker.failures >= circuitBreaker.threshold) {
      circuitBreaker.isOpen = true;
      circuitBreaker.nextAttempt = Date.now() + circuitBreaker.timeout;
    }
    
    throw error;
  }
}

/**
 * Execute a SQL query with automatic parameter binding
 */
async function executeQuery(query, parameters = {}) {
  try {
    const connection = await getConnection();
    const request = connection.request();
    
    // Bind parameters
    for (const [key, value] of Object.entries(parameters)) {
      request.input(key, value);
    }
    
    const result = await request.query(query);
    return { success: true, data: result.recordset };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get circuit breaker status
 */
function getCircuitBreakerStatus() {
  return {
    isOpen: circuitBreaker.isOpen,
    failures: circuitBreaker.failures,
    nextAttempt: circuitBreaker.isOpen ? new Date(circuitBreaker.nextAttempt).toISOString() : null
  };
}

module.exports = {
  getConnection,
  executeQuery,
  getCircuitBreakerStatus,
  sql
};
