# CRITICAL: Link External Function App in Azure Portal

## The Problem

Your Static Web App config file **cannot** proxy to external URLs using `rewrite`. That's not how Azure Static Web Apps work.

The logs show:
```
📡 [API Response] 200: Content-Type: text/html
📦 [API Response Body]: Non-JSON content type: text/html
```

This means Azure is returning your `index.html` instead of proxying to the Function App.

## The Solution

You MUST link your Function App in the **Azure Portal**. Config files alone cannot do this.

### Step 1: Open Azure Portal

1. Go to: https://portal.azure.com
2. Navigate to your Static Web App: **mango-coast-05a52d510**

### Step 2: Link the Function App

1. In the Static Web App, go to **Settings** → **APIs**
2. Click **Link** (or **Link to a Function App**)
3. Select your Function App:
   - **Resource Group**: Select your resource group
   - **Function App**: `flatt-api-functions-hcfrf0cnecgqafgw`
4. Click **Link**

### Step 3: Verify the Link

After linking, Azure will:
- Automatically route `/api/*` requests from your Static Web App to the Function App
- Handle authentication headers
- Manage CORS automatically
- Show "Linked" status in the portal

### Step 4: Test

1. No need to redeploy! The link happens at the platform level.
2. Refresh your Static Web App: `https://mango-coast-05a52d510.3.azurestaticapps.net`
3. Open DevTools Console
4. Navigate to Dashboard
5. Should now see JSON responses (not HTML)!

## Why Config File Didn't Work

Azure Static Web Apps has **two modes** for APIs:

### Mode 1: Managed Functions (Built-in)
- Functions deployed WITH the Static Web App
- Lives in `./api` folder in your repo
- Config file: Just needs `"route": "/api/*"`
- Workflow: `api_location: "./api"`

### Mode 2: Linked Function App (External)
- Separate Function App resource
- **Must be linked in Azure Portal** (cannot be done via config file)
- Config file: Just needs `"route": "/api/*"` (no rewrite!)
- Workflow: `api_location: ""`

**You're using Mode 2**, so you MUST link it in the portal.

## What I Fixed in Config

Removed the invalid `rewrite` line:
```json
// ❌ WRONG - This doesn't work in Azure Static Web Apps
{
  "route": "/api/*",
  "rewrite": "https://flatt-api-functions-hcfrf0cnecgqafgw.centralus-01.azurewebsites.net/api/{*path}"
}

// ✅ CORRECT - Just allow the route, link in portal
{
  "route": "/api/*",
  "allowedRoles": ["anonymous"]
}
```

## Alternative: Use Managed Functions

If you don't want to link in the portal, you can switch to **managed functions**:

1. Copy your Function App code to `./api` folder in repo
2. Update workflow: `api_location: "./api"`
3. Deploy - functions will be built-in

**Trade-offs:**
- ✅ No portal configuration needed
- ✅ Simpler deployment
- ❌ Can't reuse existing Function App
- ❌ Functions redeploy with every frontend change

## Next Steps

### Option A: Link in Portal (Recommended)
1. Go to Azure Portal
2. Link Function App (see steps above)
3. Test immediately (no redeploy needed)

### Option B: Switch to Managed Functions
1. Copy functions to `./api` folder
2. Update workflow
3. Deploy

**Choose Option A** since you already have a working Function App!

## Verification

After linking in portal, console should show:
```
🔄 [API Fetch] Attempt 1/4: {url: '/api/dashboard/stats', ...}
📡 [API Response] 200: {...}
📦 [API Response Body]: { /* JSON data */ } ← Not HTML!
```

