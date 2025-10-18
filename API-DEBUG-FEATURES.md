# 🐛 API Debug Console Features

**Date**: October 18, 2025  
**Status**: ✅ **ENABLED BY DEFAULT**

---

## 🎯 What's New

Your API client now includes **comprehensive console debugging** that shows:
- 📤 Every API request (method, URL, body)
- 📥 Every API response (status, data, duration)
- ❌ All errors with full details
- ⏱️ Request timing in milliseconds
- 🎨 Color-coded output for easy reading

---

## 🖥️ Console Output Examples

### Example 1: Successful GET Request

```
🚀 [API Request] GET http://localhost:7071/api/GrabInventoryAll
  ⏰ Timestamp: 2025-10-18T14:30:45.123Z
  🌐 Full URL: http://localhost:7071/api/GrabInventoryAll?page=1&limit=10
  📤 Method: GET

✅ [API Response] 200 GET http://localhost:7071/api/GrabInventoryAll
  ⏰ Timestamp: 2025-10-18T14:30:45.456Z
  📊 Status: 200 OK
  ⚡ Duration: 333ms
  📥 Response Data:
  {
    "success": true,
    "data": [
      { "UnitID": 1, "Make": "Ice Castle", "Model": "Extreme III", ... },
      { "UnitID": 2, "Make": "Ford", "Model": "F-150", ... }
    ],
    "responseTimeMs": 323,
    "timestamp": "2025-10-18T14:30:45.456Z"
  }
```

---

### Example 2: POST Request with Body

```
🚀 [API Request] POST http://localhost:7071/api/Addinventory
  ⏰ Timestamp: 2025-10-18T14:31:22.789Z
  🌐 Full URL: http://localhost:7071/api/Addinventory
  📤 Method: POST
  📦 Request Body:
  {
    "vin": "5TJBE51111",
    "year": 2024,
    "make": "Ice Castle Fish House",
    "model": "Extreme III",
    "price": 54950.00,
    "status": "Available"
  }

✅ [API Response] 201 POST http://localhost:7071/api/Addinventory
  ⏰ Timestamp: 2025-10-18T14:31:23.012Z
  📊 Status: 201 Created
  ⚡ Duration: 223ms
  📥 Response Data:
  {
    "success": true,
    "message": "Unit added successfully",
    "data": { "UnitID": 123 },
    "responseTimeMs": 213
  }
```

---

### Example 3: Failed Request (404)

```
🚀 [API Request] GET http://localhost:7071/api/GetByID/999
  ⏰ Timestamp: 2025-10-18T14:32:10.456Z
  🌐 Full URL: http://localhost:7071/api/GetByID/999
  📤 Method: GET

❌ [API Response] 404 GET http://localhost:7071/api/GetByID/999
  ⏰ Timestamp: 2025-10-18T14:32:10.501Z
  📊 Status: 404 Not Found
  ⚡ Duration: 45ms
  📥 Response Data:
  {
    "success": false,
    "error": "Unit not found",
    "responseTimeMs": 35
  }
```

---

### Example 4: Network Error

```
🚀 [API Request] GET http://localhost:7071/api/GrabInventoryAll
  ⏰ Timestamp: 2025-10-18T14:33:00.123Z
  🌐 Full URL: http://localhost:7071/api/GrabInventoryAll
  📤 Method: GET

❌ [API Error] GET http://localhost:7071/api/GrabInventoryAll
  ⏰ Timestamp: 2025-10-18T14:33:00.234Z
  🚨 Error: TypeError: Failed to fetch
```

---

## ⚙️ Configuration Options

Edit `src/lib/apiClient.ts` to customize:

### Option 1: Disable All Debug Output
```typescript
const DEBUG_ENABLED = false; // ← Change to false
```
**Result**: No console logs at all

### Option 2: Hide Response Bodies
```typescript
const DEBUG_RESPONSE_BODY = false; // ← Change to false
```
**Result**: Shows request/response metadata but hides data payloads

### Option 3: Custom Debug Levels (Advanced)
```typescript
const DEBUG_CONFIG = {
  enabled: true,
  showRequests: true,
  showResponses: true,
  showRequestBody: true,
  showResponseBody: true,
  showErrors: true,
  showTiming: true
};
```

---

## 🎨 Color Coding

The console output uses colors to make it easy to scan:

| Color | Meaning | Used For |
|-------|---------|----------|
| 🔵 Blue | Information | URLs, general info |
| 🟢 Green | Success | 2xx responses, successful operations |
| 🟠 Orange | Data | Request/response bodies |
| 🟣 Purple | Performance | Timing information |
| 🔴 Red | Error | 4xx/5xx responses, exceptions |
| ⚪ Gray | Metadata | Timestamps |

---

## 📊 What Gets Logged

### For Every Request:
- ⏰ **Timestamp** - When request started
- 🌐 **Full URL** - Complete URL with query params
- 📤 **HTTP Method** - GET, POST, PUT, DELETE, etc.
- 📦 **Request Body** - JSON payload (if present)

