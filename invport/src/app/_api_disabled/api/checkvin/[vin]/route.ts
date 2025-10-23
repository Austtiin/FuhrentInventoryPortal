import { NextRequest, NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { vin: vinParam } = await params;
    const vin = vinParam.toUpperCase();

    // Call the external API (Azure Functions in dev, production API in prod)
    const response = await callExternalApi(`checkvin/${vin}`);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ External API error: ${response.status} ${response.statusText}`);
      
      return NextResponse.json({
        error: true,
        message: `Failed to check VIN: ${response.statusText}`,
        statusCode: response.status,
        responseTimeMs,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

    const data = await response.json();

    // Return the data from external API
    return NextResponse.json({
      ...data,
      responseTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('❌ VIN check API error:', error);
    return NextResponse.json(
      { 
        error: true,
        message: 'Failed to check VIN',
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}