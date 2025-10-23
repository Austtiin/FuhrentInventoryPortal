import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { contentPaths, domains } = body;

    // Validate required fields
    if (!contentPaths || !Array.isArray(contentPaths) || contentPaths.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Request body is required with 'contentPaths' field",
          expectedFormat: {
            contentPaths: ["/*", "/images/*", "/css/style.css"],
            domains: ["www.example.com"]
          },
          statusCode: 400,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Check for required Azure configuration
    const requiredVariables = [
      'AZURE_SUBSCRIPTION_ID',
      'AZURE_RESOURCE_GROUP',
      'AZURE_FD_PROFILE',
      'AZURE_FD_ENDPOINT'
    ];

    const missingVariables = requiredVariables.filter(variable => 
      !process.env[variable]
    );

    if (missingVariables.length > 0) {
      return NextResponse.json(
        {
          error: true,
          message: "Azure Front Door configuration is incomplete",
          missingVariables,
          requiredVariables,
          statusCode: 500,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Mock CDN purge operation
    // In production, this would call Azure Front Door API
    const purgeId = `purge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const responseTimeMs = Date.now() - startTime;

    // Simulate CDN purge initiation
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      message: "CDN cache purge initiated successfully",
      purgeId,
      contentPaths,
      domains: domains || [],
      estimatedCompletionTime: "2-5 minutes",
      responseTimeMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('CDN purge API error:', error);
    return NextResponse.json(
      { 
        error: true,
        message: 'Failed to initiate CDN purge',
        responseTimeMs,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}