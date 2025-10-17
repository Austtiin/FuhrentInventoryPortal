# API Requirements for Azure Functions

This document outlines all API endpoints required by the Fuhrent Inventory Portal frontend application. You'll need to create Azure Functions for each of these endpoints.

---

## 🔧 Database Connection Requirements

All functions need access to:
- **Connection String Variable**: `SQL_CONN_STRING` (or `AZURE_SQL_CONNECTION_STRING`)
- **Server**: `flatt-db-server.database.windows.net`
- **Database**: `flatt-inv-sql`
- **Username**: `admin_panel`
- **Password**: `Jumping11!`

### Recommended Connection Settings
```javascript
pool: {
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000
}
```

---

## 📋 Required API Endpoints

### 1. **GET /api/GrabInventoryAll**
**Purpose**: Fetch all inventory with filtering, sorting, and pagination  
**Used By**: `src/hooks/useInventory.ts`  
**Current Implementation**: `src/app/api/GrabInventoryAll/route.ts`

#### Query Parameters:
- `search` (string, optional) - Search across VIN, Make, Model, Year, Color
- `status` (string, optional) - Filter by status: 'Available', 'Pending', 'Sold', 'all'
- `sortBy` (string, optional) - Column to sort by (default: 'DateAdded')
- `sortOrder` (string, optional) - 'asc' or 'desc' (default: 'desc')
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50)

#### Response Format:
```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": 123,
        "vin": "1HGBH41JXMN109186",
        "make": "Honda",
        "model": "Accord",
        "year": 2021,
        "color": "Blue",
        "status": "Available",
        "price": 25000,
        "mileage": 15000,
        "dateAdded": "2024-01-15T00:00:00.000Z",
        "lastUpdated": "2024-01-15T00:00:00.000Z",
        "name": "Honda Accord 2021"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### SQL Query:
```sql
-- Count query
SELECT COUNT(*) as total
FROM dbo.Units
WHERE [conditions]

-- Data query
SELECT 
  UnitID as id,
  VIN as vin,
  Make as make,
  Model as model,
  [Year] as year,
  Color as color,
  Status as status,
  Price as price,
  Mileage as mileage,
  DateAdded as dateAdded,
  LastUpdated as lastUpdated,
  CONCAT(Make, ' ', Model, ' ', [Year]) as name
