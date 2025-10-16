import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

export async function GET() {
  try {
    console.log('🔄 API: Loading reports analytics from Azure SQL Database...');

    // Get comprehensive analytics data in parallel
    const [
      totalStatsResult,
      categoryBreakdownResult,
      statusBreakdownResult,
      priceStatsResult,
      yearDistributionResult,
      makeDistributionResult,
      trendDataResult
    ] = await Promise.all([
      getTotalStats(),
      getCategoryBreakdown(),
      getStatusBreakdown(),
      getPriceStatistics(),
      getYearDistribution(),
      getMakeDistribution(),
      getTrendData()
    ]);

    const response = {
      success: true,
      data: {
        totalStats: totalStatsResult.success && totalStatsResult.data && totalStatsResult.data.length > 0 
          ? totalStatsResult.data[0] 
          : null,
        categoryBreakdown: categoryBreakdownResult.success ? categoryBreakdownResult.data : [],
        statusBreakdown: statusBreakdownResult.success ? statusBreakdownResult.data : [],
        priceStats: priceStatsResult.success && priceStatsResult.data && priceStatsResult.data.length > 0
          ? priceStatsResult.data[0]
          : null,
        yearDistribution: yearDistributionResult.success ? yearDistributionResult.data : [],
        makeDistribution: makeDistributionResult.success ? makeDistributionResult.data : [],
        trendData: trendDataResult.success ? trendDataResult.data : []
      },
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ API: Reports analytics loaded successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API: Failed to load reports analytics:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load reports analytics',
        data: null
      },
      { status: 500 }
    );
  }
}

// Get total statistics
async function getTotalStats() {
  const query = `
    SELECT 
      -- Total Inventory Value (sum of all prices)
      SUM(CASE WHEN Price IS NOT NULL THEN Price ELSE 0 END) as totalValue,
      
      -- Total Vehicles (TypeID = 2)
      COUNT(CASE WHEN TypeID = 2 THEN 1 END) as totalVehicles,
      
      -- Total Fish Houses (TypeID = 1)
      COUNT(CASE WHEN TypeID = 1 THEN 1 END) as totalFishHouses,
      
      -- Total Trailers (TypeID = 3)
      COUNT(CASE WHEN TypeID = 3 THEN 1 END) as totalTrailers,
      
      -- Unique Makes
      COUNT(DISTINCT Make) as uniqueMakes,
      
      -- Pending Sales (Status = 'Pending')
      COUNT(CASE WHEN Status = 'Pending' THEN 1 END) as pendingSales,
      
      -- Additional useful stats
      AVG(CASE WHEN Price IS NOT NULL AND Price > 0 THEN Price ELSE NULL END) as avgPrice,
      MIN(CASE WHEN Price IS NOT NULL AND Price > 0 THEN Price ELSE NULL END) as minPrice,
      MAX(CASE WHEN Price IS NOT NULL THEN Price ELSE NULL END) as maxPrice,
      COUNT(DISTINCT Category) as uniqueCategories,
      AVG(CASE WHEN Year IS NOT NULL THEN Year ELSE NULL END) as avgYear,
      MIN(Year) as oldestYear,
      MAX(Year) as newestYear
    FROM dbo.Units
    WHERE UnitID IS NOT NULL
  `;
  
  return executeQuery(query);
}

// Get category breakdown
async function getCategoryBreakdown() {
  const query = `
    SELECT 
      ISNULL(Category, 'Unknown') as category,
      COUNT(*) as count,
      SUM(CASE WHEN Price IS NOT NULL THEN Price ELSE 0 END) as totalValue,
      AVG(CASE WHEN Price IS NOT NULL AND Price > 0 THEN Price ELSE NULL END) as avgPrice
    FROM dbo.Units
    WHERE UnitID IS NOT NULL
    GROUP BY Category
    ORDER BY count DESC
  `;
  
  return executeQuery(query);
}

// Get status breakdown
async function getStatusBreakdown() {
  const query = `
    SELECT 
      ISNULL(Status, 'Unknown') as status,
      COUNT(*) as count,
      SUM(CASE WHEN Price IS NOT NULL THEN Price ELSE 0 END) as totalValue,
      CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM dbo.Units WHERE UnitID IS NOT NULL) AS DECIMAL(5,2)) as percentage
    FROM dbo.Units
    WHERE UnitID IS NOT NULL
    GROUP BY Status
    ORDER BY count DESC
  `;
  
  return executeQuery(query);
}

// Get price statistics
async function getPriceStatistics() {
  const query = `
    SELECT 
      COUNT(CASE WHEN Price > 0 THEN 1 END) as vehiclesWithPrice,
      COUNT(CASE WHEN Price IS NULL OR Price = 0 THEN 1 END) as vehiclesWithoutPrice,
      COUNT(CASE WHEN Price BETWEEN 0 AND 10000 THEN 1 END) as under10k,
      COUNT(CASE WHEN Price BETWEEN 10000 AND 25000 THEN 1 END) as range10k25k,
      COUNT(CASE WHEN Price BETWEEN 25000 AND 50000 THEN 1 END) as range25k50k,
      COUNT(CASE WHEN Price > 50000 THEN 1 END) as over50k
    FROM dbo.Units
    WHERE UnitID IS NOT NULL
  `;
  
  return executeQuery(query);
}

// Get year distribution
async function getYearDistribution() {
  const query = `
    SELECT 
      Year,
      COUNT(*) as count,
      SUM(CASE WHEN Price IS NOT NULL THEN Price ELSE 0 END) as totalValue
    FROM dbo.Units
    WHERE UnitID IS NOT NULL AND Year IS NOT NULL
    GROUP BY Year
    ORDER BY Year DESC
  `;
  
  return executeQuery(query);
}

// Get make distribution
async function getMakeDistribution() {
  const query = `
    SELECT TOP 10
      ISNULL(Make, 'Unknown') as make,
      COUNT(*) as count,
      SUM(CASE WHEN Price IS NOT NULL THEN Price ELSE 0 END) as totalValue,
      AVG(CASE WHEN Price IS NOT NULL AND Price > 0 THEN Price ELSE NULL END) as avgPrice
    FROM dbo.Units
    WHERE UnitID IS NOT NULL
    GROUP BY Make
    ORDER BY count DESC
  `;
  
  return executeQuery(query);
}

// Get trend data (last 30 days if DateInStock is available)
async function getTrendData() {
  const query = `
    SELECT 
      CAST(CreatedAt AS DATE) as date,
      COUNT(*) as vehiclesAdded
    FROM dbo.Units
    WHERE UnitID IS NOT NULL 
      AND CreatedAt IS NOT NULL 
      AND CreatedAt >= DATEADD(day, -30, GETDATE())
    GROUP BY CAST(CreatedAt AS DATE)
    ORDER BY date DESC
  `;
  
  return executeQuery(query);
}