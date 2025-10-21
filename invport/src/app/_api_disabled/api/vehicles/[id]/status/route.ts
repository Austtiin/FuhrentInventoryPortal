import { NextRequest, NextResponse } from 'next/server';

interface StatusUpdateRequest {
  status: string;
}

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

    const body: StatusUpdateRequest = await request.json();
    
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['Available', 'Sold', 'Pending', 'Reserved', 'Maintenance'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database update
    // This is a placeholder - in production this would connect to your database
    console.log(`🔄 Updating vehicle ${id} status to: ${body.status}`);
    
    // Simulate database update
    // In a real implementation, this would:
    // 1. Connect to your SQL database
    // 2. Execute UPDATE query on Units table
    // 3. Return the updated record
    
    // For now, return success
    return NextResponse.json(
      {
        success: true,
        data: {
          id,
          status: body.status,
          message: `Vehicle ${id} status updated to ${body.status}`
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error updating vehicle status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while updating vehicle status'
      },
      { status: 500 }
    );
  }
}