FROM dbo.Units
WHERE [conditions]
ORDER BY [sortBy] [sortOrder]
OFFSET @offset ROWS
FETCH NEXT @limit ROWS ONLY
```

---

### 2. **GET /api/inventory**
**Purpose**: Fetch inventory with pagination (simpler version)  
**Used By**: `src/hooks/useInventorySWR.ts`, `src/hooks/useInventoryAPI.ts`  
**Current Implementation**: `src/app/api/inventory/route.ts`

#### Query Parameters:
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 10)

#### Response Format:
```json
{
  "success": true,
  "vehicles": [
    {
      "UnitID": 123,
      "VIN": "1HGBH41JXMN109186",
      "Make": "Honda",
      "Model": "Accord",
      "Year": 2021,
      "Price": 25000,
      "Status": "Available",
      "Description": "2021 Honda Accord",
      "TypeID": 2,
      "CreatedAt": "2024-01-15T00:00:00.000Z",
      "UpdatedAt": "2024-01-15T00:00:00.000Z",
      "StockNo": "A12345",
      "Condition": "Used",
      "Category": "Sedan",
      "WidthCategory": "Standard",
      "SizeCategory": "Midsize"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15,
  "hasNext": true,
  "hasPrev": false
}
```

#### SQL Query:
```sql
-- Count query
SELECT COUNT(*) as total FROM dbo.Units

-- Data query
SELECT 
  UnitID,
  VIN,
  Make,
  Model,
  Year,
  Price,
  Status,
  Description,
  TypeID,
  CreatedAt,
  UpdatedAt,
  StockNo,
  Condition,
  Category,
  WidthCategory,
  SizeCategory
FROM dbo.Units 
ORDER BY UnitID DESC
OFFSET @offset ROWS
FETCH NEXT @limit ROWS ONLY
```

---

### 3. **GET /api/dashboard/stats**
**Purpose**: Fetch dashboard statistics  
**Used By**: `src/hooks/useDashboard.ts`, `src/hooks/useDashboardSWR.ts`  
**Current Implementation**: `src/app/api/dashboard/stats/route.ts`

#### Query Parameters: None

#### Response Format:
```json
{
  "success": true,
  "data": {
    "totalInventory": 150,
    "totalValue": 3750000,
    "availableUnits": 120,
    "databaseStatus": {
      "status": "Connected",
      "message": "Database operational (12ms)",
      "latency": "12ms",
      "lastChecked": "2024-01-15T10:30:00.000Z"
    }
  },
  "errors": {
    "inventoryCount": null,
    "inventoryValue": null,
    "availableUnits": null
  }
}
```

#### SQL Queries Needed:
```sql
-- Total inventory count
SELECT COUNT(*) as count FROM dbo.Units

-- Total inventory value
SELECT SUM(Price) as totalValue FROM dbo.Units

-- Available units count
SELECT COUNT(*) as count FROM dbo.Units WHERE Status = 'Available'

-- Database status check (simple query to test connection)
SELECT 1 as test
```

---

### 4. **GET /api/vehicles/{id}**
**Purpose**: Fetch a single vehicle by UnitID  
**Used By**: `src/app/inventory/edit/[id]/page.tsx`, `src/components/ui/VehicleImage.tsx`  
**Current Implementation**: `src/app/api/vehicles/[id]/route.ts`

#### URL Parameters:
- `id` (number) - The UnitID of the vehicle

#### Response Format:
```json
{
  "success": true,
  "data": {
    "UnitID": 123,
    "VIN": "1HGBH41JXMN109186",
    "Year": 2021,
    "Make": "Honda",
    "Model": "Accord",
    "Price": 25000,
    "StockNo": "A12345",
    "Condition": "Used",
    "Category": "Sedan",
    "WidthCategory": "Standard",
    "SizeCategory": "Midsize",
    "TypeID": 2,
    "Status": "Available"
  }
}
```

#### SQL Query:
```sql
SELECT 
  UnitID,
  VIN,
  Year,
  Make,
  Model,
  Price,
  StockNo,
  Condition,
  Category,
  WidthCategory,
  SizeCategory,
  TypeID,
  Status
FROM Units
WHERE UnitID = @unitId
```

---

### 5. **PUT /api/vehicles/{id}**
**Purpose**: Update a vehicle's information  
**Used By**: `src/app/inventory/edit/[id]/page.tsx`  
**Current Implementation**: `src/app/api/vehicles/[id]/route.ts`

#### URL Parameters:
- `id` (number) - The UnitID of the vehicle

#### Request Body:
```json
{
  "year": 2021,
  "make": "Honda",
  "model": "Accord",
  "price": 25000,
  "stockNo": "A12345",
  "condition": "Used",
  "category": "Sedan",
  "widthCategory": "Standard",
  "sizeCategory": "Midsize"
}
```

#### Response Format:
```json
{
  "success": true,
  "message": "Vehicle updated successfully"
}
```

#### SQL Query:
```sql
UPDATE Units
SET 
  Year = @year,
  Make = @make,
  Model = @model,
  Price = @price,
  StockNo = @stockNo,
  Condition = @condition,
  Category = @category,
  WidthCategory = @widthCategory,
  SizeCategory = @sizeCategory,
  UpdatedAt = GETDATE()
WHERE UnitID = @unitId
```

---

### 6. **PATCH /api/vehicles/{id}/status**
**Purpose**: Update a vehicle's status (Available, Pending, Sold)  
**Used By**: `src/app/inventory/InventoryPageClient.tsx`, `src/app/inventory/edit/[id]/page.tsx`  
**Current Implementation**: `src/app/api/vehicles/[id]/status/route.ts`

#### URL Parameters:
- `id` (number) - The UnitID of the vehicle

#### Request Body:
```json
{
  "status": "Sold"
}
```
**Valid status values**: `"Available"`, `"Pending"`, `"Sold"`

#### Response Format:
```json
{
  "success": true,
  "message": "Vehicle status updated to Sold successfully",
  "status": "Sold"
}
```

#### SQL Query:
```sql
UPDATE dbo.Units 
SET Status = @status, UpdatedAt = GETDATE()
WHERE UnitID = @id
```

---

### 7. **POST /api/vehicles/add**
**Purpose**: Add a new vehicle to inventory  
**Used By**: `src/app/inventory/add/page.tsx`  
**Current Implementation**: `src/app/api/vehicles/add/route.ts`

#### Request Body:
```json
{
  "vin": "1HGBH41JXMN109186",
  "year": 2021,
  "make": "Honda",
  "model": "Accord",
  "price": 25000,
  "stockNo": "A12345",
  "condition": "Used",
  "category": "Sedan",
  "width": "Standard",
  "length": "Midsize",
  "typeId": 2
}
```

#### Response Format:
```json
{
  "success": true,
  "message": "Vehicle added successfully",
  "unitId": 123
}
```

#### SQL Queries:
```sql
-- First, check if VIN exists
SELECT COUNT(*) as count
FROM dbo.Units
WHERE VIN = @vin

-- If VIN doesn't exist, insert new vehicle
INSERT INTO dbo.Units (
  VIN,
  Year,
  Make,
  Model,
  Price,
  StockNo,
  Condition,
  Category,
  WidthCategory,
  SizeCategory,
  TypeID,
  Status,
  CreatedAt
)
VALUES (
  @vin,
  @year,
  @make,
  @model,
  @price,
  @stockNo,
  @condition,
  @category,
  @width,
  @length,
  @typeId,
  'Available',
  GETDATE()
);

SELECT SCOPE_IDENTITY() as UnitID;
```

---

### 8. **POST /api/vehicles/check-vin**
**Purpose**: Check if a VIN already exists in the database  
**Used By**: `src/app/inventory/add/page.tsx`  
**Current Implementation**: `src/app/api/vehicles/check-vin/route.ts`

#### Request Body:
```json
{
  "vin": "1HGBH41JXMN109186"
}
```

#### Response Format:
```json
{
  "success": true,
  "exists": false,
  "message": "VIN is available"
}
```

#### SQL Query:
```sql
SELECT COUNT(*) as count
FROM dbo.Units
WHERE VIN = @vin
```

---

### 9. **GET /api/images/{vin}**
**Purpose**: List all images for a specific VIN from Azure Blob Storage  
**Used By**: `src/hooks/useVehicleImages.ts`  
**Current Implementation**: `src/app/api/images/[vin]/route.ts`

#### URL Parameters:
- `vin` (string) - The VIN number

#### Query Parameters:
- `typeId` (number, optional) - Type of vehicle (1=fishhouses, 2=vehicles, 3=trailers, default: 2)

#### Response Format:
```json
{
  "success": true,
  "images": [
    {
      "name": "vehicles/1HGBH41JXMN109186/1.png",
      "url": "https://flattstorage.blob.core.windows.net/invpics/vehicles/1HGBH41JXMN109186/1.png",
      "number": 1
    },
    {
      "name": "vehicles/1HGBH41JXMN109186/2.png",
      "url": "https://flattstorage.blob.core.windows.net/invpics/vehicles/1HGBH41JXMN109186/2.png",
      "number": 2
    }
  ],
  "count": 2
}
```

#### Logic:
- **NO SQL QUERY NEEDED** - This is Azure Blob Storage access
- Base URL: `https://flattstorage.blob.core.windows.net/invpics`
- Folder mapping: TypeID 1 = `fishhouses`, TypeID 2 = `vehicles`, TypeID 3 = `trailers`
- Image path pattern: `{folder}/{VIN}/{number}.png` (numbers 1-10)
- Use HTTP HEAD requests to check if each image exists
- Return only images that exist

---

### 10. **DELETE /api/images/{vin}**
**Purpose**: Delete a specific image from Azure Blob Storage  
**Used By**: `src/hooks/useVehicleImages.ts`  
**Current Implementation**: `src/app/api/images/[vin]/route.ts`

#### URL Parameters:
- `vin` (string) - The VIN number

#### Query Parameters:
- `imageNumber` (number) - Which image to delete (1-10)
- `typeId` (number, optional) - Type of vehicle (default: 2)

#### Response Format:
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

#### Logic:
- **NO SQL QUERY NEEDED** - This is Azure Blob Storage deletion
- Delete blob at: `{folder}/{VIN}/{imageNumber}.png`
- Requires Azure Storage credentials

---

### 11. **POST /api/images/{vin}**
**Purpose**: Upload an image to Azure Blob Storage  
**Used By**: `src/hooks/useVehicleImages.ts`  
**Current Implementation**: `src/app/api/images/[vin]/route.ts`

#### URL Parameters:
- `vin` (string) - The VIN number

#### Request Body:
- FormData with `file` field
- Query params: `imageNumber` (1-10), `typeId` (optional)

#### Response Format:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "url": "https://flattstorage.blob.core.windows.net/invpics/vehicles/1HGBH41JXMN109186/1.png"
}
```

#### Logic:
- **NO SQL QUERY NEEDED** - This is Azure Blob Storage upload
- Upload to: `{folder}/{VIN}/{imageNumber}.png`
- Requires Azure Storage credentials

---

### 12. **GET /api/reports/analytics**
**Purpose**: Fetch comprehensive analytics and reports data  
**Used By**: `src/hooks/useReportsData.ts`  
**Current Implementation**: `src/app/api/reports/analytics/route.ts`

#### Query Parameters: None

#### Response Format:
```json
{
  "success": true,
  "data": {
    "totalStats": {
      "totalValue": 3750000,
      "totalVehicles": 100,
      "totalFishHouses": 25,
      "totalTrailers": 25,
      "uniqueMakes": 15,
      "uniqueModels": 45,
      "averagePrice": 25000,
      "averageMileage": 35000,
      "averageYear": 2020
    },
    "categoryBreakdown": [
      { "Category": "Sedan", "count": 45, "totalValue": 1125000 },
      { "Category": "SUV", "count": 30, "totalValue": 900000 }
    ],
    "statusBreakdown": [
      { "Status": "Available", "count": 120 },
      { "Status": "Sold", "count": 25 },
      { "Status": "Pending", "count": 5 }
    ],
    "priceStats": {
      "minPrice": 5000,
      "maxPrice": 85000,
      "avgPrice": 25000,
      "medianPrice": 23000
    },
    "yearDistribution": [
      { "Year": 2024, "count": 10 },
      { "Year": 2023, "count": 25 }
    ],
    "makeDistribution": [
      { "Make": "Honda", "count": 20, "totalValue": 500000 },
      { "Make": "Ford", "count": 18, "totalValue": 450000 }
    ],
    "trendData": [
      { "month": "2024-01", "added": 12, "sold": 8 }
    ]
  },
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

#### SQL Queries Needed:
```sql
-- Total Statistics
SELECT 
  SUM(CASE WHEN Price IS NOT NULL THEN Price ELSE 0 END) as totalValue,
  COUNT(CASE WHEN TypeID = 2 THEN 1 END) as totalVehicles,
  COUNT(CASE WHEN TypeID = 1 THEN 1 END) as totalFishHouses,
  COUNT(CASE WHEN TypeID = 3 THEN 1 END) as totalTrailers,
  COUNT(DISTINCT Make) as uniqueMakes,
  COUNT(DISTINCT Model) as uniqueModels,
  AVG(Price) as averagePrice,
  AVG(Mileage) as averageMileage,
  AVG(CAST([Year] AS FLOAT)) as averageYear
FROM dbo.Units

-- Category Breakdown
SELECT 
  Category,
  COUNT(*) as count,
  SUM(Price) as totalValue
FROM dbo.Units
WHERE Category IS NOT NULL
GROUP BY Category
ORDER BY count DESC

-- Status Breakdown
SELECT 
  Status,
  COUNT(*) as count
FROM dbo.Units
GROUP BY Status

-- Price Statistics
SELECT 
  MIN(Price) as minPrice,
  MAX(Price) as maxPrice,
  AVG(Price) as avgPrice
FROM dbo.Units
WHERE Price IS NOT NULL

-- Year Distribution
SELECT 
  [Year],
  COUNT(*) as count
FROM dbo.Units
GROUP BY [Year]
ORDER BY [Year] DESC

-- Make Distribution
SELECT TOP 10
  Make,
  COUNT(*) as count,
  SUM(Price) as totalValue
FROM dbo.Units
WHERE Make IS NOT NULL
GROUP BY Make
ORDER BY count DESC

-- Trend Data (monthly)
SELECT 
  FORMAT(CreatedAt, 'yyyy-MM') as month,
  COUNT(*) as added
FROM dbo.Units
WHERE CreatedAt >= DATEADD(MONTH, -12, GETDATE())
GROUP BY FORMAT(CreatedAt, 'yyyy-MM')
ORDER BY month
```

---

## 🔐 Required Environment Variables

Set these in your Azure Static Web App Configuration:

```
SQL_CONN_STRING=Server=tcp:flatt-db-server.database.windows.net,1433;Initial Catalog=flatt-inv-sql;Persist Security Info=False;User ID=admin_panel;Password=Jumping11!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

For Azure Blob Storage endpoints (images):
```
AZURE_STORAGE_ACCOUNT_NAME=flattstorage
AZURE_STORAGE_ACCOUNT_KEY=[your-storage-key]
AZURE_STORAGE_URL=https://flattstorage.blob.core.windows.net/invpics
```

---

## 📝 Important Notes

### CORS Configuration
All endpoints must allow CORS from your static web app domain:
```javascript
headers: {
  'Access-Control-Allow-Origin': '*', // Or specific domain
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}
```

### Caching Headers
Disable caching for all endpoints:
```javascript
headers: {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}
```

### Error Handling
All endpoints should return consistent error format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Circuit Breaker Pattern
Implement circuit breaker for database connections:
- **Threshold**: 5 failures
- **Timeout**: 60 seconds
- **Behavior**: Stop attempting connections after threshold reached, wait timeout period, then retry

---

## 🚀 Testing Endpoints

Once you create the Azure Functions, update the Azure Static Web App configuration:

1. Go to Azure Portal → Your Static Web App → Configuration
2. Set `SQL_CONN_STRING` in Application settings
3. Update GitHub workflow to point `api_location` to your functions folder
4. Deploy and test each endpoint

---

## 📞 Summary

**Total Endpoints Needed**: 12
- **6 GET endpoints** (read operations)
- **2 POST endpoints** (create/check operations)
- **1 PUT endpoint** (update full vehicle)
- **1 PATCH endpoint** (update status only)
- **1 DELETE endpoint** (delete image)
- **1 POST endpoint** (upload image)

**Database Tables Used**:
- `dbo.Units` (main inventory table)

**External Services**:
- Azure Blob Storage (`flattstorage.blob.core.windows.net/invpics`)

---

Let me know if you need clarification on any endpoint!
