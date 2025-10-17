import { NextResponse } from 'next/server';
import { getPoolStats, testConnection, logPoolStats } from '@/lib/database/connection';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Health Check and Pool Statistics Endpoint
 * GET /api/health
 * 
 * Returns the current status of the database connection pool
 * and tests connectivity with the database
 */
export async function GET() {
  try {
    console.log('🏥 Health check requested...');
    
    // Get current pool statistics
    const poolStats = getPoolStats();
    
    // Log pool stats to server console
    logPoolStats();
    
    // Test actual database connectivity
    const connectionTest = await testConnection();
    
    // Determine overall health status
    const isHealthy = connectionTest.success && poolStats.isHealthy && !poolStats.circuitBreakerActive;
    
    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: connectionTest.success,
        latency: connectionTest.latency ? `${connectionTest.latency}ms` : 'N/A',
        error: connectionTest.error || null,
      },
      pool: {
        exists: poolStats.exists,
        connected: poolStats.isConnected,
        connecting: poolStats.isConnecting,
        healthy: poolStats.isHealthy,
      },
      circuitBreaker: {
        active: poolStats.circuitBreakerActive,
        consecutiveFailures: poolStats.consecutiveFailures,
        secondsUntilReset: poolStats.secondsUntilReset || null,
      },
      pooling: {
        enabled: true,
        maxConnections: 10,
        minConnections: 2,
        idleTimeout: '30s',
        acquireTimeout: '15s',
      },
    };
    
    // Return appropriate HTTP status code
    const statusCode = isHealthy ? 200 : 503;
    
    console.log(`${isHealthy ? '✅' : '❌'} Health check ${isHealthy ? 'passed' : 'failed'}`);
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        pooling: {
          enabled: true,
          note: 'Connection pooling is configured but may not be operational',
        },
      },
      { status: 503 }
    );
  }
}
