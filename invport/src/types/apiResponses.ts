/**
 * TypeScript interfaces for API responses
 * Centralized type definitions to ensure type safety across all API calls
 */

/**
 * Dashboard API Response
 * Endpoint: /api/dashboard/stats
 * Actual Azure Function response format
 */
export interface DashboardApiResponse {
  totalItems: number;
  totalValue: number;
  availableItems: number;
  lastUpdated: string;
}

/**
 * Reports API Response
 * Endpoint: /api/reports/dashboard
 */
export interface ReportsApiResponse {
  success: boolean;
  data?: {
    totalInventoryValue?: number;
    totalValue?: number;
    totalUniqueMakes?: number;
    uniqueMakes?: number;
    averageListPrice?: number;
    totalUnits?: number;
    totalVehicles?: number;
    totalFishHouses?: number;
    totalTrailers?: number;
    availableUnits?: number;
    soldUnits?: number;
    pendingUnits?: number;
    pendingSales?: number;
    inventoryTurnover?: number;
  };
  result?: {
    totalInventoryValue?: number;
    totalValue?: number;
    totalUniqueMakes?: number;
    uniqueMakes?: number;
    averageListPrice?: number;
    totalUnits?: number;
    totalVehicles?: number;
    totalFishHouses?: number;
    totalTrailers?: number;
    availableUnits?: number;
    soldUnits?: number;
    pendingUnits?: number;
    pendingSales?: number;
    inventoryTurnover?: number;
  };
  errors?: Record<string, unknown>;
  error?: string;
}

/**
 * Inventory API Response
 * Endpoint: /api/GrabInventoryAll
 */
export interface InventoryApiResponse {
  success: boolean;
  data?: Array<{
    id: string;
    vin: string;
    stockNumber?: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    mileage?: number;
    listPrice?: number;
    salePrice?: number;
    status: string;
    condition?: string;
    exteriorColor?: string;
    interiorColor?: string;
    transmission?: string;
    fuelType?: string;
    description?: string;
    images?: string[];
    dateAdded?: string;
    dateModified?: string;
  }>;
  errors?: Record<string, unknown>;
  error?: string;
}

/**
 * Single Vehicle API Response
 * Endpoint: /api/vehicles/{id} or /api/inventory/{id}
 */
export interface VehicleApiResponse {
  success: boolean;
  data?: {
    id: string;
    vin: string;
    stockNumber?: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    mileage?: number;
    listPrice?: number;
    salePrice?: number;
    status: string;
    condition?: string;
    exteriorColor?: string;
    interiorColor?: string;
    transmission?: string;
    fuelType?: string;
    description?: string;
    images?: string[];
    dateAdded?: string;
    dateModified?: string;
  };
  errors?: Record<string, unknown>;
  error?: string;
}

/**
 * Status Update API Response
 * Endpoint: /api/vehicles/{id}/status
 */
export interface StatusUpdateApiResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    message?: string;
  };
  errors?: Record<string, unknown>;
  error?: string;
}

/**
 * Add Vehicle API Response
 * Endpoint: /api/vehicles/add
 */
export interface AddVehicleApiResponse {
  success: boolean;
  data?: {
    id: string;
    vin: string;
    message?: string;
  };
  errors?: Record<string, unknown>;
  error?: string;
}

/**
 * VIN Check API Response
 * Endpoint: /api/vehicles/check-vin
 */
export interface VinCheckApiResponse {
  success: boolean;
  exists: boolean;
  data?: {
    vin: string;
    existingVehicleId?: string;
  };
  errors?: Record<string, unknown>;
  error?: string;
}

/**
 * Vehicle Images API Response
 * Endpoint: /api/images/{vin}
 */
export interface VehicleImagesApiResponse {
  success: boolean;
  data?: {
    images: string[];
    primaryImage?: string;
  };
  errors?: Record<string, unknown>;
  error?: string;
}

/**
 * Generic API Success Response
 */
export interface GenericApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Record<string, unknown>;
  error?: string;
}

/**
 * Generic API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, unknown>;
  statusCode?: number;
}
