import { NextResponse, NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

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
      
      // Add stale-while-revalidate caching headers (5 minutes)
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      response.headers.set('CDN-Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      
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