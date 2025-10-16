import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    console.log('🚗 Fetching all inventory from dbo.Units...');

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'dateAdded';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    const whereConditions: string[] = [];
    const parameters: Record<string, string | number> = {};

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
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

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

    // Execute both queries in parallel
    const [countResult, dataResult] = await Promise.all([
      executeQuery(countQuery, parameters),
      executeQuery(dataQuery, parameters)
    ]);

    if (!countResult.success || !dataResult.success) {
      throw new Error(countResult.error || dataResult.error || 'Database query failed');
    }

    const total = Number(countResult.data?.[0]?.total) || 0;
    const vehicles = dataResult.data || [];

    // Transform data to match frontend expectations
    const transformedVehicles = vehicles.map((vehicle: Record<string, unknown>) => ({
      ...vehicle,
      price: parseFloat(String(vehicle.price)) || 0,
      mileage: parseInt(String(vehicle.mileage)) || 0,
      year: parseInt(String(vehicle.year)) || 0,
      dateAdded: vehicle.dateAdded ? new Date(String(vehicle.dateAdded)).toISOString() : new Date().toISOString(),
      lastUpdated: vehicle.lastUpdated ? new Date(String(vehicle.lastUpdated)).toISOString() : new Date().toISOString(),
    }));

    console.log(`✅ Retrieved ${vehicles.length} vehicles from ${total} total`);

    return NextResponse.json({
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
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch inventory:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory',
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
      }
    }, { status: 500 });
  }
}