/**
 * Enhanced Inventory Hook with Caching Support
 * 
 * This hook provides both cached and real-time inventory data fetching
 * Caching is opt-in: set `useCache: true` when you explicitly want cached results. By default
 * `useCache` is false to avoid unexpected cached data in client pages.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Vehicle, InventoryFilters } from '@/types';
import { getInventory } from '@/lib/serverApi';
import { useInventoryDirect } from './useInventoryAPI';

interface UseInventoryWithCacheOptions {
  useCache?: boolean;
  fallbackToRealtime?: boolean;
  cacheFirst?: boolean;
}

interface UseInventoryWithCacheReturn {
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  isLoading: boolean;
  isCached: boolean;
  error: string | null;
  filters: InventoryFilters;
  setFilters: (filters: Partial<InventoryFilters>) => void;
  refreshData: () => void;
  refreshFromCache: () => void;
  markAsSold: (vehicleId: string | number) => Promise<void>;
  markAsPending: (vehicleId: string | number) => Promise<void>;
  markAsAvailable: (vehicleId: string | number) => Promise<void>;
}

export const useInventoryWithCache = (
  options: UseInventoryWithCacheOptions = {}
): UseInventoryWithCacheReturn => {
  const {
    // Default useCache to false so callers opt-in to cached behavior explicitly
    useCache = false,
    fallbackToRealtime = true,
    cacheFirst = true
  } = options;

  // Real-time hook for fallback and mutations
  const realtimeData = useInventoryDirect();
  
  // Cache-specific state
  const [cachedVehicles, setCachedVehicles] = useState<Vehicle[]>([]);
  const [isCacheLoading, setIsCacheLoading] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Determine which data source to use
  const shouldUseCache = useCache && cacheFirst;
  const vehicles = shouldUseCache && cachedVehicles.length > 0 ? cachedVehicles : realtimeData.vehicles;
  const isLoading = shouldUseCache ? isCacheLoading || realtimeData.isLoading : realtimeData.isLoading;
  const error = shouldUseCache ? cacheError || realtimeData.error : realtimeData.error;

  // Fetch from cache
  const fetchFromCache = useCallback(async () => {
    if (!useCache) return;

    try {
      setIsCacheLoading(true);
      setCacheError(null);
      
      console.log('🔄 [Hook] Fetching inventory from cache...');
  const data = await getInventory();
      
      if (data?.data && Array.isArray(data.data)) {
        const processedVehicles = data.data.map((vehicle): Vehicle => ({
          id: vehicle.id,
          name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          vin: vehicle.vin,
          stock: vehicle.stockNumber || '',
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          color: vehicle.exteriorColor || 'Unknown',
          status: (vehicle.status?.toLowerCase() as Vehicle['status']) || 'available',
          price: vehicle.listPrice || vehicle.salePrice || 0,
          mileage: vehicle.mileage || 0,
          condition: vehicle.condition,
          dateAdded: vehicle.dateAdded || new Date().toISOString(),
          lastUpdated: vehicle.dateModified || new Date().toISOString(),
          unitId: parseInt(vehicle.id) || 0,
          typeId: 2, // Default to Vehicle type
          // Required fields with defaults
          fuelType: (vehicle.fuelType as Vehicle['fuelType']) || 'Gasoline',
          transmission: (vehicle.transmission as Vehicle['transmission']) || 'Automatic',
          category: 'SUV' as Vehicle['category'], // Default category
          images: vehicle.images || [],
          location: 'Main Lot',
          dealer: 'Fuhr Enterprise',
          description: vehicle.description,
          // Extended fields
          extColor: vehicle.exteriorColor,
          intColor: vehicle.interiorColor,
        }));
        
        setCachedVehicles(processedVehicles);
        setIsCached(true);
        console.log(`✅ [Hook] Loaded ${processedVehicles.length} vehicles from cache`);
      } else {
        throw new Error('Invalid cached data structure');
      }
    } catch (error) {
      console.error('❌ [Hook] Cache fetch failed:', error);
      setCacheError(error instanceof Error ? error.message : 'Cache fetch failed');
      setIsCached(false);
      
      // Fallback to real-time if enabled
      if (fallbackToRealtime) {
        console.log('🔄 [Hook] Falling back to real-time data...');
        realtimeData.refreshData();
      }
    } finally {
      setIsCacheLoading(false);
    }
  }, [useCache, fallbackToRealtime, realtimeData]);

  // Initialize data
  useEffect(() => {
    if (cacheFirst && useCache) {
      fetchFromCache();
    }
  }, [cacheFirst, useCache, fetchFromCache]);

  // Apply filters to vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Search filter
    if (realtimeData.filters.search) {
      const searchTerm = realtimeData.filters.search.toLowerCase();
      filtered = filtered.filter(vehicle =>
        vehicle.make?.toLowerCase().includes(searchTerm) ||
        vehicle.model?.toLowerCase().includes(searchTerm) ||
        vehicle.vin?.toLowerCase().includes(searchTerm) ||
        vehicle.year?.toString().includes(searchTerm) ||
        vehicle.stock?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (realtimeData.filters.status && realtimeData.filters.status !== 'all') {
      filtered = filtered.filter(vehicle => 
        vehicle.status?.toLowerCase() === realtimeData.filters.status.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const { sortBy, sortOrder } = realtimeData.filters;
      let comparison = 0;

      switch (sortBy) {
        case 'make':
          comparison = (a.make || '').localeCompare(b.make || '');
          break;
        case 'model':
          comparison = (a.model || '').localeCompare(b.model || '');
          break;
        case 'year':
          comparison = (a.year || 0) - (b.year || 0);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'dateAdded':
        default:
          comparison = new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [vehicles, realtimeData.filters]);

  // Refresh functions
  const refreshData = useCallback(() => {
    if (shouldUseCache) {
      fetchFromCache();
    } else {
      realtimeData.refreshData();
    }
  }, [shouldUseCache, fetchFromCache, realtimeData]);

  const refreshFromCache = useCallback(() => {
    fetchFromCache();
  }, [fetchFromCache]);

  // Status update functions (always use real-time for mutations)
  const markAsSold = useCallback(async (vehicleId: string | number) => {
    await realtimeData.markAsSold(vehicleId);
    // Refresh cache after mutation
    if (useCache) {
      setTimeout(() => fetchFromCache(), 1000);
    }
  }, [realtimeData, useCache, fetchFromCache]);

  const markAsPending = useCallback(async (vehicleId: string | number) => {
    await realtimeData.markAsPending(vehicleId);
    // Refresh cache after mutation
    if (useCache) {
      setTimeout(() => fetchFromCache(), 1000);
    }
  }, [realtimeData, useCache, fetchFromCache]);

  const markAsAvailable = useCallback(async (vehicleId: string | number) => {
    await realtimeData.markAsAvailable(vehicleId);
    // Refresh cache after mutation
    if (useCache) {
      setTimeout(() => fetchFromCache(), 1000);
    }
  }, [realtimeData, useCache, fetchFromCache]);

  return {
    vehicles,
    filteredVehicles,
    isLoading,
    isCached,
    error,
    filters: realtimeData.filters,
    setFilters: realtimeData.setFilters,
    refreshData,
    refreshFromCache,
    markAsSold,
    markAsPending,
    markAsAvailable,
  };
};

