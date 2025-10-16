import { NextResponse, NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API: Starting inventory fetch...');
    
    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Get total count first
    const countQuery = 'SELECT COUNT(*) as total FROM dbo.Units';
    const countResult = await executeQuery(countQuery);
    
    if (!countResult.success) {
      console.error('❌ API: Failed to get total count:', countResult.error);
      return NextResponse.json(
        { success: false, error: countResult.error || 'Failed to get total count' },
        { status: 500 }
      );
    }
    
    const total = Number(countResult.data?.[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated data
    const query = `
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
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `;
    
    const result = await executeQuery(query);
    
    if (result.success) {
      console.log(`✅ API: Successfully fetched ${result.data?.length || 0} vehicles (page ${page} of ${totalPages})`);
      
      const response = NextResponse.json({
        success: true,
        vehicles: result.data || [],
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      });
      
      // DISABLE ALL CACHING - Force fresh data on every request
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
      
      return response;
    } else {
      console.error('❌ API: Database query failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Database query failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ API: Unexpected error fetching vehicles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}