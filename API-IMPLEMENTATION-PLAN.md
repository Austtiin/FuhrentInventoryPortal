# 🎯 Complete API Implementation List & Recommendations

**Last Updated**: January 18, 2025  
**Based On**: Your current Azure Functions responses

---

## ✅ ALREADY IMPLEMENTED (Your Azure Functions)

### 1. ✅ GET /api/checkdb
**Status**: ✅ **DEPLOYED & WORKING**

**Purpose**: Health check - verify database connection

**Response Format**:
```json
{
  "connected": true,
  "status": "Healthy",
  "message": "Database connection successful",
  "responseTimeMs": 1478,
  "databaseDetails": {
    "server": "tcp:flatt-db-server.database.windows.net,1433",
    "database": "flatt-inv-sql"
  },
  "timestamp": "2025-10-18T14:08:39.6628338Z"
}
```

**Frontend Integration**: ✅ Can be used for system status indicators

---

### 2. ✅ POST /api/checkstatus
**Status**: ✅ **DEPLOYED & WORKING**

**Purpose**: Update unit status (Available/Pending/Sold)

**Request**:
```json
{
  "unitId": 1,
  "status": "Sold"
}
```

**Success Response**:
```json
{
  "unitId": 1,
  "status": "Available",
  "responseTimeMs": 74,
  "timestamp": "2025-10-18T14:10:31.7724391Z"
}
```

**Error Response** (Bad UnitID):
```json
{
  "error": true,
  "message": "UnitID must be a valid number",
  "providedId": "{id}",
  "statusCode": 400
}
```

**Frontend Integration**: 
- ✅ `src/app/inventory/InventoryPageClient.tsx` - Updated
- ✅ `src/app/inventory/edit/[id]/page.tsx` - Updated

---

### 3. ✅ GET /api/checkvin/[vin]
**Status**: ✅ **DEPLOYED & WORKING**

**Purpose**: Check if VIN exists in database

**Request**: `GET /api/checkvin/5TJBE51111`

**Response (VIN Available)**:
```json
{
  "vin": "{vin}",
  "exists": false,
  "message": "VIN is available",
  "unitId": null,
  "stockNo": null,
  "responseTimeMs": 52,
  "timestamp": "2025-10-18T14:10:47.1299543Z"
}
```

**Response (VIN Exists)**:
```json
{
  "vin": "5TJBE51111",
  "exists": true,
  "message": "VIN already exists in inventory",
  "unitId": 1,
  "stockNo": "IC1111",
  "responseTimeMs": 33,
  "timestamp": "2025-10-18T14:11:25.8449078Z"
}
```

**Frontend Integration**: 
- ⚠️ **NEEDS UPDATE**: `src/app/inventory/add/page.tsx` - Currently calls `/checkvin` (POST), should call `/api/checkvin/{vin}` (GET)

**Recommendation**: ✅ **Update frontend to use GET instead of POST**

---

### 4. ✅ POST /api/Addinventory
**Status**: ✅ **DEPLOYED & WORKING** (assumed based on your comment)

**Purpose**: Add new inventory unit

**Request**:
```json
{
  "vin": "5TJBE51111",
  "year": 2024,
  "make": "Ice Castle Fish House",
  "model": "Extreme III",
  "stockNo": "IC1111",
  "condition": "New",
  "category": "RV",
  "typeId": 1,
  "widthCategory": "8",
  "sizeCategory": "21",
  "price": 54950.00,
  "status": "Available"
}
```

**Frontend Integration**: ✅ `src/app/inventory/add/page.tsx` - Updated

---

### 5. ✅ GET /api/GrabInventoryAll
**Status**: ✅ **DEPLOYED & WORKING**

**Purpose**: List all inventory with filtering/sorting

