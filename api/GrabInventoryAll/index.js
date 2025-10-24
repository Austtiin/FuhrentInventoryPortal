const { executeQuery, sql } = require('../shared/database');

module.exports = async function (context, req) {
  const startTime = Date.now();
  
  try {
    context.log('🚗 Azure Function: Fetching all inventory from dbo.Units...');
    
    // Get search parameters
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'DateAdded';
    const sortOrder = req.query.sortOrder || 'desc';
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '50');
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    const whereConditions = [];
    const parameters = {};

    if (search) {
      whereConditions.push(`(
        VIN LIKE @search OR 
        Make LIKE @search OR 
        Model LIKE @search OR
        [Year] LIKE @search OR
        Color LIKE @search
      )`);
      parameters.search = `%${search}%`;
    }

    if (status && status !== 'all') {
      whereConditions.push('Status = @status');
      parameters.status = status;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Validate and sanitize sortBy to prevent SQL injection
    const validSortColumns = [
      'VIN', 'Make', 'Model', 'Year', 'Color', 'Status', 'Price', 
      'Mileage', 'DateAdded', 'LastUpdated'
    ];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'DateAdded';
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM dbo.Units
      ${whereClause}
    `;

    // Main query with pagination
    const dataQuery = `
      SELECT 
        UnitID as id,
        VIN as vin,
        Make as make,
        Model as model,
        [Year] as year,
        Color as color,
        Status as status,
        Price as price,
        MSRP as msrp,
        Mileage as mileage,
        DateAdded as dateAdded,
        LastUpdated as lastUpdated,
        CONCAT(Make, ' ', Model, ' ', [Year]) as name
      FROM dbo.Units
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    // Add pagination parameters
    parameters.offset = offset;
    parameters.limit = limit;

    // Execute both queries
    const countResult = await executeQuery(countQuery, parameters);
    const dataResult = await executeQuery(dataQuery, parameters);

    if (!countResult.success || !dataResult.success) {
      throw new Error(countResult.error || dataResult.error || 'Database query failed');
    }

    const total = countResult.data[0].total;
    const vehicles = dataResult.data || [];

    // Transform data
    const transformedVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      price: parseFloat(vehicle.price) || 0,
      msrp: vehicle.msrp != null ? parseFloat(vehicle.msrp) || 0 : undefined,
      mileage: parseInt(vehicle.mileage) || 0,
      year: parseInt(vehicle.year) || 0,
      dateAdded: vehicle.dateAdded ? new Date(vehicle.dateAdded).toISOString() : new Date().toISOString(),
      lastUpdated: vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toISOString() : new Date().toISOString(),
    }));

    const duration = Date.now() - startTime;
    context.log(`✅ Azure Function: Retrieved ${vehicles.length} vehicles from ${total} total in ${duration}ms`);

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
        data: {
          vehicles: transformedVehicles,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        },
        duration: `${duration}ms`
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    context.log.error('❌ Azure Function: Failed to fetch inventory:', error);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        error: error.message,
        data: {
          vehicles: [],
          pagination: {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        },
        duration: `${duration}ms`
      }
    };
  }
};
