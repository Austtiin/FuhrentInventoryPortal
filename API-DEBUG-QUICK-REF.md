# ✅ API Debug Console - Quick Reference

## 🎯 What You Get

Every API call now logs to the browser console with:
- 📤 **Request**: Method, URL, body data
- 📥 **Response**: Status, data, timing
- ❌ **Errors**: Full error details
- ⚡ **Performance**: Request duration in ms
- 🎨 **Color-coded**: Easy to scan

---

## 🖥️ Example Console Output

```
🚀 [API Request] POST http://localhost:7071/api/Addinventory
  ⏰ Timestamp: 2025-10-18T14:30:45.123Z
  🌐 Full URL: http://localhost:7071/api/Addinventory
  📤 Method: POST
  📦 Request Body:
  {
    "vin": "5TJBE51111",
    "make": "Ice Castle",
    "price": 54950
  }

✅ [API Response] 200 POST http://localhost:7071/api/Addinventory
  📊 Status: 200 OK
  ⚡ Duration: 234ms
  📥 Response Data:
  {
    "success": true,
    "data": { "UnitID": 123 }
  }
```

---

## ⚙️ Configuration

Edit `src/lib/apiClient.ts` at the top:

```typescript
// Line 11: Enable/disable all debug output
const DEBUG_ENABLED = true; // ← Set to false to disable

// Line 12: Show/hide response bodies
const DEBUG_RESPONSE_BODY = true; // ← Set to false to hide data
```

---

## 🔍 How to Use

### 1. Open Browser Console
Press **F12** or right-click → Inspect → Console tab

### 2. Navigate Your App
Visit any page:
- Dashboard
- Inventory list
- Add/edit forms
- Reports

### 3. Watch the Logs
Look for `🚀 [API Request]` and `✅ [API Response]` entries

### 4. Expand for Details
Click the arrow to see:
- Full request body
- Complete response data
- Timing information

---

## 🎨 Color Guide

| Icon | Status | Color |
|------|--------|-------|
| 🚀 | Request | Blue |
| ✅ | Success (2xx) | Green |
| ❌ | Error (4xx/5xx) | Red |
| ⚡ | Timing | Purple |
| 📦 | Data | Orange |

---

## 🐛 Debugging Tips

### Problem: No data showing on page
**Check**: Do you see `✅ [API Response] 200` with empty array?
**Fix**: Data might not exist in database

### Problem: Getting 404 errors
**Check**: Is Azure Functions running on port 7071?
**Fix**: Start Azure Functions: `func start`

### Problem: "Failed to fetch" error
**Check**: Can't reach API server
**Fix**: 
1. Verify Azure Functions running
2. Check `.env.local` has correct URL
3. Restart dev server

### Problem: Slow requests
**Check**: Look at `⚡ Duration` in response
**Fix**: 
- < 100ms: Fast ✅
- 100-500ms: Normal ✅
- > 500ms: Slow ❌ (investigate)

---

## 📋 Quick Commands

### Filter console output:
- Type `[API Request]` - Show only requests
- Type `[API Response]` - Show only responses
- Type `[API Error]` - Show only errors
- Type `GET` or `POST` - Filter by method

### Copy API call:
1. Open Network tab
2. Find request
3. Right-click → Copy as cURL

### Save console logs:
Right-click in console → Save as...

---

## 🚀 Production

For production, disable debugging:

```typescript
const DEBUG_ENABLED = process.env.NODE_ENV === 'development';
```

This ensures:
- ✅ Debug logs in dev
- ✅ Clean console in prod

---

## 📚 Full Documentation

See **`API-DEBUG-FEATURES.md`** for:
- Detailed examples
- Advanced configuration
- Troubleshooting guide
- Performance tips

---

**Status**: ✅ **ENABLED BY DEFAULT**  
**Location**: `src/lib/apiClient.ts`  
**Usage**: Open browser console (F12)

**Last Updated**: October 18, 2025
