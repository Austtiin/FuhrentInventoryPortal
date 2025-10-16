'use client';

import { useSWR } from './useSWR';

// Use the existing Vehicle type from @/types
interface VehicleData {
  UnitID: number;
  VIN?: string;
  Make: string;
  Model: string;
  Year: number;
  Price?: number;
  Status: string;
  Description?: string;
  TypeID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  StockNo?: string;
  Condition?: string;
  Category?: string;
  WidthCategory?: string;
  SizeCategory?: string;
  // Legacy fields for compatibility
  BodyStyle?: string;
  Engine?: string;
  Transmission?: string;
  Drivetrain?: string;
  ExtColor?: string;
  IntColor?: string;
  Odometer?: number;
  DaysInStock?: number;
  Location?: string;
  DateInStock?: string;
}

interface InventoryData {
  vehicles: VehicleData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  success: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

// Fetcher function for inventory data with pagination
const fetchInventory = async (page: number = 1, limit: number = 10): Promise<InventoryData> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  const response = await fetch(`/api/inventory?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch inventory');
  }

  return data;
};

// Custom hook for inventory data with pagination and 5-minute caching
export function useInventorySWR(options: PaginationOptions = {}) {
  const { page = 1, limit = 10 } = options;
  
  const { data, error, isLoading, isValidating, mutate, refresh } = useSWR(
    `inventory-${page}-${limit}`,
    () => fetchInventory(page, limit),
    {
      refreshInterval: 0, // No auto-refresh, rely on stale-while-revalidate
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds deduplication
      errorRetryCount: 3,
      errorRetryInterval: 2000
    }
  );

  return {
    vehicles: data?.vehicles ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    totalPages: data?.totalPages ?? 0,
    hasNext: data?.hasNext ?? false,
    hasPrev: data?.hasPrev ?? false,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh
  };
}

export type { VehicleData, InventoryData };