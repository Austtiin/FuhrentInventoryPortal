import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Vehicle ID and status are required' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE dbo.Units 
      SET Status = @status
      WHERE Id = @id
    `;
    
    const result = await executeQuery(query, { id, status });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Vehicle status updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update vehicle status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle status' },
      { status: 500 }
    );
  }
}