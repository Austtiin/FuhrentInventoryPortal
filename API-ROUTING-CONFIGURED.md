# ✅ API Routing Configuration Complete

**Date**: January 18, 2025  
**Status**: ✅ **CONFIGURED & READY TO TEST**

---

## 🎯 What Was Changed

Your Next.js app now automatically routes API calls based on environment:

### Development (npm run dev)
- **API calls go to**: `http://localhost:7071/api/`
- **Why**: Azure Functions local development server
- **Start Azure Functions**: `func start` (in Azure Functions directory)
- **Start Next.js**: `npm run dev` (in invport directory)

### Production (Azure Static Web App)
- **API calls go to**: `/api/`
- **Why**: Azure SWA automatically proxies `/api/*` to your deployed Azure Functions
- **No changes needed**: Works automatically on deployment

---

## 📁 Files Created/Modified

### 1. ✅ Environment Files Created

**`.env.local`** (Development - Already created)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:7071/api
```
- Used when running `npm run dev`
- Routes all API calls to Azure Functions local dev server
- **DO NOT commit this file** (added to .gitignore)

**`.env.production`** (Production - Already created)
```env
NEXT_PUBLIC_API_BASE_URL=/api
```
- Used in production builds
- Routes API calls to relative `/api` path
- Azure SWA proxies these to Azure Functions

---

### 2. ✅ API Client Utility Created

**`src/lib/apiClient.ts`** - New file
- `getApiBaseUrl()` - Returns correct base URL for environment
- `buildApiUrl(endpoint)` - Builds full API URL
- `apiFetch(endpoint, options)` - Fetch wrapper that uses correct base URL
- `apiFetchJson<T>(endpoint, options)` - Type-safe JSON fetch

**Usage Example**:
```typescript
import { apiFetch } from '@/lib/apiClient';

// In dev: http://localhost:7071/api/GrabInventoryAll
// In prod: /api/GrabInventoryAll
const response = await apiFetch('/GrabInventoryAll');
```

---

### 3. ✅ Updated Files (All API calls now use `apiFetch`)

**Hooks Updated**:
- ✅ `src/hooks/useReportsData.ts` - Reports dashboard
- ✅ `src/hooks/useDashboard.ts` - Dashboard stats
- ✅ `src/hooks/useDashboardSWR.ts` - Dashboard stats (SWR)
- ✅ `src/hooks/useInventoryAPI.ts` - Inventory list

**Pages Updated**:
- ✅ `src/app/inventory/add/page.tsx` - VIN check, add inventory
- ✅ `src/app/inventory/edit/[id]/page.tsx` - Get, update, status change
- ✅ `src/app/inventory/InventoryPageClient.tsx` - Mark as sold

**All API calls now automatically route to**:
- `http://localhost:7071/api/` in development
- `/api/` in production

---

## 🧪 Testing Instructions

### Step 1: Start Azure Functions Local Server

```powershell
# Navigate to your Azure Functions folder
cd path\to\azure\functions

# Start Azure Functions (will run on port 7071)
func start
```

**Expected Output**:
```
Functions:
    GrabInventoryAll: [GET] http://localhost:7071/api/GrabInventoryAll
    GetByID: [GET] http://localhost:7071/api/GetByID/{id}
    checkstatus: [POST] http://localhost:7071/api/checkstatus
    ...
```

---

### Step 2: Start Next.js Dev Server

```powershell
# In a NEW terminal, navigate to invport folder
cd d:\Documents\GitHub\FuhrentInventoryPortal\invport

# Start Next.js dev server
npm run dev
```

**Expected Output**:
```
▲ Next.js 15.5.4 (Turbopack)
- Local: http://localhost:3000
- Network: http://192.168.1.16:3000
- Environments: .env.local  ← Should see this!
```

---

### Step 3: Test API Calls

Open browser to `http://localhost:3000` and check:

