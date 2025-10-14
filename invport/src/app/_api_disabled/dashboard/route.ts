// API route for dashboard data
// NOTE: This file is disabled for static export builds
// To enable, remove 'output: export' from next.config.ts and deploy with Azure Functions
import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/database';

export async function GET() {
  try {
    if (!dbManager) {
      return NextResponse.json({
        totalInventory: 156,
        totalValue: '$2.8M',
        availableUnits: 142,
        systemStatus: {
          database: 'error' as const,
          message: 'Database manager not initialized'
        }
      });
    }

    // Test database connection
    const connectionTest = await dbManager.testConnection();
    
    // Get inventory statistics
    const inventoryResult = await dbManager.getInventoryStats();
    
    const data = inventoryResult.data as { 
      totalInventory: number; 
      totalValue: number; 
      availableUnits: number; 
    };
    
    return NextResponse.json({
      totalInventory: data.totalInventory || 0,
      totalValue: `$${((data.totalValue || 0) / 1000000).toFixed(1)}M`,
      availableUnits: data.availableUnits || 0,
      systemStatus: {
        database: connectionTest.status,
        message: connectionTest.message
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { 
        totalInventory: 0,
        totalValue: '$0',
        availableUnits: 0,
        systemStatus: {
          database: 'error' as const,
          message: error instanceof Error ? error.message : 'API error occurred'
        }
      },
      { status: 500 }
    );
  }
}

