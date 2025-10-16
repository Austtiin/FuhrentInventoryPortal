import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

/**
 * POST /api/vehicles/add
 * Add a new vehicle to the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vin, year, make, model, stockNo, condition, category, width, length, price, typeId } = body;

    // Validate required fields
    if (!vin || vin.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'VIN is required' },
        { status: 400 }
      );
    }

    if (!year || !make || !model) {
      return NextResponse.json(
        { success: false, error: 'Year, Make, and Model are required' },
        { status: 400 }
      );
    }

    // First check if VIN already exists
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM dbo.Units
      WHERE VIN = @vin
    `;

    const checkResult = await executeQuery<{ count: number }>(checkQuery, {
      vin: vin.toUpperCase()
    });

    if (checkResult.success && checkResult.data && checkResult.data[0]?.count > 0) {
      return NextResponse.json(
        { success: false, error: 'This VIN already exists in the database' },
        { status: 409 } // Conflict
      );
    }

    // Insert new vehicle
    const insertQuery = `
      INSERT INTO dbo.Units (
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
        Status,
        CreatedAt
      )
      VALUES (
        @vin,
        @year,
        @make,
        @model,
        @price,
        @stockNo,
        @condition,
        @category,
        @width,
        @length,
        @typeId,
        'Available',
        GETDATE()
      );
      
      SELECT SCOPE_IDENTITY() as UnitID;
    `;

    const result = await executeQuery<{ UnitID: number }>(insertQuery, {
      vin: vin.toUpperCase(),
      year: year ? parseInt(year) : null,
      make: make || null,
      model: model || null,
      price: price ? parseFloat(price) : null,
      stockNo: stockNo || null,
      condition: condition || 'New',
      category: category || null,
      width: width || null,
      length: length || null,
      typeId: typeId || 2
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to add vehicle to database' },
        { status: 500 }
      );
    }

    const newUnitId = result.data?.[0]?.UnitID;

    return NextResponse.json({
      success: true,
      message: 'Vehicle added successfully',
      unitId: newUnitId
    });

  } catch (error) {
    console.error('Error adding vehicle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add vehicle' },
      { status: 500 }
    );
  }
}
