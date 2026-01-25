# CheckVIN Azure Function

Smart VIN decoding endpoint that dynamically determines the best decoding strategy for each VIN.

## Endpoint

```
GET /api/checkvin/{vin}
```

## How It Works

1. **Validates VIN format** - Ensures the VIN is 17 characters and contains valid characters
2. **Calls NHTSA API** - Gets basic vehicle information from the NHTSA database
3. **Analyzes results** - Determines if comprehensive decoding is needed
4. **Auto-upgrades** - If needed, automatically calls `/api/decodevins/{vin}` for detailed results

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `comprehensive` | boolean | Force use of `/api/decodevins` API (skip NHTSA check) |
| `skipNhtsa` | boolean | Go directly to `/api/decodevins` without NHTSA fallback |

## Response Format

```json
{
  "success": true,
  "vin": "1N9BL1714RW414011",
  "hasWarnings": true,
  "errorLevel": "warning",
  "warnings": ["The Model Year decoded..."],
  "data": {
    "make": "NORTH STAR LOGISTICS",
    "model": "NORTH STAR LOGISTICS",
    "modelYear": "2024",
    "vehicleType": "TRAILER",
    "bodyClass": "Trailer",
    "trailerType": "Ball Type Pull",
    "trailerLength": "17",
    "manufacturer": "NORTH STAR LOGISTICS LLC",
    "plantCity": "WATERTOWN",
    "plantCountry": "UNITED STATES (USA)",
    "plantState": "SOUTH DAKOTA"
  },
  "source": "nhtsa",
  "useAlternateApi": true,
  "decodevinsAttempted": true,
  "timestamp": "2026-01-25T...",
  "responseTimeMs": 345
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether decoding was successful |
| `vin` | string | The validated VIN |
| `hasWarnings` | boolean | Whether there are warnings |
| `errorLevel` | string | `"error"`, `"warning"`, or `null` |
| `warnings` | array | Warning messages (optional) |
| `errors` | array | Error messages (optional) |
| `data` | object | Decoded vehicle information |
| `source` | string | Data source: `"nhtsa"`, `"decodevins"`, `"decodevins_auto"`, or `"nhtsa_fallback"` |
| `useAlternateApi` | boolean | Recommendation to use `/api/decodevins` |
| `decodevinsAttempted` | boolean | Whether comprehensive decode was attempted |
| `decodevinsError` | string | Error if comprehensive decode failed (optional) |
| `responseTimeMs` | number | Total response time in milliseconds |
| `timestamp` | string | ISO 8601 timestamp |

## Data Source Priority

### 1. `nhtsa`
Default source - basic NHTSA decode succeeded without need for comprehensive decoding

### 2. `decodevins_auto`
Automatically upgraded to comprehensive decode because:
- Vehicle is a trailer with incomplete data
- Multiple warnings about decode accuracy
- Missing critical fields (make, model, year)
- Specialized manufacturer requiring detailed decode

### 3. `decodevins`
User explicitly requested comprehensive decode via `?comprehensive=true`

### 4. `nhtsa_fallback`
Comprehensive decode failed, fell back to NHTSA data

## When `useAlternateApi` is True

The function recommends calling `/api/decodevins/{vin}` when:
- Vehicle type is TRAILER with missing trailer-specific details
- 3+ warnings about decode accuracy
- 2+ critical fields missing (make, model, year)
- Specialized manufacturers (NORTH STAR, CUSTOM, HOMEMADE, etc.)

## Usage Examples

### Basic Usage
```bash
GET /api/checkvin/1N9BL1714RW414011
```

### Force Comprehensive Decode
```bash
GET /api/checkvin/1N9BL1714RW414011?comprehensive=true
```

### Skip NHTSA (Direct to DecodevinsAPI)
```bash
GET /api/checkvin/1N9BL1714RW414011?skipNhtsa=true
```

## Error Responses

### Invalid VIN Format
```json
{
  "success": false,
  "error": "VIN must be exactly 17 characters",
  "errorLevel": "error",
  "timestamp": "2026-01-25T...",
  "responseTimeMs": 0
}
```

### Server Error
```json
{
  "success": false,
  "error": "Failed to decode VIN",
  "errorLevel": "error",
  "details": "NHTSA API request failed: ...",
  "timestamp": "2026-01-25T...",
  "responseTimeMs": 123
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Base URL for `/api/decodevins` endpoint | Auto-detected from request headers or `http://localhost:7071` |

## Testing

Run the included test suite:
```bash
cd api/checkvin
node test.js
```

## VIN Validation Rules

- Must be exactly 17 characters
- Cannot contain letters I, O, or Q
- Must contain only alphanumeric characters (A-Z, 0-9)
- Automatically converted to uppercase

## Integration with DecodevinsAPI

The function automatically integrates with your comprehensive `/api/decodevins/{vin}` endpoint:

1. **Auto-detection**: Uses `API_BASE_URL` environment variable or detects from request headers
2. **Smart routing**: Only calls when needed based on NHTSA results
3. **Fallback**: Falls back to NHTSA if comprehensive decode fails
4. **Transparent**: Returns combined results with source indicator

This creates a seamless experience where users can call a single endpoint and get the best possible results automatically.
