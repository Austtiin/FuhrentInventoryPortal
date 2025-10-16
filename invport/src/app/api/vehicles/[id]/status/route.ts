import { NextResponse, NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

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

    console.log(`🔄 API: Marking vehicle ${id} as pending...`);
    
    const query = `
      UPDATE dbo.Units 
      SET Status = 'Pending'
      WHERE UnitID = @id
    `;
    
    const result = await executeQuery(query, {
      id: parseInt(id)
    });
    
    if (result.success) {
      console.log(`✅ API: Successfully marked vehicle ${id} as pending`);
      
      return NextResponse.json({
        success: true,
        message: 'Vehicle marked as pending successfully'
      });
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