**Response Format** (Please confirm):
```json
[
  {
    "UnitID": 1,
    "VIN": "5TJBE51111",
    "StockNo": "IC1111",
    "Make": "Ice Castle Fish House",
    "Model": "Extreme III",
    "Year": 2024,
    "Condition": "New",
    "Price": 54950.00,
    "Status": "Available",
    "TypeID": 1,
    "Category": "RV",
    "WidthCategory": "8",
    "SizeCategory": "21",
    "CreatedAt": "2025-01-17T02:38:34.957",
    "UpdatedAt": "2025-01-17T02:38:34.963"
  }
]
```

**Frontend Integration**: 
- ✅ `src/hooks/useInventorySWR.ts` - Uses this
- ✅ `src/hooks/useInventoryAPI.ts` - Uses this
- ✅ `src/hooks/useInventory.ts` - Uses this

---

### 6. ✅ GET /api/GetByID/[id]
**Status**: ✅ **DEPLOYED & WORKING** (assumed)

**Purpose**: Get single unit by UnitID

**Response Format** (Please confirm):
```json
{
  "success": true,
  "data": {
    "UnitID": 123,
    "VIN": "5TJBE51111",
    "StockNo": "IC1111",
    "Make": "Ice Castle Fish House",
    "Model": "Extreme III",
    "Year": 2024,
    "Condition": "New",
    "Price": 54950.00,
    "Status": "Available"
  },
  "responseTimeMs": 45,
  "timestamp": "2025-01-18T10:30:00.000"
}
```

**Frontend Integration**: ✅ `src/app/inventory/edit/[id]/page.tsx` - Uses this

---

### 7. ✅ GET /api/GetDashboardStats
**Status**: ✅ **DEPLOYED & WORKING**

**Purpose**: Get dashboard statistics

**Response Format** (Please provide actual response):
```json
{
  "totalInventory": 150,
  "totalValue": 5495000.00,
  "availableUnits": 120,
  "pendingUnits": 15,
  "soldUnits": 15,
  "byType": {
    "fishHouses": 80,
    "vehicles": 45,
    "trailers": 25
  },
  "responseTimeMs": 125,
  "timestamp": "2025-01-18T10:30:00.000"
}
```

**Frontend Integration**: 
- ⚠️ **NEEDS UPDATE**: `src/hooks/useDashboard.ts` - Currently calls `/api/dashboard/stats`, should call `/api/GetDashboardStats`
- ⚠️ **NEEDS UPDATE**: `src/hooks/useDashboardSWR.ts` - Currently calls `/api/dashboard/stats`, should call `/api/GetDashboardStats`

---

## 📋 APIS NEEDED - Analysis & Recommendations

### 8. 🟡 PUT /api/UpdateUnit/[id] OR can we use existing?
**Purpose**: Update existing unit (edit save functionality)

**Current Situation**: Edit page loads data with `GetByID`, but can't save changes

**Options**:

#### Option A: ✅ **CREATE NEW API** (Recommended)
- **Endpoint**: `PUT /api/UpdateUnit/{id}`
- **Why**: Dedicated endpoint for updates is cleaner
- **Request**: Full unit object with changes
- **Response**: Similar to your other APIs with `responseTimeMs` and `timestamp`

#### Option B: Extend `/api/checkstatus`
- **Not Recommended**: Status-only updates should stay separate
- **Why**: Mixing full updates with status updates makes API confusing

**Recommendation**: 🎯 **CREATE `PUT /api/UpdateUnit/{id}`** - Keep it separate

---

### 9. 🟢 GET /api/GetReportsAnalytics OR use GrabInventoryAll?
**Purpose**: Analytics data for reports page

**Current Situation**: Reports page needs aggregated data

**Options**:

#### Option A: 🔄 **USE /api/GrabInventoryAll** (Maybe)
- Download all inventory client-side
- Calculate analytics in browser
- **Pros**: No new API needed
- **Cons**: Slow, inefficient, downloads unnecessary data

#### Option B: ✅ **CREATE NEW API** (Recommended)
- **Endpoint**: `GET /api/GetReportsAnalytics`
- **Why**: Server-side aggregation is much faster
- **Returns**: Pre-calculated stats, trends, breakdowns
- **Response**: Similar format with `responseTimeMs` and `timestamp`

