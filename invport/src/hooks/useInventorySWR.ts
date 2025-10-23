"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/apiClient';

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

import { safeResponseJson } from '@/lib/safeJson';
import type { InventoryApiResponse } from '@/types/apiResponses';

// Fetcher function for inventory data with pagination
const fetchInventory = async (page: number = 1, limit: number = 10): Promise<InventoryData> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  // Use GrabInventoryAll instead of /api/inventory
  const response = await apiFetch(`/GrabInventoryAll?${params}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
  }

  const data = await safeResponseJson<InventoryApiResponse | Array<Record<string, unknown>>>(response);
  
  // Handle array response from GrabInventoryAll
  if (Array.isArray(data)) {
    return {
      success: true,
      vehicles: data as unknown as VehicleData[],
      total: data.length,
      page,
      limit,
      totalPages: Math.ceil(data.length / limit),
      hasNext: page * limit < data.length,
      hasPrev: page > 1
    };
  }
  
  // Handle wrapped response format
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch inventory');
    }
    
    const vehicles = (data.data || []) as unknown as VehicleData[];
    return {
      success: true,
      vehicles,
      total: vehicles.length,
      page,
      limit,
      totalPages: Math.ceil(vehicles.length / limit),
      hasNext: page * limit < vehicles.length,
      hasPrev: page > 1
    };
  }
  
  throw new Error('Invalid API response format');
};

// Custom hook for inventory data with pagination — direct fetch (no SWR caching)
export function useInventorySWR(options: PaginationOptions = {}) {
  const { page = 1, limit = 10 } = options;

  const [data, setData] = useState<InventoryData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const fetchData = useCallback(async (p = page, l = limit) => {
    setIsValidating(true);
    try {
      const result = await fetchInventory(p, l);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void fetchData(page, limit);
  }, [fetchData, page, limit]);

  const mutate = useCallback(() => fetchData(page, limit), [fetchData, page, limit]);
  const refresh = useCallback(() => fetchData(page, limit), [fetchData, page, limit]);

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