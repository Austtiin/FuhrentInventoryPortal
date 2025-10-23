import { NextRequest, NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      stockNo, 
      typeId, 
      year, 
      make, 
      model, 
      vin, 
      price,
      status = 'available',
      mileage = 0,
      color,
      description,
      engine,
      transmission,
      fuelType,
      drivetrain,
      bodyStyle,
      doors,
      seats,
      mpg
    } = body;

    // Validate required fields
    const requiredFields = ['stockNo', 'typeId', 'year', 'make', 'model', 'vin', 'price'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Validation failed",
          validationErrors: missingFields.map(field => `${field} is required`),
          statusCode: 400,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate price
    if (parseFloat(price) <= 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Validation failed",
          validationErrors: ["Price must be greater than 0"],
          statusCode: 400,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Call external API to add vehicle
    const response = await callExternalApi('vehicles', {
      method: 'POST',
      body: JSON.stringify({
        stockNo,
        typeId: parseInt(typeId),
        year: parseInt(year),
        make,
        model,
        vin: vin.toUpperCase(),
        price: parseFloat(price),
        status,
        mileage: parseInt(mileage) || 0,
        color: color || '',
        description: description || '',
        engine: engine || '',
        transmission: transmission || '',
        fuelType: fuelType || 'Gasoline',
        drivetrain: drivetrain || '',
        bodyStyle: bodyStyle || '',
        doors: parseInt(doors) || null,
        seats: parseInt(seats) || null,
        mpg: mpg || ''
      })
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('Add vehicle API error:', error);
    return NextResponse.json(
      { 
        error: true,
        message: 'Failed to add vehicle',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}