import { NextResponse } from 'next/server';
import { getInventoryCount, getInventoryValue, getAvailableUnitsCount, getDatabaseStatus } from '@/lib/database/inventory';

export async function GET() {
  try {
    console.log('🔄 API: Loading dashboard stats from Azure SQL Database...');

    // Get all dashboard data in parallel for better performance
    const [inventoryCountResult, inventoryValueResult, availableUnitsResult, dbStatusResult] = await Promise.all([
      getInventoryCount(),
      getInventoryValue(),
      getAvailableUnitsCount(),
      getDatabaseStatus()
    ]);

    // Prepare response data
    const response = {
      success: true,
      data: {
        totalInventory: inventoryCountResult.success ? inventoryCountResult.data : 0,
        totalValue: inventoryValueResult.success ? inventoryValueResult.data : 0,
        availableUnits: availableUnitsResult.success ? availableUnitsResult.data : 0,
        databaseStatus: dbStatusResult,
      },
      errors: {
        inventoryCount: inventoryCountResult.success ? null : inventoryCountResult.error,
        inventoryValue: inventoryValueResult.success ? null : inventoryValueResult.error,
        availableUnits: availableUnitsResult.success ? null : availableUnitsResult.error,
      }
    };

    console.log('✅ API: Dashboard stats loaded successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API: Failed to load dashboard stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard stats',
        data: {
          totalInventory: 0,
          totalValue: 0,
          availableUnits: 0,
          databaseStatus: {
            status: 'Error',
            message: 'API error occurred',
            lastChecked: new Date()
          }
        }
      },
      { status: 500 }
    );
  }
}