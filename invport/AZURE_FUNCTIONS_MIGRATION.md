# Azure Static Web Apps + Functions Migration Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Azure Static Web Apps                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌──────────────────┐          │
│  │  Static Frontend │         │ Azure Functions  │          │
│  │  (Next.js Export)│────────▶│     (API Layer)  │          │
│  │                 │  /api/*  │                  │          │
│  │  - React Pages  │         │  - Database Calls│          │
│  │  - Client JS    │         │  - Business Logic│          │
│  │  - CSS/Assets   │         │  - Image Upload  │          │
│  └─────────────────┘         └──────────────────┘          │
│                                        │                      │
│                                        ▼                      │
│                              ┌──────────────────┐            │
│                              │  Azure SQL DB    │            │
│                              │  + Blob Storage  │            │
│                              └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## What I've Done

### ✅ Updated Configuration Files

1. **next.config.ts**
   - Enabled `output: 'export'` for static build
   - Disabled server-side caching (not needed for static)
   - Kept image optimization settings

2. **staticwebapp.config.json** (NEW)
   - Configured API routing (`/api/*` → Azure Functions)
   - Set up SPA fallback routing (all routes → `index.html`)
   - Added cache control headers
   - Configured Node.js 20 runtime for functions

3. **Workflow (.github/workflows/...yml)**
   - Set `api_location: "./api"` to deploy Azure Functions
   - Set `output_location: "out"` for Next.js static export
   - Changed build command to `npm run build` (standard)

4. **apiUtils.ts**
   - Updated to call `/api` in both dev and production
   - Azure Static Web Apps automatically routes `/api/*` to managed functions
   - Development still uses `localhost:7071/api` for local testing

5. **inventory/page.tsx**
   - Removed `export const dynamic = 'force-dynamic'`
   - Now client-side only (data fetched via Azure Functions)

### ✅ What's Already Working

Your `api` folder already has:
- ✅ `host.json` - Azure Functions configuration
- ✅ `package.json` - Dependencies (mssql)
- ✅ `shared/database.js` - Connection pooling with circuit breaker
- ✅ `inventory/` function - GET inventory with pagination
- ✅ `GrabInventoryAll/` function - GET all inventory

## Migration Tasks

### Phase 1: Core API Routes (Do First) 🔥

These are critical for app functionality:

#### 1. Dashboard Stats
**Source**: `invport/src/app/api/dashboard/stats/route.ts`
**Create**: `api/dashboard-stats/` function

#### 2. Vehicles - Get by ID
**Source**: `invport/src/app/api/vehicles/[id]/route.ts`
**Create**: `api/vehicles-get/` function

#### 3. Vehicles - Add
**Source**: `invport/src/app/api/vehicles/add/route.ts`
**Create**: `api/vehicles-add/` function

#### 4. Vehicles - Update Status
**Source**: `invport/src/app/api/vehicles/[id]/status/route.ts`
**Create**: `api/vehicles-status/` function

#### 5. Images - Get by VIN
**Source**: `invport/src/app/api/images/[vin]/route.ts`
**Create**: `api/images-get/` function

### Phase 2: Additional Features

#### 6. Check VIN
**Source**: `invport/src/app/api/vehicles/check-vin/route.ts`
**Create**: `api/check-vin/` function

#### 7. Check Database
**Source**: `invport/src/app/api/checkdb/route.ts`
**Create**: `api/checkdb/` function

#### 8. Reports Analytics
**Source**: `invport/src/app/api/reports/analytics/route.ts`
**Create**: `api/reports-analytics/` function

### Phase 3: Cleanup (Optional)

- Delete duplicate endpoints (GrabInventoryAll vs inventory)
- Remove unused Next.js API routes folder
- Consolidate similar functions

## How Azure Functions Work in Static Web Apps

### URL Routing

```typescript
// Your frontend makes requests to:
fetch('/api/inventory')
fetch('/api/vehicles/add', { method: 'POST' })
fetch('/api/dashboard/stats')

// Azure Static Web Apps automatically routes to:
/api/inventory          → api/inventory/index.js
/api/vehicles/add       → api/vehicles-add/index.js
/api/dashboard/stats    → api/dashboard-stats/index.js
```

### Function Structure

Each function folder needs:
```
api/
  function-name/
    ├── function.json    # HTTP trigger configuration
    └── index.js         # Function handler
```

**function.json** template:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post", "put", "delete"],
      "route": "function-name"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

**index.js** template:
```javascript
const { getConnection, sql } = require('../shared/database');

module.exports = async function (context, req) {
  const startTime = Date.now();
  
  try {
    context.log('Function started');
    
    // Your logic here
    const connection = await getConnection();
    const result = await connection.request()
      .query('SELECT * FROM ...');
    
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: {
        success: true,
        data: result.recordset,
        duration: `${Date.now() - startTime}ms`
      }
    };
  } catch (error) {
    context.log.error('Error:', error);
    context.res = {
      status: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
};
```

## Environment Variables

### Development (.env.local)
```bash
# Azure Functions local
AZURE_FUNCTIONS_URL=http://localhost:7071/api

# Database (for local functions)
SQL_CONN_STRING=Server=your-server.database.windows.net;Database=your-db;User Id=user;Password=pass;Encrypt=true
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

### Production (Azure Portal)

1. Go to Azure Static Web App → Configuration
2. Add Application Settings:
   ```
   SQL_CONN_STRING=<your-connection-string>
   AZURE_STORAGE_CONNECTION_STRING=<your-storage-string>
   AZURE_STORAGE_ACCOUNT_NAME=flattstorage
   ```

## Testing Locally

### 1. Start Azure Functions
```powershell
cd api
npm install
func start
```
This starts functions at `http://localhost:7071`

### 2. Start Next.js Dev Server
```powershell
cd invport
npm run dev
```
This starts frontend at `http://localhost:3000`

### 3. Test API Calls
The frontend will automatically call `http://localhost:7071/api/*`

## Deployment Process

### Automated (GitHub Actions)

```bash
git add .
git commit -m "Migrate to Azure Functions"
git push origin main
```

GitHub Actions will:
1. ✅ Build Next.js static export (`npm run build` → `out/` folder)
2. ✅ Package Azure Functions (`api/` folder)
3. ✅ Deploy both to Azure Static Web Apps
4. ✅ Configure routing automatically

### Manual Testing After Deploy

Visit your Azure Static Web App URL and test:
- ✅ Dashboard loads (calls `/api/dashboard/stats`)
- ✅ Inventory list works (calls `/api/inventory`)
- ✅ Add vehicle works (calls `/api/vehicles/add`)
- ✅ Edit vehicle works (calls `/api/vehicles/{id}`)
- ✅ Images load (calls `/api/images/{vin}`)

## Migration Steps (Recommended Order)

### Step 1: Test Current Setup (5 minutes)
```powershell
# Build static export
cd invport
npm run build

# Check for errors
```

### Step 2: Create Core Functions (2-3 hours)
Use the template above to create:
1. `dashboard-stats` function
2. `vehicles-get` function  
3. `vehicles-add` function
4. `vehicles-status` function
5. `images-get` function

### Step 3: Update Next.js API Routes (30 minutes)
Since frontend uses `callExternalApi()`, routes act as proxies.
Options:
- **A**: Keep them as proxies (they'll work but add latency)
- **B**: Delete them (frontend calls Azure Functions directly)

**Recommended**: Delete Next.js `/api` routes since we're using Azure Functions

### Step 4: Test Locally (1 hour)
- Start functions: `cd api && func start`
- Start frontend: `cd invport && npm run dev`
- Test all features

### Step 5: Deploy (5 minutes)
```powershell
git add .
git commit -m "Complete Azure Functions migration"
git push origin main
```

### Step 6: Configure Azure (10 minutes)
1. Add environment variables in Azure Portal
2. Test production deployment
3. Monitor logs for errors

## Troubleshooting

### Build Fails with "dynamic routes not supported"

**Problem**: Next.js can't export dynamic routes like `/inventory/edit/[id]`

**Solution**: Use query parameters instead
```typescript
// Change from:
/inventory/edit/123

// To:
/inventory/edit?id=123

// Update your component:
import { useSearchParams } from 'next/navigation';

export default function EditPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  // ...
}
```

### API Calls Return 404

**Problem**: Azure Functions not deployed or routing misconfigured

**Solutions**:
1. Check `staticwebapp.config.json` exists in `invport/`
2. Verify `api_location: "./api"` in workflow
3. Check Azure Portal → Functions → Verify functions are deployed
4. Check function.json has correct `route` property

### Database Connection Fails

**Problem**: Missing environment variables

**Solution**:
1. Azure Portal → Your Static Web App → Configuration
2. Add all required environment variables
3. Restart the app (Configuration changes require restart)

### CORS Errors

**Problem**: Browser blocking API calls

**Solution**: Azure Static Web Apps handles CORS automatically
- Frontend and API share same domain
- No CORS configuration needed

## Benefits of This Architecture

### ✅ Advantages
- **Cost Effective**: Free tier includes 100GB bandwidth + 2 free apps
- **Automatic HTTPS**: SSL certificates managed automatically
- **Global CDN**: Static files served from edge locations worldwide
- **Integrated Auth**: Built-in authentication with Azure AD, GitHub, etc.
- **No Server Management**: Fully managed, auto-scaling
- **Fast Build & Deploy**: Automated via GitHub Actions

### ⚠️ Limitations
- **Function Timeout**: 10 minutes max (plenty for your use case)
- **No WebSockets**: (not needed for your app)
- **No Dynamic Routes**: Must use query parameters
- **Cold Starts**: First request may be slow (mitigated by connection pooling)

## Next Steps

1. **Review this guide** ✅
2. **Test current build**: `npm run build` in invport folder
3. **Create missing Azure Functions** (I can help with this!)
4. **Update dynamic routes** to use query parameters
5. **Test locally** with both servers running
6. **Deploy to production**
7. **Configure environment variables** in Azure Portal
8. **Test production deployment**

## Need Help?

I can help you with:
- Creating individual Azure Functions
- Converting dynamic routes to query parameters
- Debugging build or deployment issues
- Configuring environment variables
- Setting up local development
- Testing the migration

Just let me know which function you want to create first!

---

## Quick Reference

### File Locations
```
FuhrentInventoryPortal/
├── .github/workflows/
│   └── azure-static-web-apps-*.yml    ← Updated ✅
├── api/                                ← Azure Functions
│   ├── host.json                       ← Existing ✅
│   ├── package.json                    ← Existing ✅
│   ├── shared/
│   │   └── database.js                 ← Existing ✅
│   ├── inventory/                      ← Existing ✅
│   └── [create more functions here]    ← TODO
└── invport/                            ← Next.js App
    ├── next.config.ts                  ← Updated ✅
    ├── staticwebapp.config.json        ← Created ✅
    ├── src/
    │   ├── lib/apiUtils.ts             ← Updated ✅
    │   └── app/
    │       ├── inventory/page.tsx      ← Updated ✅
    │       └── api/                    ← Can be deleted after migration
    └── out/                            ← Build output (static files)
```

### Commands
```powershell
# Local Development
cd api && func start                    # Start Azure Functions
cd invport && npm run dev               # Start Next.js dev

# Build & Test
cd invport && npm run build             # Build static export

# Deploy
git push origin main                    # Triggers auto-deploy
```

### URLs
- **Local Frontend**: http://localhost:3000
- **Local Functions**: http://localhost:7071/api
- **Production**: https://your-app.azurestaticapps.net
- **Production API**: https://your-app.azurestaticapps.net/api

