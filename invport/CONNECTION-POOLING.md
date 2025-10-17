# Database Connection Pooling Guide

## Overview

This application uses **connection pooling** to efficiently manage database connections to Azure SQL Database. Connection pooling is a critical performance optimization that:

- ✅ Reuses existing connections instead of creating new ones for each request
- ✅ Reduces connection overhead and latency
- ✅ Prevents connection exhaustion under high load
- ✅ Improves application performance and scalability

## How Connection Pooling Works

### Single Global Pool
The application maintains **one global connection pool** instance that is shared across all database operations:

```typescript
// Global connection pool instance (ONE PER APPLICATION)
let pool: import('mssql').ConnectionPool | null = null;
```

### Pool Configuration

```typescript
pool: {
  max: 10,                    // Maximum 10 concurrent connections
  min: 2,                     // Keep 2 connections warm and ready
  idleTimeoutMillis: 30000,   // Close idle connections after 30 seconds
  acquireTimeoutMillis: 15000 // Wait up to 15 seconds for an available connection
}
```

### Connection Lifecycle

```
1. Application Starts
   ↓
2. First Database Request
   ↓
3. Pool Created with 2 initial connections (min)
   ↓
4. Subsequent Requests
   ↓
5. Reuse existing connections from pool
   ↓
6. If all connections busy → Create new connection (up to max: 10)
   ↓
7. After 30 seconds idle → Close unused connections (down to min: 2)
```

## Architecture

### Centralized Connection Management

```
API Route → lib/database/inventory.ts → lib/database/connection.ts → POOL
     ↓              ↓                            ↓                      ↓
  Request    executeQuery()              getConnection()        [Conn1, Conn2, ...]
             executeScalar()                                           ↓
                                                                  Azure SQL DB
```

All database operations go through:
1. **High-level functions** (`getInventoryCount()`, `getAllVehicles()`, etc.)
2. **Abstraction layer** (`executeQuery()`, `executeScalar()`)
3. **Pool manager** (`getConnection()`)
4. **Single global pool**

### Why This Prevents Multiple Connection Sessions

#### ✅ What We Do (Correct)
```typescript
// One global pool instance
let pool: ConnectionPool | null = null;

export async function getConnection() {
  if (!pool || !pool.connected) {
    pool = new ConnectionPool(config); // Create only if needed
    await pool.connect();
  }
  return pool; // Reuse existing pool
}

// Every request uses the same pool
const conn1 = await getConnection(); // Creates pool
const conn2 = await getConnection(); // Reuses pool ✅
const conn3 = await getConnection(); // Reuses pool ✅
```

#### ❌ What We DON'T Do (Incorrect)
```typescript
// BAD: Creating new pool for each request
export async function getConnection() {
  const pool = new ConnectionPool(config); // New pool every time ❌
  await pool.connect();
  return pool;
}

// This would create multiple pools
const conn1 = await getConnection(); // Pool #1
const conn2 = await getConnection(); // Pool #2 ❌
const conn3 = await getConnection(); // Pool #3 ❌
```

## Pool Statistics & Monitoring

### Health Check Endpoint

Monitor your connection pool in real-time:

```bash
# Check pool health
GET http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T03:00:00.000Z",
  "database": {
    "connected": true,
    "latency": "45ms",
    "error": null
  },
  "pool": {
    "exists": true,
    "connected": true,
    "connecting": false,
    "healthy": true
  },
  "circuitBreaker": {
    "active": false,
    "consecutiveFailures": 0,
    "secondsUntilReset": null
  },
  "pooling": {
    "enabled": true,
    "maxConnections": 10,
    "minConnections": 2,
    "idleTimeout": "30s",
    "acquireTimeout": "15s"
  }
}
```

### Programmatic Monitoring

```typescript
import { getPoolStats, logPoolStats } from '@/lib/database/connection';

// Get pool statistics
const stats = getPoolStats();
console.log(stats);
// {
//   exists: true,
//   isConnected: true,
//   isHealthy: true,
//   consecutiveFailures: 0,
//   circuitBreakerActive: false
// }

// Log detailed statistics to console
logPoolStats();
// 📊 Connection Pool Statistics:
// {
//   'Pool Exists': true,
//   'Connected': true,
//   'Healthy': true,
//   ...
// }
```

