import { NextRequest, NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { status } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { 
          error: true,
          message: "Unit ID must be a valid number",
          providedId: idParam,
          statusCode: 400,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Valid status values
    const validStatuses = ['available', 'pending', 'sold', 'reserved', 'maintenance'];
    
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: true,
          message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`,
          providedStatus: status,
          statusCode: 400,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Call external API to update vehicle status
    const response = await callExternalApi(`vehicles/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: true,
            message: `Vehicle with ID ${id} not found`,
            vehicleId: id,
            statusCode: 404,
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('Set status API error:', error);
    return NextResponse.json(
      { 
        error: true,
        message: 'Failed to update vehicle status',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}