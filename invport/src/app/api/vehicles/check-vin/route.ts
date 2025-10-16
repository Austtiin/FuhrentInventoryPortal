import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

/**
 * POST /api/vehicles/check-vin
 * Check if a VIN already exists in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vin } = body;

    if (!vin || vin.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'VIN is required' },
        { status: 400 }
      );
    }

    const query = `
      SELECT COUNT(*) as count
      FROM dbo.Units
      WHERE VIN = @vin
    `;

    const result = await executeQuery<{ count: number }>(query, {
      vin: vin.toUpperCase()
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to check VIN' },
        { status: 500 }
      );
    }

    const exists = result.data[0]?.count > 0;

    return NextResponse.json({
      success: true,
      exists,
      message: exists ? 'VIN already exists' : 'VIN is available'
    });

  } catch (error) {
    console.error('Error checking VIN:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check VIN' },
      { status: 500 }
    );
  }
}