1. **Dashboard** (`/`)
   - Should load stats from `http://localhost:7071/api/GetDashboardStats`
   - Check browser DevTools → Network tab
   - Look for `[API] GET http://localhost:7071/api/GetDashboardStats` in console

2. **Inventory List** (`/inventory`)
   - Should load from `http://localhost:7071/api/GrabInventoryAll`
   - Check Network tab for `http://localhost:7071/api/GrabInventoryAll`

3. **Add Inventory** (`/inventory/add`)
   - Enter VIN and tab out
   - Should call `http://localhost:7071/api/checkvin/{vin}`
   - Submit form → calls `http://localhost:7071/api/Addinventory`

4. **Edit Inventory** (`/inventory/edit/{id}`)
   - Should load from `http://localhost:7071/api/GetByID/{id}`
   - Save changes → calls `http://localhost:7071/api/vehicles/{id}`
   - Status change → calls `http://localhost:7071/api/checkstatus`

5. **Reports** (`/reports`)
   - Should call `http://localhost:7071/api/GetReportsDashboard`

---

## 🔍 Debugging

### Check Environment Variable

Add this to any page temporarily to debug:
```typescript
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
```

**Expected**:
- Dev: `http://localhost:7071/api`
- Prod: `/api`

### Check API Client Config

Import and log the config:
```typescript
import { API_CONFIG } from '@/lib/apiClient';
console.log('API Config:', API_CONFIG);
```

**Expected Output** (Development):
```json
{
  "baseUrl": "http://localhost:7071/api",
  "environment": "development",
  "isLocal": true
}
```

### Check Network Tab

Open browser DevTools → Network tab:
- ✅ **Correct**: Requests to `http://localhost:7071/api/*`
- ❌ **Wrong**: Requests to `/api/*` (getting 404)

---

## 🚀 Production Deployment

### No Changes Needed!

When you deploy to Azure Static Web App:
1. Build process uses `.env.production`
2. Sets `NEXT_PUBLIC_API_BASE_URL=/api`
3. Azure SWA automatically proxies `/api/*` to Azure Functions
4. Everything just works! ✨

### Verify Production Build Locally

```powershell
# Build for production
npm run build

# Start production server
npm start
```

API calls should use `/api/` (relative path) instead of `localhost:7071`.

---

## 📝 Summary

### What You Need to Do:

1. ✅ **Start Azure Functions**: `func start` (port 7071)
2. ✅ **Start Next.js**: `npm run dev` (port 3000)
3. ✅ **Test all pages**: Dashboard, Inventory, Add, Edit, Reports
4. ✅ **Check Network tab**: Verify calls go to `localhost:7071`

### What's Automatic:

- ✅ Development routes to Azure Functions local server
- ✅ Production routes to Azure Functions in cloud
- ✅ All hooks and pages use new API client
- ✅ Environment variables control routing
- ✅ No code changes needed for deployment

---

## ⚠️ Common Issues

### Issue: API calls still going to `/api/` not `localhost:7071`

**Solution**: Restart dev server to reload `.env.local`
```powershell
# Stop dev server (Ctrl+C)
# Start again
npm run dev
```

### Issue: 404 errors on API calls

**Check**:
1. ✅ Azure Functions server running on port 7071?
2. ✅ Functions visible in `func start` output?
3. ✅ `.env.local` file exists in `invport/` folder?
4. ✅ Dev server shows "Environments: .env.local" on startup?

### Issue: CORS errors

**Solution**: Azure Functions local dev allows all origins by default. If you see CORS errors, check your Azure Functions `host.json`:
```json
{
  "version": "2.0",
  "extensions": {
    "http": {
      "routePrefix": "api",
      "cors": {
        "allowedOrigins": ["*"]
      }
    }
  }
}
```

---

**Last Updated**: January 18, 2025  
**Status**: ✅ **READY TO TEST**  
**Next Step**: Start both servers and test all pages!
