import { NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Call external API to get analytics data
    const response = await callExternalApi('reports/analytics');
    const result = await response.json();
    
    return NextResponse.json({
      ...result,
      responseTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        responseTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}