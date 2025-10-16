import { executeQuery, executeScalar, testConnection } from './connection';
import type { DatabaseResult, InventoryStats, Vehicle, DatabaseStatus } from '@/types/database';

/**
 * Get total inventory count from Azure SQL Database
 * Uses your exact SQL query: SELECT COUNT(*) AS TotalItems FROM dbo.Units;
 */
export async function getInventoryCount(): Promise<DatabaseResult<number>> {
  try {
    console.log('📊 Fetching total inventory count from dbo.Units...');
    
    // Your exact SQL query
    const result = await executeScalar<number>(
      'SELECT COUNT(*) AS TotalItems FROM dbo.Units'
    );

    if (result.success && result.data !== undefined) {
      console.log('✅ Total inventory count retrieved:', result.data);
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error || 'No data returned from inventory count query',
    };
  } catch (error) {
    console.error('❌ Failed to get inventory count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory count',
    };
  }
}

/**
 * Get total inventory value from Azure SQL Database
 * Uses your exact SQL query: SELECT SUM(price) AS TotalPrice FROM dbo.Units;
 */
export async function getInventoryValue(): Promise<DatabaseResult<number>> {
  try {
    console.log('💰 Calculating total inventory value from dbo.Units...');
    
    // Your exact SQL query
    const result = await executeScalar<number>(
      'SELECT ISNULL(SUM(price), 0) AS TotalPrice FROM dbo.Units'
    );

    if (result.success && result.data !== undefined) {
      console.log('✅ Total inventory value calculated:', result.data);
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to calculate inventory value',
    };
  } catch (error) {
    console.error('❌ Failed to get inventory value:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory value',
    };
  }
}

/**
 * Get available units count from Azure SQL Database
 * Uses your exact SQL query: SELECT COUNT(CASE WHEN status = 'Available' THEN 1 END) AS AvailableItems FROM dbo.Units;
 */
export async function getAvailableUnitsCount(): Promise<DatabaseResult<number>> {
  try {
    console.log('📋 Fetching available units count from dbo.Units...');
    
    // Your exact SQL query
    const result = await executeScalar<number>(
      "SELECT COUNT(CASE WHEN status = 'Available' THEN 1 END) AS AvailableItems FROM dbo.Units"
    );

    if (result.success && result.data !== undefined) {
      console.log('✅ Available units count retrieved:', result.data);
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to get available units count',
    };
  } catch (error) {
    console.error('❌ Failed to get available units count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available units count',
    };
  }
}

/**
 * Test database connection and get status
 * Used for the system status indicator on dashboard
 */
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  try {
    console.log('🔍 Testing Azure SQL Database connection...');
    
    const connectionTest = await testConnection();
    
    if (connectionTest.success) {
      const latencyText = connectionTest.latency ? ` (${connectionTest.latency}ms)` : '';
      return {
        status: 'Connected',
        message: `Connection is healthy${latencyText}`,
        lastChecked: new Date(),
      };
    } else {
      return {
        status: 'Error',
        message: connectionTest.error || 'Database connection failed',
        lastChecked: new Date(),
      };
    }
  } catch (error) {
    console.error('❌ Status check failed:', error);
    return {
      status: 'Disconnected',
      message: error instanceof Error ? error.message : 'Database connection error',
      lastChecked: new Date(),
    };
  }
}

/**
 * Get inventory statistics for dashboard
 */
export async function getInventoryStats(): Promise<DatabaseResult<InventoryStats>> {
  try {
    const countResult = await getInventoryCount();
    
    if (!countResult.success || countResult.data === undefined) {
      return {
        success: false,
        error: countResult.error || 'Failed to get inventory count',
      };
    }

    return {
      success: true,
      data: {
        totalCount: countResult.data,
        lastUpdated: new Date(),
      },
    };
  } catch (error) {
    console.error('❌ Failed to get inventory stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory stats',
    };
  }
}

/**
 * Get inventory items with pagination from dbo.Units
 * Retrieve actual unit records from the database
 */
export async function getInventoryItems(
  limit: number = 10,
  offset: number = 0
): Promise<DatabaseResult<Vehicle[]>> {
  try {
    console.log(`📋 Fetching inventory items from dbo.Units (limit: ${limit}, offset: ${offset})...`);
    
    // Query to get inventory items with pagination
    // Adjust column names based on your actual Units table schema
    const result = await executeQuery<Vehicle>(
      `SELECT 
        Id as id,
        Make as make, 
        Model as model, 
        Year as year,
        VIN as vin,
        CAST(Price AS DECIMAL(18,2)) as price,
        Status as status,
        CreatedDate as createdAt,
        ModifiedDate as updatedAt
      FROM dbo.Units 
      ORDER BY CreatedDate DESC 
      OFFSET @offset ROWS 
      FETCH NEXT @limit ROWS ONLY`,
      { limit, offset }
    );

    if (result.success) {
      console.log(`✅ Retrieved ${result.data?.length || 0} inventory items from dbo.Units`);
      return {
        success: true,
        data: result.data || [],
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to retrieve inventory items',
    };
  } catch (error) {
    console.error('❌ Failed to get inventory items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory items',
    };
  }
}

/**
 * Get inventory by status counts from dbo.Units
 * Count units by their current status
 */
export async function getInventoryByStatus(): Promise<DatabaseResult<Record<string, number>>> {
  try {
    console.log('📈 Getting inventory counts by status from dbo.Units...');
    
    const result = await executeQuery<{ Status: string; Count: number }>(
      'SELECT Status, COUNT(*) as Count FROM dbo.Units GROUP BY Status'
    );

    if (result.success && result.data) {
      const statusCounts: Record<string, number> = {};
      result.data.forEach(row => {
        statusCounts[row.Status] = row.Count;
      });

      console.log('✅ Status counts retrieved from dbo.Units:', statusCounts);
      return {
        success: true,
        data: statusCounts,
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to get status counts',
    };
  } catch (error) {
    console.error('❌ Failed to get inventory by status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inventory by status',
    };
  }
}

/**
 * Search inventory by make/model in dbo.Units
 * Perform text search on inventory items
 */
export async function searchInventory(
  searchTerm: string,
  limit: number = 20
): Promise<DatabaseResult<Vehicle[]>> {
  try {
    console.log(`🔍 Searching inventory in dbo.Units for: "${searchTerm}"...`);
    
    const result = await executeQuery<Vehicle>(
      `SELECT TOP (@limit)
        Id as id,
        Make as make, 
        Model as model, 
        Year as year,
        VIN as vin,
        CAST(Price AS DECIMAL(18,2)) as price,
        Status as status,
        CreatedDate as createdAt,
        ModifiedDate as updatedAt
      FROM dbo.Units 
      WHERE Make LIKE @searchTerm 
         OR Model LIKE @searchTerm 
         OR VIN LIKE @searchTerm
         OR CAST(Year AS NVARCHAR) LIKE @searchTerm
      ORDER BY CreatedDate DESC`,
      { 
        limit, 
        searchTerm: `%${searchTerm}%` 
      }
    );

    if (result.success) {
      console.log(`✅ Found ${result.data?.length || 0} matching inventory items in dbo.Units`);
      return {
        success: true,
        data: result.data || [],
      };
    }

    return {
      success: false,
      error: result.error || 'Search failed',
    };
  } catch (error) {
    console.error('❌ Inventory search failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Inventory search failed',
    };
  }
}