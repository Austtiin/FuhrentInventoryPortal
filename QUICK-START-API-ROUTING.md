# 🚀 Quick Start Guide - API Routing

## Development Setup (2 Steps)

### 1. Start Azure Functions Local Server
```powershell
# Terminal 1
cd path\to\your\azure\functions\folder
func start
```
**Wait for**: Functions listed on `http://localhost:7071/api/`

### 2. Start Next.js Dev Server
```powershell
# Terminal 2
cd d:\Documents\GitHub\FuhrentInventoryPortal\invport
npm run dev
```
**Look for**: `- Environments: .env.local` in startup output

## How It Works

### Development (npm run dev)
```
Frontend (localhost:3000) 
    → API call: /GrabInventoryAll
    → Routed to: http://localhost:7071/api/GrabInventoryAll
    → Azure Functions local server responds
```

### Production (Azure SWA)
```
Frontend (your-app.azurestaticapps.net)
    → API call: /api/GrabInventoryAll
    → Azure SWA proxy routes to Azure Functions
    → Azure Functions cloud responds
```

## API Client Usage

All files now use `apiFetch` from `@/lib/apiClient`:

```typescript
import { apiFetch } from '@/lib/apiClient';

// Simple GET
const response = await apiFetch('/GrabInventoryAll');

// POST with body
const response = await apiFetch('/Addinventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

## Environment Files

**`.env.local`** (Dev - DO NOT COMMIT)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:7071/api
```

**`.env.production`** (Prod - CAN COMMIT)
```env
NEXT_PUBLIC_API_BASE_URL=/api
```

## Troubleshooting

### APIs returning 404?
- ✅ Is Azure Functions running on port 7071?
- ✅ Did you restart Next.js dev server after creating `.env.local`?
- ✅ Check browser Network tab - requests going to `localhost:7071`?

### APIs still using wrong URL?
```powershell
# Restart dev server to reload environment
npm run dev
```

### Check current configuration:
```typescript
import { API_CONFIG } from '@/lib/apiClient';
console.log(API_CONFIG);
// Dev: { baseUrl: "http://localhost:7071/api", isLocal: true }
// Prod: { baseUrl: "/api", isLocal: false }
```

---

**Status**: ✅ All files updated  
**Next**: Start both servers and test!
