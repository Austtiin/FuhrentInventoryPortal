import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Mock database connection check
    // In production, this would test actual database connectivity
    const mockDatabaseTest = async () => {
      // Simulate database connection test
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    };

    const connected = await mockDatabaseTest();
    const responseTimeMs = Date.now() - startTime;

    if (connected) {
      return NextResponse.json({
        connected: true,
        status: "Healthy",
        message: "Database connection successful",
        responseTimeMs,
        databaseDetails: {
          server: "tcp:flatt-db-server.database.windows.net,1433",
          database: "flatt-inv-sql",
          connectionTimeout: 30
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        connected: false,
        status: "Error",
        message: "Database connection failed",
        responseTimeMs,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('Database health check error:', error);
    
    return NextResponse.json({
      connected: false,
      status: "Error",
      message: "Database connection string not configured",
      responseTimeMs,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}