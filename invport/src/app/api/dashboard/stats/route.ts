import { NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Call the external API (Azure Functions in dev, production API in prod)
    const response = await callExternalApi('dashboard/stats');
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ External API error: ${response.status} ${response.statusText}`);
      
      return NextResponse.json({
        error: true,
        message: `Failed to fetch dashboard statistics: ${response.statusText}`,
        statusCode: response.status,
        responseTimeMs,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

    const data = await response.json();

    // Return the data from external API with our response time
    return NextResponse.json({
      ...data,
      responseTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('❌ Dashboard stats error:', error);
    return NextResponse.json(
      { 
        error: true,
        message: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}