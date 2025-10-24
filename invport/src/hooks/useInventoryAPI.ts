import { useState, useEffect, useCallback, useMemo } from 'react';
import { Vehicle, VehicleStatus, InventoryFilters } from '@/types';
import { apiFetch } from '@/lib/apiClient';
import { safeResponseJson } from '@/lib/safeJson';
import type { InventoryApiResponse } from '@/types/apiResponses';
import { rateLimiter, RATE_LIMITS } from '@/lib/rateLimiter';

interface UseInventoryDirectReturn {
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  filters: InventoryFilters;
  setFilters: (filters: Partial<InventoryFilters>) => void;
  refreshData: () => void;
  markAsSold: (vehicleId: string | number) => Promise<void>;
  markAsPending: (vehicleId: string | number) => Promise<void>;
  markAsAvailable: (vehicleId: string | number) => Promise<void>;
}

const defaultFilters: InventoryFilters = {
  search: '',
  status: 'all',
  sortBy: 'dateAdded',
  sortOrder: 'desc'
};

export const useInventoryDirect = (): UseInventoryDirectReturn => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<InventoryFilters>(defaultFilters);

  const fetchAllVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching all inventory via API...');

      // Rate limit: Max 5 calls per 10 seconds
      await rateLimiter.throttle('inventory', RATE_LIMITS.INVENTORY);

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please check your connection')), 30000)
      );

      // Race between fetch and timeout
      const response = await Promise.race([
        apiFetch('/GrabInventoryAll'),
        timeoutPromise
      ]) as Response;
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      // Try to parse JSON response robustly. The API sometimes returns
      // JSON without correct content-type headers or returns a raw array.
      let result: InventoryApiResponse | Array<Record<string, unknown>> | null = null;
      try {
        result = await safeResponseJson<InventoryApiResponse | Array<Record<string, unknown>>>(response);
      } catch (parseError) {
        // Fallback: try to read text and parse leniently
        try {
          const text = await response.text();
          // safeJsonParse returns null on failure
          // import safeJsonParse at top (already available via safeResponseJson import)
          const { safeJsonParse } = await import('@/lib/safeJson');
          const parsed = safeJsonParse<Array<Record<string, unknown>> | InventoryApiResponse>(text, null);
          if (parsed) {
            result = parsed;
          } else {
            throw parseError;
          }
        } catch (innerErr) {
          console.error('❌ [useInventoryAPI] Failed to parse inventory response:', innerErr);
          throw parseError;
        }
      }

      // Handle flexible response shapes from GrabInventoryAll/inventory
      let vehiclesData: Array<Record<string, unknown>> = [];
      if (Array.isArray(result)) {
        // Raw array
        vehiclesData = result as Array<Record<string, unknown>>;
      } else if (result && typeof result === 'object') {
  const r = result as unknown as Record<string, unknown>;
        // Case: { success: true, vehicles: [...] }
        if ('vehicles' in r && Array.isArray(r.vehicles)) {
          vehiclesData = r.vehicles as Array<Record<string, unknown>>;
        }
        // Case: { success: true, data: [...] }
        else if ('data' in r && Array.isArray((r.data as unknown))) {
          vehiclesData = r.data as Array<Record<string, unknown>>;
        }
        // Case: { success: true, data: { vehicles: [...], pagination: {...} } }
        else if (
          'data' in r &&
          r.data &&
          typeof r.data === 'object' &&
          Array.isArray((r.data as Record<string, unknown>).vehicles)
        ) {
          vehiclesData = (r.data as Record<string, unknown>).vehicles as Array<Record<string, unknown>>;
        }
        // Case: { data: { vehicles: [...] } } (without success flag)
        else if (
          'data' in r &&
          r.data &&
          typeof r.data === 'object' &&
          Array.isArray((r.data as Record<string, unknown>).vehicles)
        ) {
          vehiclesData = (r.data as Record<string, unknown>).vehicles as Array<Record<string, unknown>>;
        }
        // Case: { data: [...] } (without success flag)
        else if ('data' in r && Array.isArray(r.data as unknown[])) {
          vehiclesData = r.data as Array<Record<string, unknown>>;
        } else {
          const maybeError = (r.error as unknown) as string | undefined;
          const errorMsg = typeof maybeError === 'string' ? maybeError : 'Invalid API response format';
          throw new Error(errorMsg);
        }
      } else {
        throw new Error('Invalid API response format');
      }

      // Transform data to match frontend expectations
      const transformedVehicles: Vehicle[] = vehiclesData.map((vehicle) => {
        // Prefer UnitID (numeric) for canonical unit identifier
        const unitIdNum = Number(vehicle.UnitID ?? vehicle.Id ?? vehicle.id ?? 0) || 0;
        const unitIdStr = unitIdNum ? String(unitIdNum) : String(vehicle.UnitID ?? vehicle.Id ?? vehicle.id ?? '');

        return {
          id: unitIdStr || String(vehicle.UnitID || vehicle.Id || vehicle.id || ''),
          unitId: unitIdNum || undefined,
          name: `${vehicle.Make || ''} ${vehicle.Model || ''} ${vehicle.Year || ''}`.trim(),
          model: String(vehicle.Model || ''),
          make: String(vehicle.Make || ''),
          vin: String(vehicle.VIN || vehicle.vin || ''),
          color: String(vehicle.Color || vehicle.Color || ''),
          status: ((vehicle.Status as string)?.toLowerCase() as VehicleStatus) || 'available',
          stock: String(vehicle.StockNo || vehicle.Stock || vehicle.stockNumber || ''),
          price: parseFloat(String(vehicle.Price || vehicle.listPrice || vehicle.salePrice || 0)) || 0,
          mileage: Number(vehicle.Mileage || vehicle.mileage || 0) || 0,
          year: parseInt(String(vehicle.Year || vehicle.year || 0)) || 0,
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          // Add default properties
          category: 'Sedan',
          transmission: 'Automatic',
          location: 'Main Lot',
          dealer: 'Main Dealer',
          images: vehicle.images || [],
          fuelType: 'Gasoline'
        } as Vehicle;
      });

      setVehicles(transformedVehicles);
      console.log(`✅ Loaded ${transformedVehicles.length} vehicles from API`);

    } catch (err) {
      console.error('❌ Failed to fetch vehicles:', err);
      let errorMessage = 'Failed to fetch vehicles';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Connection timeout - please check your network and try again';
        } else if (err.message.includes('HTTP error')) {
          errorMessage = 'Server error - please try again later';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsSold = useCallback(async (vehicleId: string | number) => {
    try {
      console.log(`🔄 Marking vehicle ${vehicleId} as sold...`);

      const response = await apiFetch(`/SetStatus/${vehicleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'sold'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`📋 SetStatus API Response:`, result);

      if (result && !result.error) {
        console.log(`✅ Vehicle ${vehicleId} marked as sold`);
        // Update local state
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === vehicleId 
            ? { ...vehicle, status: 'sold' as VehicleStatus, lastUpdated: new Date().toISOString() }
            : vehicle
        ));
      } else {
        console.error(`❌ API Error Response:`, result);
        throw new Error(result.message || result.error || 'Failed to update vehicle status');
      }

    } catch (err) {
      console.error('❌ Failed to mark vehicle as sold:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicle';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const markAsPending = useCallback(async (vehicleId: string | number) => {
    try {
      console.log(`🔄 Marking vehicle ${vehicleId} as pending...`);

      const response = await apiFetch(`/SetStatus/${vehicleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'pending'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`📋 SetStatus API Response (pending):`, result);

      if (result && !result.error) {
        console.log(`✅ Vehicle ${vehicleId} marked as pending`);
        // Update local state
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === vehicleId 
            ? { ...vehicle, status: 'pending' as VehicleStatus, lastUpdated: new Date().toISOString() }
            : vehicle
        ));
      } else {
        console.error(`❌ API Error Response (pending):`, result);
        throw new Error(result.message || result.error || 'Failed to update vehicle status');
      }

    } catch (err) {
      console.error('❌ Failed to mark vehicle as pending:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicle';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const markAsAvailable = useCallback(async (vehicleId: string | number) => {
    try {
      console.log(`🔄 Marking vehicle ${vehicleId} as available...`);

      const response = await apiFetch(`/SetStatus/${vehicleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'available'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`📋 SetStatus API Response (available):`, result);

      if (result && !result.error) {
        console.log(`✅ Vehicle ${vehicleId} marked as available`);
        // Update local state
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === vehicleId 
            ? { ...vehicle, status: 'available' as VehicleStatus, lastUpdated: new Date().toISOString() }
            : vehicle
        ));
      } else {
        console.error(`❌ API Error Response (available):`, result);
        throw new Error(result.message || result.error || 'Failed to update vehicle status');
      }

    } catch (err) {
      console.error('❌ Failed to mark vehicle as available:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicle';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Client-side filtering and sorting
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Apply search filter - improved to search more fields
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(vehicle => 
        vehicle.vin?.toLowerCase().includes(searchLower) ||
        vehicle.make?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.year?.toString().includes(searchLower) ||
        vehicle.stock?.toLowerCase().includes(searchLower) ||
        vehicle.name?.toLowerCase().includes(searchLower) ||
        `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(vehicle => 
        vehicle.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];

      if (filters.sortBy === 'price' || filters.sortBy === 'year') {
        const aNum = Number(aValue) || 0;
        const bNum = Number(bValue) || 0;
        return filters.sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      } else if (filters.sortBy === 'dateAdded' || filters.sortBy === 'lastUpdated') {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        return filters.sortOrder === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
      } else {
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();
        if (filters.sortOrder === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      }
    });

    return filtered;
  }, [vehicles, filters]);

  // Fetch data on mount
  useEffect(() => {
    fetchAllVehicles();
  }, [fetchAllVehicles]);

  const setFilters = useCallback((newFilters: Partial<InventoryFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const refreshData = useCallback(() => {
    fetchAllVehicles();
  }, [fetchAllVehicles]);

  return {
    vehicles,
    filteredVehicles,
    isLoading,
    error,
    filters,
    setFilters,
    refreshData,
    markAsSold,
    markAsPending,
    markAsAvailable
  };
};