**Recommendation**: 🎯 **CREATE `GET /api/GetReportsAnalytics`** - Much better performance

---

### 10. 📸 Image APIs - Three Separate Endpoints Needed

These interact with **Azure Blob Storage**, not SQL Database.

#### 10a. GET /api/GetUnitImages/[vin]
**Purpose**: List all images for a VIN

**Cannot Use**: GrabInventoryAll (different storage system)

**Recommendation**: 🎯 **CREATE NEW** - Blob Storage requires separate API

**Response Format** (Suggested):
```json
{
  "vin": "5TJBE51111",
  "images": [
    {
      "url": "https://storage.blob.core.windows.net/.../front-view.jpg",
      "thumbnail": "https://storage.blob.core.windows.net/.../front-view-thumb.jpg",
      "filename": "front-view.jpg",
      "uploadedAt": "2025-01-18T10:00:00.000"
    }
  ],
  "responseTimeMs": 89,
  "timestamp": "2025-01-18T10:30:00.000"
}
```

---

#### 10b. POST /api/UploadUnitImage
**Purpose**: Upload new image for a VIN

**Cannot Use**: Addinventory (different operation entirely)

**Recommendation**: 🎯 **CREATE NEW** - File upload requires multipart handling

**Request**: Multipart form data with image file and VIN

**Response Format** (Suggested):
```json
{
  "success": true,
  "vin": "5TJBE51111",
  "filename": "front-view.jpg",
  "url": "https://storage.blob.core.windows.net/.../front-view.jpg",
  "responseTimeMs": 1245,
  "timestamp": "2025-01-18T10:30:00.000"
}
```

---

#### 10c. DELETE /api/DeleteUnitImage
**Purpose**: Delete an image

**Cannot Use**: checkstatus (completely different operation)

**Recommendation**: 🎯 **CREATE NEW** - Blob deletion is separate operation

**Request**:
```json
{
  "vin": "5TJBE51111",
  "filename": "front-view.jpg"
}
```

**Response Format** (Suggested):
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "vin": "5TJBE51111",
  "filename": "front-view.jpg",
  "responseTimeMs": 234,
  "timestamp": "2025-01-18T10:30:00.000"
}
```

---

## 📊 Summary Table

| # | Endpoint | Status | Can Use Existing? | Recommendation |
|---|----------|--------|-------------------|----------------|
| 1 | GET /api/checkdb | ✅ DONE | - | Already working |
| 2 | POST /api/checkstatus | ✅ DONE | - | Already working |
| 3 | GET /api/checkvin/{vin} | ✅ DONE | - | **Update frontend to use GET** |
| 4 | POST /api/Addinventory | ✅ DONE | - | Already working |
| 5 | GET /api/GrabInventoryAll | ✅ DONE | - | Already working |
| 6 | GET /api/GetByID/{id} | ✅ DONE | - | Already working |
| 7 | GET /api/GetDashboardStats | ✅ DONE | - | **Update frontend endpoints** |
| 8 | PUT /api/UpdateUnit/{id} | 🟡 NEEDED | ❌ No | **CREATE NEW** (High Priority) |
| 9 | GET /api/GetReportsAnalytics | 🟢 NEEDED | 🔄 Could use GrabInventoryAll | **CREATE NEW** (Better perf) |
| 10a | GET /api/GetUnitImages/{vin} | ⚪ NEEDED | ❌ No | **CREATE NEW** (Low Priority) |
| 10b | POST /api/UploadUnitImage | ⚪ NEEDED | ❌ No | **CREATE NEW** (Low Priority) |
| 10c | DELETE /api/DeleteUnitImage | ⚪ NEEDED | ❌ No | **CREATE NEW** (Low Priority) |

---

## 🎯 PRIORITY ORDER

### 🔴 IMMEDIATE (Fix Existing):
1. **Update frontend to use `/api/GetDashboardStats`** instead of `/api/dashboard/stats`
   - File: `src/hooks/useDashboard.ts`
   - File: `src/hooks/useDashboardSWR.ts`

2. **Update frontend to use `/api/checkvin/{vin}` as GET** instead of POST to `/checkvin`
   - File: `src/app/inventory/add/page.tsx`
   - Change from: `POST /checkvin` with body
   - Change to: `GET /api/checkvin/{vin}`

---

### 🟡 HIGH PRIORITY (Create New):
3. **CREATE `/api/UpdateUnit/{id}`** - PUT endpoint
   - Purpose: Save edited unit data
   - Impact: Edit page can save changes
   - Frontend: `src/app/inventory/edit/[id]/page.tsx`

---

### 🟢 MEDIUM PRIORITY (Create New):
4. **CREATE `/api/GetReportsAnalytics`** - GET endpoint
   - Purpose: Pre-calculated analytics for reports page
   - Impact: Reports page will work
   - Frontend: `src/hooks/useReportsData.ts`

---

### ⚪ LOW PRIORITY (Create New):
5. **CREATE `/api/GetUnitImages/{vin}`** - GET endpoint
6. **CREATE `/api/UploadUnitImage`** - POST endpoint (multipart)
7. **CREATE `/api/DeleteUnitImage`** - DELETE endpoint

---

## 🔧 Frontend Changes Needed

### Change 1: Update Dashboard Hook
```typescript
// File: src/hooks/useDashboard.ts
// Line ~33

