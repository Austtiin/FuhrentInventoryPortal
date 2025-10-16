import { NextResponse, NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    // Get status from request body
    const body = await request.json();
    const { status } = body;

    // Validate status value
    const validStatuses = ['Available', 'Pending', 'Sold'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`🔄 API: Updating vehicle ${id} status to ${status}...`);
    
    const query = `
      UPDATE dbo.Units 
      SET Status = @status, UpdatedAt = GETDATE()
      WHERE UnitID = @id
    `;
    
    const result = await executeQuery(query, {
      id: parseInt(id),
      status: status
    });
    
    if (result.success) {
      console.log(`✅ API: Successfully updated vehicle ${id} status to ${status}`);
      
      const response = NextResponse.json({
        success: true,
        message: `Vehicle status updated to ${status} successfully`,
        status: status
      });
      
      // DISABLE ALL CACHING - Force fresh data on every request
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } else {
      console.error('❌ API: Database update failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Database update failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ API: Unexpected error updating vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle status' },
      { status: 500 }
    );
  }
}