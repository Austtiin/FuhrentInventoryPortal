# Production API Debug Logging

## Overview
Enhanced logging has been added to `apiClient.ts` to help diagnose production API connection issues.

## What Was Added

### 1. Module Initialization Logging
When the API client loads in the browser, it logs:
```
🚀 [API Client] Initializing in browser: {
  environment, hostname, origin, userAgent
}
```

### 2. Environment Detection Logging
Every time `getApiBaseUrl()` is called:
```
🔧 [API Config] Environment: {
  NODE_ENV, isDevelopment, baseUrl, hostname, origin
}
```

### 3. URL Construction Logging
Every time `buildApiUrl()` is called:
```
🔗 [API URL] Building: {
  endpoint, cleanEndpoint, baseUrl, finalUrl
}
```

### 4. Comprehensive Fetch Logging
For every API request attempt:

**Before Request:**
```
🔄 [API Fetch] Attempt 1: {
  url, method, headers, hasBody
}
```

**After Response:**
```
📡 [API Response] 200: {
  status, headers, duration, ok
}
📦 [API Response Body]: { actual response data }
```

**On Error:**
```
❌ [API Error]: {
  error: message,
  stack: trace
}
```

**On Retry:**
```
⚠️ [API Retry] Attempt failed, retrying...
```

**On Fatal Failure:**
```
❌ [API Fatal] All 4 attempts failed for /api/endpoint
```

## How to Use

### Step 1: Deploy
```powershell
git add .
git commit -m "Add comprehensive API debug logging"
git push origin main
```

### Step 2: Wait for Deployment
Monitor GitHub Actions workflow until deployment completes.

### Step 3: Test in Production
1. Open your production site: https://[your-site].azurestaticapps.net
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Navigate through your app:
   - Go to Dashboard
   - Go to Inventory
   - Try any actions that call APIs

### Step 4: Analyze Console Output
Look for the emoji indicators to trace the API call flow:
- 🚀 = API client initialized (shows environment)
- 🔧 = Environment detected (dev vs prod)
- 🔗 = URL constructed (what endpoint is being called)
- 🔄 = Request attempt (what is being sent)
- 📡 = Response received (status code)
- 📦 = Response body (actual data)
- ❌ = Error occurred (what went wrong)

## What the Logs Will Tell You

### If API is failing, logs will show:

1. **Environment Issue**
   ```
   🔧 [API Config] Environment: { NODE_ENV: 'development', ... }
   ```
   If you see `development` in production, there's a build/environment issue.

2. **URL Issue**
   ```
   🔗 [API URL] Building: { baseUrl: 'http://localhost:7071/api', ... }
   ```
   If you see `localhost` in production, environment detection is broken.

3. **Routing Issue**
   ```
   📡 [API Response] 404: { status: 404, ... }
   ```
   Azure Functions not deployed or wrong route.

4. **CORS/Network Issue**
   ```
   ❌ [API Error]: { error: 'Failed to fetch', ... }
   ```
   Network error, CORS, or firewall issue.

5. **Function Error**
   ```
   📡 [API Response] 500: { status: 500, ... }
   📦 [API Response Body]: { error: 'Something went wrong' }
   ```
   Azure Function crashed or returned error.

## Common Issues and Patterns

### Pattern 1: All 404s
```
📡 [API Response] 404
```
**Diagnosis:** Functions not deployed to Azure  
**Solution:** Verify `api/` folder deploys in GitHub Actions

### Pattern 2: CORS errors
```
❌ [API Error]: CORS policy blocked
```
**Diagnosis:** API on different domain  
**Solution:** Verify using relative /api paths, not full URLs

### Pattern 3: Localhost in production
```
🔗 [API URL] Building: { baseUrl: 'http://localhost:7071/api' }
```
**Diagnosis:** Environment detection failing  
**Solution:** Check NODE_ENV in build process

### Pattern 4: Immediate fetch failures
```
❌ [API Error]: Failed to fetch
```
**Diagnosis:** Network error before reaching server  
**Solution:** Check network connectivity, firewall, DNS

## Next Steps After Getting Logs

1. Copy the console output (especially lines with 🚀🔧🔗🔄📡📦❌)
2. Share with development team
3. Identify which stage is failing:
   - Initialization?
   - Environment detection?
   - URL construction?
   - Network request?
   - Server response?
4. Apply targeted fix based on identified issue

## Disabling Logs Later

Once issue is resolved, you can disable verbose logging by editing `apiClient.ts`:

```typescript
// Change these to false
const DEBUG_ENABLED = false;
const DEBUG_RESPONSE_BODY = false;
```

But for now, leave them enabled to help with diagnosis!

