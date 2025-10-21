import { NextRequest, NextResponse } from 'next/server';
import { callExternalApi } from '@/lib/apiUtils';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'Units';
    const format = searchParams.get('format') || 'json';
    const schema = searchParams.get('schema') === 'true';

    // Build query string for external API
    const queryParams = new URLSearchParams();
    if (table !== 'Units') queryParams.append('table', table);
    if (format !== 'json') queryParams.append('format', format);
    if (schema) queryParams.append('schema', 'true');
    
    const queryString = queryParams.toString();
    const endpoint = `GrabInventoryFH${queryString ? `?${queryString}` : ''}`;

    // Call the external API (Azure Functions in dev, production API in prod)
    const response = await callExternalApi(endpoint);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ External API error: ${response.status} ${response.statusText}`);
      
      return NextResponse.json({
        error: true,
        message: `Failed to fetch fish house inventory data: ${response.statusText}`,
        statusCode: response.status,
        responseTimeMs,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

    const data = await response.json();

    // Return the data with our response format
    return NextResponse.json({
      success: true,
      data: data.data || data, // Handle different response formats
      count: data.count || (Array.isArray(data.data) ? data.data.length : Array.isArray(data) ? data.length : 0),
      responseTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('❌ GrabInventoryFH API error:', error);
    
    return NextResponse.json({
      error: true,
      message: 'Failed to fetch fish house inventory data',
      details: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}