### For Every Response:
- ⏰ **Timestamp** - When response received
- 📊 **Status Code** - 200, 404, 500, etc.
- ⚡ **Duration** - Request time in milliseconds
- 📥 **Response Data** - Full JSON response body

### For Every Error:
- ⏰ **Timestamp** - When error occurred
- 🚨 **Error Details** - Full error message and stack trace

---

## 🔍 How to Use for Debugging

### 1. Check if API is being called
Open browser console (F12) and navigate through your app:
- ✅ See `🚀 [API Request]` logs? API is being called
- ❌ No logs? Component might not be triggering the request

### 2. Verify correct endpoint
Check the URL in the request log:
- ✅ `http://localhost:7071/api/...`? Correct (dev mode)
- ❌ `/api/...`? Missing environment config

### 3. Inspect request data
Expand `📦 Request Body` to see exactly what you're sending:
- Verify all required fields are present
- Check data types are correct
- Ensure no undefined/null values where not expected

### 4. Check response status
Look at the response emoji and status:
- ✅ Green checkmark + 2xx? Success!
- ❌ Red X + 4xx? Client error (bad request, not found, etc.)
- ❌ Red X + 5xx? Server error (check Azure Functions logs)

### 5. Examine response data
Expand `📥 Response Data` to see what the API returned:
- Compare with expected format
- Check for success/error flags
- Verify data structure matches TypeScript types

### 6. Monitor performance
Check `⚡ Duration` to spot slow requests:
- ✅ < 100ms: Very fast
- ⚠️ 100-500ms: Normal
- ❌ > 500ms: Slow (might need optimization)

---

## 📋 Common Debugging Scenarios

### Scenario 1: Page loads but no data shows

**Check console for**:
```
✅ [API Response] 200 GET ...
  📥 Response Data: []
```
**Diagnosis**: API works but returns empty array
**Solution**: Check if data exists in database

---

### Scenario 2: Error says "Failed to fetch"

**Check console for**:
```
❌ [API Error] GET http://localhost:7071/api/...
  🚨 Error: TypeError: Failed to fetch
```
**Diagnosis**: Can't reach Azure Functions server
**Solution**: 
1. Is Azure Functions running? (`func start`)
2. Is it on port 7071?
3. Check CORS settings

---

### Scenario 3: Getting 404 errors

**Check console for**:
```
❌ [API Response] 404 GET http://localhost:7071/api/GetByID/123
```
**Diagnosis**: Endpoint doesn't exist or ID not found
**Solution**:
1. Verify endpoint name matches Azure Function
2. Check if ID exists in database
3. Review Azure Functions logs

---

### Scenario 4: Request takes too long

**Check console for**:
```
✅ [API Response] 200 GET ...
  ⚡ Duration: 3456ms
```
**Diagnosis**: Slow database query or function timeout
**Solution**:
1. Check Azure Functions logs for slow queries
2. Consider adding database indexes
3. Check network latency

---

## 🎓 Advanced Tips

### Tip 1: Filter Console Output
In browser DevTools Console, use filter box:
- Type `[API Request]` to see only requests
- Type `[API Response]` to see only responses
- Type `[API Error]` to see only errors
- Type `GET` or `POST` to filter by method

### Tip 2: Copy API Calls as cURL
1. Open Network tab in DevTools
2. Find the API request
3. Right-click → Copy → Copy as cURL
4. Test in terminal or Postman

### Tip 3: Export Console Logs
1. Right-click in console
2. Select "Save as..."
3. Share with team for debugging

### Tip 4: Time-Travel Debugging
Console logs are preserved on page reload:
1. Enable "Preserve log" in Console settings
2. Navigate through app
3. Review entire request history

---

## 🚀 Production Considerations

### In Production:
- Debug logs are **automatically enabled** by default
- Consider disabling for performance: `DEBUG_ENABLED = false`
- Or disable response bodies only: `DEBUG_RESPONSE_BODY = false`

### Best Practice:
```typescript
// Only enable in development
const DEBUG_ENABLED = process.env.NODE_ENV === 'development';
```

This way:
- ✅ Dev: Full debug output
- ✅ Prod: Clean console (no logs)

---

## 📝 Summary

### Debug Features:
- ✅ Every API call logged with full details
- ✅ Color-coded output for easy scanning
- ✅ Request/response timing
- ✅ Full error details
- ✅ Request body inspection
- ✅ Response data inspection
- ✅ Easy to enable/disable
- ✅ No performance impact when disabled

### How to Use:
1. Open browser console (F12)
2. Navigate through your app
3. Watch the `[API]` logs
4. Expand groups to see details
5. Use for debugging and optimization

### Configuration:
- **Enable/Disable**: Change `DEBUG_ENABLED` constant
- **Hide Response Body**: Change `DEBUG_RESPONSE_BODY` constant
- **Location**: `src/lib/apiClient.ts`

---

**Debug Status**: ✅ **ACTIVE**  
**Performance Impact**: ⚡ **MINIMAL**  
**Production Ready**: ✅ **YES** (can be disabled)

**Last Updated**: October 18, 2025
