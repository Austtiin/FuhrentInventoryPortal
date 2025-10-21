import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

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

    // Mock vehicle data
    // In production, this would fetch from your database
    const vehicles = [
      {
        unitId: 1,
        stockNo: 'VH001',
        status: 'available',
        make: 'Honda',
        model: 'Civic',
        year: 2023,
        price: 28900,
        lastUpdated: '2024-01-15T14:30:00Z',
      },
      {
        unitId: 2,
        stockNo: 'VH002',
        status: 'available',
        make: 'Toyota',
        model: 'Camry',
        year: 2024,
        price: 32500,
        lastUpdated: '2024-01-20T14:30:00Z',
      },
      {
        unitId: 3,
        stockNo: 'VH003',
        status: 'sold',
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        price: 35900,
        lastUpdated: '2024-01-25T14:30:00Z',
      },
    ];

    const vehicle = vehicles.find(v => v.unitId === id);
    const responseTimeMs = Date.now() - startTime;

    if (!vehicle) {
      return NextResponse.json(
        {
          error: true,
          message: `Unit with ID ${id} not found`,
          unitId: id,
          statusCode: 404,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      unitId: vehicle.unitId,
      stockNo: vehicle.stockNo,
      status: vehicle.status,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      lastUpdated: vehicle.lastUpdated,
      responseTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('Check status API error:', error);
    return NextResponse.json(
      { 
        error: true,
        message: 'Failed to check vehicle status',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}