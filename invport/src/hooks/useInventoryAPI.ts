import { useState, useEffect, useCallback, useMemo } from 'react';
import { Vehicle, VehicleStatus, InventoryFilters } from '@/types';
import { apiFetch } from '@/lib/apiClient';
import type { InventoryApiResponse } from '@/types/apiResponses';
// Rate limiter not required for the simplified approach
import { safeJsonParse } from '@/lib/safeJson';

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
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching inventory via API endpoint: /GrabInventoryAll');

      // Optionally throttle; comment out to keep ultra-simple and immediate
      // await rateLimiter.throttle('inventory', RATE_LIMITS.INVENTORY);

      const response = await apiFetch('/GrabInventoryAll');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      // Tolerant parsing: accept text/plain JSON bodies
      const rawText = await response.text();
      const parsed = safeJsonParse<InventoryApiResponse | Array<Record<string, unknown>>>(rawText, null);
      if (!parsed) {
        throw new Error('Invalid or empty JSON response');
      }

      let vehiclesData: Array<Record<string, unknown>> = [];
      if (Array.isArray(parsed)) {
        vehiclesData = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const r = (parsed as unknown) as Record<string, unknown>;
        if (Array.isArray(r.vehicles)) {
          vehiclesData = r.vehicles;
        } else if (r.data && Array.isArray(r.data)) {
          vehiclesData = r.data as Array<Record<string, unknown>>;
        } else if (
          r.data && typeof r.data === 'object' && Array.isArray((r.data as Record<string, unknown>).vehicles)
        ) {
          vehiclesData = (r.data as Record<string, unknown>).vehicles as Array<Record<string, unknown>>;
        }
      }

      const transformedVehicles: Vehicle[] = vehiclesData.map((objRaw) => {
        const obj = objRaw as Record<string, unknown>;
        const pick = (...keys: string[]) => {
          for (const k of keys) {
            const val = obj[k];
            if (val !== undefined && val !== null && val !== '') return val;
          }
          return undefined;
        };

        const idAny = pick('UnitID', 'unitId', 'Id', 'ID', 'id');
        const unitIdNum = Number(idAny ?? 0) || 0;
        const idStr = unitIdNum ? String(unitIdNum) : String(idAny ?? '');

        const make = String(pick('Make', 'make') ?? '');
        const model = String(pick('Model', 'model') ?? '');
        const yearNum = Number(pick('Year', 'year') ?? 0) || 0;
        const vin = String(pick('VIN', 'vin') ?? '');
        const status = String(pick('Status', 'status') ?? 'available').toLowerCase() as VehicleStatus;
        const stock = String(pick('StockNo', 'Stock', 'stockNumber', 'stock') ?? '');
        const price = Number(pick('Price', 'price', 'listPrice', 'salePrice') ?? 0) || 0;

        return {
          id: idStr,
          unitId: unitIdNum || undefined,
          name: `${make} ${model} ${yearNum}`.trim(),
          model,
          make,
          vin,
          color: String(pick('Color', 'color') ?? ''),
          status,
          stock,
          price,
          mileage: Number(pick('Mileage', 'mileage', 'Odometer') ?? 0) || 0,
          year: yearNum,
          dateAdded: String(pick('dateAdded', 'DateAdded') ?? '') || new Date().toISOString(),
          lastUpdated: String(pick('lastUpdated', 'LastUpdated') ?? '') || new Date().toISOString(),
          category: (pick('Category', 'category') as string) || 'Vehicle',
          transmission: (pick('Transmission', 'transmission') as string) || '',
          location: (pick('Location', 'location') as string) || '',
          dealer: (pick('Dealer', 'dealer') as string) || '',
          images: (pick('images') as string[] | undefined) ?? [],
          fuelType: (pick('FuelType', 'fuelType') as string) || '',
        } as Vehicle;
      });

      setVehicles(transformedVehicles);
      console.log(`✅ Loaded ${transformedVehicles.length} vehicles`);
    } catch (err) {
      console.error('❌ Failed to fetch vehicles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicles';
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