## Circuit Breaker Protection

The connection pool includes a circuit breaker to prevent connection storms:

### How It Works
```
Normal Operation (consecutiveFailures < 5)
↓
Connection Failure → Retry with backoff
↓
Another Failure → consecutiveFailures++
↓
5 Consecutive Failures → Circuit Breaker OPEN
↓
All requests fail fast for 60 seconds
↓
After 60 seconds → Circuit Breaker RESET
↓
Normal Operation Resumes
```

### Manual Reset
```typescript
import { resetCircuitBreaker } from '@/lib/database/connection';

// Reset circuit breaker after fixing connectivity issues
resetCircuitBreaker();
```

## Performance Benefits

### Without Connection Pooling
```
Request 1: Create connection (100ms) + Query (50ms) = 150ms
Request 2: Create connection (100ms) + Query (50ms) = 150ms
Request 3: Create connection (100ms) + Query (50ms) = 150ms
Total: 450ms for 3 requests
```

### With Connection Pooling
```
Request 1: Create pool (100ms) + Query (50ms) = 150ms
Request 2: Reuse connection (0ms) + Query (50ms) = 50ms ✅
Request 3: Reuse connection (0ms) + Query (50ms) = 50ms ✅
Total: 250ms for 3 requests (44% faster!)
```

### Under Load (100 concurrent requests)
- **Without Pooling**: 100 connections created = Database overwhelmed ❌
- **With Pooling**: Max 10 connections = Database stable ✅

## Best Practices

### ✅ DO
- Use the provided `executeQuery()` and `executeScalar()` functions
- Monitor pool health via `/api/health` endpoint
- Keep pool configuration appropriate for your load
- Let the pool manage connection lifecycle

### ❌ DON'T
- Create new `ConnectionPool` instances directly
- Close connections manually (pool manages this)
- Set `min` = `max` (prevents dynamic scaling)
- Set `idleTimeoutMillis` too low (causes thrashing)

## Troubleshooting

### Issue: "All connections in pool are busy"
**Cause**: More than 10 concurrent requests

**Solutions**:
1. Increase `max` connections (if database can handle it)
2. Optimize slow queries
3. Add caching layer
4. Scale horizontally

### Issue: "Connection pool not being reused"
**Verify**:
1. Check logs for "Initializing Azure SQL Database connection"
2. Should see once at startup, not on every request
3. Check `/api/health` - `pool.exists` should be `true`

### Issue: "Too many database connections"
**Check**:
1. Ensure only ONE Next.js instance is running
2. Kill any zombie processes
3. Check `max` connections setting
4. Monitor with Azure SQL Database dashboard

## Azure SQL Database Limits

### Connection Limits by Service Tier
- **Basic**: 30 concurrent connections
- **S0 (Standard)**: 30 concurrent connections
- **S1**: 40 concurrent connections
- **S2**: 100 concurrent connections
- **S3+**: 200+ concurrent connections

### Recommended Pool Settings by Tier
```typescript
// Basic / S0 / S1
pool: { max: 5, min: 1 }

// S2
pool: { max: 10, min: 2 } // ← Current setting

// S3+
pool: { max: 20, min: 5 }
```

## Monitoring Queries

### Check active connections in Azure SQL
```sql
-- See all active connections
SELECT 
    DB_NAME(dbid) as DatabaseName,
    COUNT(dbid) as NumberOfConnections,
    loginame as LoginName
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY dbid, loginame;

-- See connections from your application
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    status,
    last_request_start_time
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
    AND program_name LIKE 'nodejs%';
```

## Summary

✅ **Connection pooling is enabled and properly configured**
✅ **One global pool shared across all requests**
✅ **Automatic connection reuse and lifecycle management**
✅ **Circuit breaker protection against connection storms**
✅ **Health monitoring via `/api/health` endpoint**
✅ **Optimized for Azure SQL Database**

Your application is **fully protected against multiple connection sessions** and optimized for performance and reliability! 🎉
