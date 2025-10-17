const sql = require('mssql');

// Circuit breaker state
const circuitBreaker = {
  failures: 0,
  threshold: 5,
  timeout: 60000,
  nextAttempt: Date.now(),
  isOpen: false
};

// Connection pool (reused across invocations)
let pool = null;

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

    // Create new pool
    pool = await sql.connect(connectionString);
    
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

module.exports = async function (context, req) {
  const startTime = Date.now();
  
  try {
    context.log('🔄 Azure Function: Starting inventory fetch...');
    
    // Get pagination parameters
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const offset = (page - 1) * limit;
    
    // Get database connection
    const connection = await getConnection();
    
    // Get total count
    const countResult = await connection.request()
      .query('SELECT COUNT(*) as total FROM dbo.Units');
    
    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated data
    const result = await connection.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          UnitID,
          VIN,
          Make,
          Model,
          Year,
          Price,
          Status,
          Description,
          TypeID,
          CreatedAt,
          UpdatedAt,
          StockNo,
          Condition,
          Category,
          WidthCategory,
          SizeCategory
        FROM dbo.Units 
        ORDER BY UnitID DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
    
    const duration = Date.now() - startTime;
    context.log(`✅ Azure Function: Successfully fetched ${result.recordset.length} vehicles in ${duration}ms`);
    
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: {
        success: true,
        vehicles: result.recordset,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        duration: `${duration}ms`
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    context.log.error('❌ Azure Function: Error fetching inventory:', error);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        error: error.message,
        duration: `${duration}ms`,
        circuitBreaker: {
          isOpen: circuitBreaker.isOpen,
          failures: circuitBreaker.failures,
          nextAttempt: circuitBreaker.isOpen ? new Date(circuitBreaker.nextAttempt).toISOString() : null
        }
      }
    };
  }
};
