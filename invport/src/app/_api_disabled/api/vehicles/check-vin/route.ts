import { NextRequest, NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vin } = body;

    if (!vin) {
      return NextResponse.json(
        { error: 'VIN is required' },
        { status: 400 }
      );
    }

    // Basic VIN validation (17 characters, alphanumeric except I, O, Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinRegex.test(vin.toUpperCase())) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid VIN format. VIN must be 17 characters.',
      });
    }

    // Call external API to check VIN
    const response = await callExternalApi(`checkvin/${vin}`);
    const result = await response.json();
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('VIN check API error:', error);
    return NextResponse.json(
      { error: 'Failed to validate VIN' },
      { status: 500 }
    );
  }
}