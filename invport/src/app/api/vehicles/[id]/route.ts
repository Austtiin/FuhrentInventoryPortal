import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/vehicles/[id] - Fetch a single vehicle by UnitID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unitId = parseInt(id);

    if (isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle ID' },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        UnitID,
        VIN,
        Year,
        Make,
        Model,
        Price,
        StockNo,
        Condition,
        Category,
        WidthCategory,
        SizeCategory,
        TypeID,
        Status
      FROM Units
      WHERE UnitID = @unitId
    `;

    const result = await executeQuery(query, {
      unitId: unitId
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const jsonResponse = NextResponse.json({
      success: true,
      data: result.data[0]
    });
    
    // DISABLE ALL CACHING - Force fresh data on every request
    jsonResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    jsonResponse.headers.set('Pragma', 'no-cache');
    jsonResponse.headers.set('Expires', '0');
    
    return jsonResponse;

  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

// PUT /api/vehicles/[id] - Update a vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unitId = parseInt(id);

    if (isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { vin, year, make, model, stockNo, condition, category, width, length, price, typeId } = body;

    // VIN is required - cannot be empty
    if (!vin || vin.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'VIN is required and cannot be empty' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE Units
      SET 
        VIN = @vin,
        Year = @year,
        Make = @make,
        Model = @model,
        Price = @price,
        StockNo = @stockNo,
        Condition = @condition,
        Category = @category,
        WidthCategory = @width,
        SizeCategory = @length,
        TypeID = @typeId
      WHERE UnitID = @unitId
    `;

    const result = await executeQuery(query, {
      unitId: unitId,
      vin: vin.toUpperCase(),
      year: year ? parseInt(year) : null,
      make: make || null,
      model: model || null,
      price: price ? parseFloat(price) : null,
      stockNo: stockNo || null,
      condition: condition || null,
      category: category || null,
      width: width || null,
      length: length || null,
      typeId: typeId
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update vehicle' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle updated successfully'
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles/[id] - Delete a vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unitId = parseInt(id);

    if (isNaN(unitId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vehicle ID' },
        { status: 400 }
      );
    }

    const query = `DELETE FROM Units WHERE UnitID = @unitId`;

    const result = await executeQuery(query, {
      unitId: unitId
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete vehicle' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
