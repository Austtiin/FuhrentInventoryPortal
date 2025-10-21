# External Function App Configuration

## Problem

Your Azure Static Web App was getting 404 errors when calling `/api/*` endpoints because:

1. **Static Web App** is at: `https://mango-coast-05a52d510.3.azurestaticapps.net`
2. **Function App** is at: `https://flatt-api-functions-hcfrf0cnecgqafgw.centralus-01.azurewebsites.net`
3. Static Web App was looking for managed functions in its own `/api` folder (which didn't exist)
4. The actual functions are in a separate Function App

## Solution

Configure Azure Static Web App to **proxy** all `/api/*` requests to your external Function App.

### Changes Made

#### 1. Updated `staticwebapp.config.json`

Added a rewrite rule to proxy API calls:

```json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://flatt-api-functions-hcfrf0cnecgqafgw.centralus-01.azurewebsites.net/api/{*path}",
      "allowedRoles": ["anonymous"]
    }
  ]
}
```

**What this does:**
- When frontend calls `/api/checkdb`, Static Web App rewrites it to:
  - `https://flatt-api-functions-hcfrf0cnecgqafgw.centralus-01.azurewebsites.net/api/checkdb`
- The `{*path}` captures everything after `/api/` and passes it along

#### 2. Updated GitHub Actions Workflow

Changed `api_location` from `"./api"` to `""` (empty string):

```yaml
api_location: "" # No managed functions - using external Function App
```

**Why:**
- Tells Azure Static Web Apps we're NOT deploying managed functions
- Stops it from looking for functions in the repo
- Relies on the proxy rule instead

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Static Web App)                               │
│ https://mango-coast-05a52d510.3.azurestaticapps.net    │
│                                                         │
│ ┌─────────────┐                                        │
│ │   Browser   │                                        │
│ │             │                                        │
│ │  fetch('/api/checkdb')                              │
│ └──────┬──────┘                                        │
│        │                                                │
│        v                                                │
│ ┌─────────────────────────────────────────┐           │
│ │ staticwebapp.config.json                │           │
│ │                                         │           │
│ │ Rewrite rule:                          │           │
│ │ /api/* → https://flatt-api...net/api/* │           │
│ └──────────────┬──────────────────────────┘           │
└────────────────┼──────────────────────────────────────┘
                 │
                 │ Proxy Request
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│ Backend (External Function App)                         │
│ https://flatt-api-functions-hcfrf0cnecgqafgw            │
│        .centralus-01.azurewebsites.net                  │
│                                                         │
│ ┌─────────────────────────────────────────┐           │
│ │ Azure Functions                         │           │
│ │                                         │           │
│ │ /api/checkdb                           │           │
│ │ /api/dashboard/stats                   │           │
│ │ /api/inventory                         │           │
│ │ etc...                                 │           │
│ └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## How It Works

1. **Client-side code** calls: `fetch('/api/checkdb')`
2. **Browser** requests: `https://mango-coast-05a52d510.3.azurestaticapps.net/api/checkdb`
3. **Static Web App** sees the rewrite rule and proxies to:
   - `https://flatt-api-functions-hcfrf0cnecgqafgw.centralus-01.azurewebsites.net/api/checkdb`
4. **Function App** processes the request
5. **Response** flows back through the proxy to the browser

## Benefits

✅ **No CORS issues** - Frontend and API appear to be on same domain  
✅ **Clean URLs** - Frontend uses simple `/api/*` paths  
✅ **Separation of concerns** - Frontend and backend deployed independently  
✅ **Scalability** - Function App can scale separately from Static Web App  

## Testing

After deploying these changes:

1. **Deploy to production:**
   ```powershell
   git add .
   git commit -m "Configure external Function App proxy"
   git push origin main
   ```

2. **Wait for deployment** (check GitHub Actions)

3. **Test in browser:**
   - Open: `https://mango-coast-05a52d510.3.azurestaticapps.net`
   - Open DevTools Console (F12)
   - Navigate to Dashboard
   - Should see successful API calls (200 status codes)

4. **Verify proxy is working:**
   - Look at console logs
   - Should still show: `🔗 [API URL] Building: { finalUrl: '/api/dashboard/stats' }`
   - Should see: `📡 [API Response] 200` (not 404)

## Important Notes

### CORS Configuration

Your Function App needs to allow requests from your Static Web App domain:

**In Azure Portal:**
1. Go to your Function App: `flatt-api-functions-hcfrf0cnecgqafgw`
2. Settings → Configuration → CORS
3. Add allowed origin: `https://mango-coast-05a52d510.3.azurestaticapps.net`

**Or add to Function App's `host.json`:**
```json
{
  "extensions": {
    "http": {
      "routePrefix": "api",
      "cors": {
        "allowedOrigins": [
          "https://mango-coast-05a52d510.3.azurestaticapps.net"
        ]
      }
    }
  }
}
```

### Authentication

If you add authentication later:
- Static Web App handles user authentication
- Passes authentication headers to Function App via proxy
- Function App can read `x-ms-client-principal` header

### Environment Variables

If your functions need environment variables:
- Set them in the **Function App** (not Static Web App)
- Go to Function App → Configuration → Application Settings

## Alternative: Managed Functions

If you want to use managed functions instead (deploy functions WITH the Static Web App):

1. Copy your functions to `./api` folder in the repo
2. Change workflow back to: `api_location: "./api"`
3. Remove the rewrite rule from `staticwebapp.config.json`
4. Change back to: `"route": "/api/*", "allowedRoles": ["anonymous"]`

**Trade-offs:**
- ✅ Simpler deployment (one place)
- ✅ No CORS configuration needed
- ❌ Can't use existing Function App
- ❌ Functions redeploy with every frontend change

