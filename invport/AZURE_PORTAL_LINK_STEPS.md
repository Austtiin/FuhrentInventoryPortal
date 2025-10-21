# Azure Portal: Link Function App Instructions

## The Issue
Your Static Web App is returning HTML (index.html) instead of calling your Function App because **the Function App is not linked in Azure Portal**.

Config files CANNOT proxy to external Function Apps - you must link them in the portal!

## Step-by-Step Instructions

### 1. Open Azure Portal
```
https://portal.azure.com
```

### 2. Find Your Static Web App
- Search for: **Static Web Apps**
- Click on: **mango-coast-05a52d510**

### 3. Navigate to APIs Section
In the left sidebar:
```
Settings → APIs
```
or
```
Settings → Configuration → APIs tab
```

### 4. Link the Function App

You'll see one of these options:

#### Option A: "Link" Button
- Click **Link** or **Link to a Function App**
- Select:
  - **Subscription**: Your Azure subscription
  - **Resource Group**: Your resource group
  - **Function App**: `flatt-api-functions-hcfrf0cnecgqafgw`
- Click **Link**

#### Option B: "Backend" Section
- Click **Configure backend**
- Choose **Azure Functions**
- Select your Function App from the dropdown:
  - `flatt-api-functions-hcfrf0cnecgqafgw`
- Click **Save**

### 5. Verify the Link

After linking, you should see:
```
Backend: Linked to flatt-api-functions-hcfrf0cnecgqafgw
Status: Active
Region: Central US
```

### 6. Test Immediately

**No need to redeploy!** The link works immediately.

1. Open: `https://mango-coast-05a52d510.3.azurestaticapps.net`
2. Hard refresh: `Ctrl+F5` (clear cache)
3. Open DevTools Console (F12)
4. Navigate to Dashboard
5. Check console logs:

**Before linking (wrong):**
```
📦 [API Response Body]: Non-JSON content type: text/html
Response body: <!DOCTYPE html>...
```

**After linking (correct):**
```
📦 [API Response Body]: { totalVehicles: 120, ... }
✅ JSON data received!
```

## Important Notes

### CORS Configuration
Once linked, Azure handles CORS automatically between Static Web App and Function App. You don't need to configure CORS manually!

### Authentication
If you enable authentication on the Static Web App, it will automatically pass auth tokens to the linked Function App via the `x-ms-client-principal` header.

### Region Considerations
- Your Static Web App is in: **East US 2**
- Your Function App is in: **Central US**

This is fine! Azure handles the cross-region communication automatically. However, for best performance, consider deploying them in the same region in the future.

### Cost
Linking a Function App to a Static Web App:
- ✅ No additional cost for the link itself
- 💰 You pay for Function App usage (per execution/consumption)
- 💰 You pay for Static Web App hosting

## Troubleshooting

### Can't Find "APIs" or "Link" Button?

Try these alternative paths:

**Path 1:**
```
Static Web App → Configuration → Application settings → APIs
```

**Path 2:**
```
Static Web App → Settings → APIs (in left menu)
```

**Path 3:**
```
Static Web App → Overview → Click "Configure" next to "API"
```

### Link Option Not Available?

You might need to:
1. Ensure you have **Contributor** or **Owner** role on both resources
2. Ensure both resources are in the same **subscription**
3. Try using Azure CLI instead (see below)

## Alternative: Azure CLI

If the portal doesn't work, use Azure CLI:

```powershell
# Login to Azure
az login

# Link the Function App
az staticwebapp backends link `
  --name mango-coast-05a52d510 `
  --resource-group <your-resource-group> `
  --backend-resource-id /subscriptions/<subscription-id>/resourceGroups/<rg-name>/providers/Microsoft.Web/sites/flatt-api-functions-hcfrf0cnecgqafgw
```

To get the Function App resource ID:
```powershell
az functionapp show `
  --name flatt-api-functions-hcfrf0cnecgqafgw `
  --resource-group <your-resource-group> `
  --query id
```

## What Happens After Linking?

1. **Automatic Routing**: All `/api/*` requests automatically go to your Function App
2. **No CORS Needed**: Same-origin from browser's perspective
3. **Auth Passthrough**: Authentication tokens forwarded automatically
4. **Instant**: No deployment needed, works immediately

## Expected Result

After linking, your console logs should show:

```
🔄 [API Fetch] Attempt 1/4: {url: '/api/dashboard/stats', method: 'GET', ...}
📡 [API Response] 200: {status: 200, statusText: 'OK', ...}
📦 [API Response Body]: {
  totalVehicles: 120,
  activeListings: 95,
  soldThisMonth: 18,
  averagePrice: 28500,
  recentActivity: [...]
}
✅ [API Response] 200 GET /api/dashboard/stats
```

**Key change:** `text/html` → **JSON data!**

## Need Help?

If you can't find the link option or it's not working:
1. Share a screenshot of your Static Web App overview page
2. Share your resource group name
3. Confirm you have Contributor/Owner access
4. Try the Azure CLI method above
