import { NextRequest, NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const unitId = parseInt(id);
    
    if (isNaN(unitId)) {
      return NextResponse.json(
        { 
          error: true,
          message: "Vehicle ID must be a valid number",
          providedId: id,
          statusCode: 400,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Call the external API (Azure Functions in dev, production API in prod)
    const response = await callExternalApi(`vehicles/${unitId}`);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ External API error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        return NextResponse.json({
          error: true,
          message: `Vehicle with ID ${unitId} not found`,
          vehicleId: unitId,
          statusCode: 404,
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      
      return NextResponse.json({
        error: true,
        message: `Failed to fetch vehicle: ${response.statusText}`,
        statusCode: response.status,
        responseTimeMs,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      ...data,
      responseTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('❌ Error fetching vehicle:', error);
    
    return NextResponse.json(
      {
        error: true,
        message: 'Internal server error while fetching vehicle',
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const unitId = parseInt(id);
    const body = await request.json();
    
    if (isNaN(unitId)) {
      return NextResponse.json(
        { 
          error: true,
          message: "Vehicle ID must be a valid number",
          providedId: id,
          statusCode: 400,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Mock vehicle lookup and update
    // In production, this would update your database
    const updatedFields = Object.keys(body);
    const responseTimeMs = Date.now() - startTime;

    console.log(`� Updating vehicle ${unitId} with fields:`, updatedFields);

    return NextResponse.json({
      success: true,
      message: "Vehicle updated successfully",
      unitId,
      updatedFields,
      fieldsCount: updatedFields.length,
      responseTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('❌ Error updating vehicle:', error);
    
    return NextResponse.json(
      {
        error: true,
        message: 'Failed to update vehicle',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    const unitId = parseInt(id);
    
    if (isNaN(unitId)) {
      return NextResponse.json(
        { 
          error: true,
          message: "Vehicle ID must be a valid number",
          providedId: id,
          statusCode: 400,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Mock vehicle deletion
    // In production, this would delete from your database
    const responseTimeMs = Date.now() - startTime;
    console.log(`🗑️ Deleting vehicle ID: ${unitId}`);
    
    return NextResponse.json({
      success: true,
      message: `Vehicle ${unitId} has been deleted`,
      unitId,
      responseTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('❌ Error deleting vehicle:', error);
    
    return NextResponse.json(
      {
        error: true,
        message: 'Internal server error while deleting vehicle',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}