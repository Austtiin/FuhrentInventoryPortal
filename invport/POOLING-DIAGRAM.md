# Connection Pooling Architecture

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Application                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Routes                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │/inventory│  │/vehicles │  │/dashboard│  │  /health │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────┐           │
│  │   Database Functions Layer                       │           │
│  │   • getInventoryCount()                          │           │
│  │   • getAllVehicles()                             │           │
│  │   • getInventoryStats()                          │           │
│  └─────────────────────┬────────────────────────────┘           │
│                        │                                        │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────────┐           │
│  │   Query Abstraction Layer                        │           │
│  │   • executeQuery(sql, params)                    │           │
│  │   • executeScalar(sql, params)                   │           │
│  └─────────────────────┬────────────────────────────┘           │
│                        │                                        │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────────┐           │
│  │   🔑 getConnection()                             │           │
│  │   • Checks if pool exists                        │           │
│  │   • Creates pool if needed (ONCE)                │           │
│  │   • Returns existing pool (REUSE)                │           │
│  └─────────────────────┬────────────────────────────┘           │
│                        │                                        │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────────┐           │
│  │   🏊 SINGLE GLOBAL CONNECTION POOL               │           │
│  │   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │           │
│  │   │Conn│ │Conn│ │Conn│ │Conn│ │... │            │           │
│  │   │ #1 │ │ #2 │ │ #3 │ │ #4 │ │#10 │            │           │
│  │   └────┘ └────┘ └────┘ └────┘ └────┘            │           │
│  │                                                  │           │
│  │   Min: 2 connections (always warm)              │           │
│  │   Max: 10 connections (under load)              │           │
│  │   Idle Timeout: 30 seconds                      │           │
│  └─────────────────────┬────────────────────────────┘           │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Azure SQL Database │
              │   flatt-inv-sql      │
              │   flatt-db-server    │
              └──────────────────────┘
```

## Request Flow Example

### First Request (Pool Creation)
```
GET /api/inventory
    ↓
getInventoryCount()
    ↓
executeScalar()
    ↓
getConnection()
    ↓
[NO POOL EXISTS]
    ↓
CREATE new ConnectionPool ← 100ms
    ↓
pool.connect() ← 50ms
    ↓
Return pool
    ↓
Execute query ← 30ms
    ↓
Total: ~180ms
```

### Second Request (Pool Reuse)
```
GET /api/vehicles
    ↓
getAllVehicles()
    ↓
executeQuery()
    ↓
getConnection()
    ↓
[POOL EXISTS ✅]
    ↓
Return existing pool ← 0ms
    ↓
Execute query ← 30ms
    ↓
Total: ~30ms (83% faster!)
```

### Concurrent Requests (Pool Sharing)
```
Request A → getConnection() → Pool → Conn #1 → Query A
Request B → getConnection() → Pool → Conn #2 → Query B  
Request C → getConnection() → Pool → Conn #3 → Query C
Request D → getConnection() → Pool → Conn #1 (reused) ✅
Request E → getConnection() → Pool → Conn #2 (reused) ✅

All requests share the SAME pool instance
Connections are reused when available
Max 10 concurrent connections enforced
```

## Pool Lifecycle States

```
┌──────────────┐
│  INITIAL     │ No pool exists
│  pool = null │
└───────┬──────┘
        │
        │ First database request
        ▼
┌──────────────┐
│  CREATING    │ Pool being initialized
│ connecting=  │ Creating 2 minimum connections
│   true       │
└───────┬──────┘
        │
        │ Connection successful
        ▼
┌──────────────┐
│   HEALTHY    │ Pool ready and operational
│ connected=   │ Connections available
│   true       │ Requests being served
│ healthy=true │
└───────┬──────┘
        │
        │ Under load
        ▼
┌──────────────┐
│   SCALING    │ Creating additional connections
│ connections  │ Up to max: 10
│   2 → 10     │
└───────┬──────┘
        │
        │ Load decreases
        ▼
┌──────────────┐
│   SCALING    │ Closing idle connections
│ connections  │ After 30 seconds idle
│   10 → 2     │ Down to min: 2
└───────┬──────┘
        │
        │ Connection error
        ▼
┌──────────────┐
│   ERROR      │ Connection lost
│ connected=   │ Retry logic active
│   false      │
└───────┬──────┘
        │
        │ 5+ consecutive failures
        ▼
┌──────────────┐
│  CIRCUIT     │ Circuit breaker active
│  BREAKER     │ Fail fast for 60 seconds
│  OPEN        │ No retry attempts
└───────┬──────┘
        │
        │ 60 seconds elapsed
        ▼
┌──────────────┐
│   RESET      │ Circuit breaker reset
│              │ Normal retry logic
└───────┬──────┘
        │
        │ Connection restored
        └──────► [Return to HEALTHY]
```

## Key Guarantees

✅ **Single Pool Instance**
```typescript
let pool: ConnectionPool | null = null; // ONE global instance
```

✅ **Reuse Check**
```typescript
if (!pool || !pool.connected) {
  // Create new pool
} else {
  // Reuse existing pool ✅
}
```

✅ **Shared Across All Operations**
```typescript
// All these use the SAME pool
await getInventoryCount();  // ← Pool
await getAllVehicles();      // ← Same pool
await getDashboardStats();   // ← Same pool
```

✅ **Automatic Lifecycle Management**
- Connections created on demand
- Connections reused when available
- Idle connections closed after timeout
- Minimum connections kept warm

✅ **Protected Against Overload**
- Max 10 concurrent connections
- Circuit breaker after 5 failures
- Exponential backoff on retries
- Fail fast when circuit open
```