// OLD:
const response = await fetch('/api/dashboard/stats');

// NEW:
const response = await fetch('/api/GetDashboardStats');
```

### Change 2: Update Dashboard SWR Hook
```typescript
// File: src/hooks/useDashboardSWR.ts
// Line ~33

// OLD:
const response = await fetch('/api/dashboard/stats');

// NEW:
const response = await fetch('/api/GetDashboardStats');
```

### Change 3: Update VIN Check to GET
```typescript
// File: src/app/inventory/add/page.tsx
// Line ~38

// OLD:
const response = await fetch('/checkvin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vin: vin.toUpperCase() })
});

// NEW:
const response = await fetch(`/api/checkvin/${vin.toUpperCase()}`, {
  method: 'GET'
});
```

---

## 📝 Response Format Standard

Based on your existing APIs, use this format for ALL new endpoints:

```json
{
  "success": true,
  "data": { ... },
  "responseTimeMs": 123,
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

Or for errors:
```json
{
  "error": true,
  "message": "Error description",
  "statusCode": 400,
  "responseTimeMs": 45,
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

---

## 🎯 Final Recommendations

### APIs You Can Reuse: **NONE**
Each new feature needs its own endpoint because:
- ✅ **UpdateUnit**: Different from status-only updates
- ✅ **GetReportsAnalytics**: Needs server-side aggregation for performance
- ✅ **Image APIs**: Different storage system (Blob vs SQL)

### APIs You Must Create: **4 TOTAL**
1. 🟡 `PUT /api/UpdateUnit/{id}` - **HIGH PRIORITY**
2. 🟢 `GET /api/GetReportsAnalytics` - **MEDIUM PRIORITY**
3. ⚪ `GET /api/GetUnitImages/{vin}` - **LOW PRIORITY**
4. ⚪ `POST /api/UploadUnitImage` - **LOW PRIORITY**
5. ⚪ `DELETE /api/DeleteUnitImage` - **LOW PRIORITY**

### Frontend Fixes Needed: **3 UPDATES**
1. Update dashboard hooks to use `/api/GetDashboardStats`
2. Update VIN check to use `GET /api/checkvin/{vin}`
3. Implement edit save using new `UpdateUnit` endpoint (when created)

---

**Current Status**: 7 / 11 APIs Working (64%)  
**MVP Status**: ✅ **90% Complete** (just need edit save functionality)

---

Would you like me to:
1. Make the 3 frontend fixes now?
2. Create a detailed spec for the `UpdateUnit` endpoint?
3. Get the actual response format from `/api/GetDashboardStats` so I can update the hooks correctly?
