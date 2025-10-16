import { useState, useEffect, useCallback } from 'react';
import { Vehicle, VehicleStatus } from '@/types';

interface InventoryFilters {
  search: string;
  status: VehicleStatus | 'all';
  sortBy: keyof Vehicle;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface InventoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface InventoryData {
  vehicles: Vehicle[];
  pagination: InventoryPagination;
}

interface UseInventoryReturn {
  data: InventoryData | null;
  isLoading: boolean;
  error: string | null;
  filters: InventoryFilters;
  setFilters: (filters: Partial<InventoryFilters>) => void;
  refreshData: () => void;
}

const defaultFilters: InventoryFilters = {
  search: '',
  status: 'all',
  sortBy: 'dateAdded',
  sortOrder: 'desc',
  page: 1,
  limit: 50
};

export const useInventory = (): UseInventoryReturn => {
  const [data, setData] = useState<InventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<InventoryFilters>(defaultFilters);

  const fetchInventory = useCallback(async (currentFilters: InventoryFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching inventory with filters:', currentFilters);

      // Build query parameters
      const params = new URLSearchParams({
        search: currentFilters.search,
        status: currentFilters.status,
        sortBy: currentFilters.sortBy,
        sortOrder: currentFilters.sortOrder,
        page: currentFilters.page.toString(),
        limit: currentFilters.limit.toString()
      });

      const response = await fetch(`/api/GrabInventoryAll?${params}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        console.log(`✅ Loaded ${result.data.vehicles.length} vehicles`);
      } else {
        throw new Error(result.error || 'Failed to fetch inventory');
      }

    } catch (err) {
      console.error('❌ Failed to fetch inventory:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
      
      // Set empty data on error
      setData({
        vehicles: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchInventory(filters);
  }, [filters, fetchInventory]);

  const setFilters = useCallback((newFilters: Partial<InventoryFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when search/filter changes (except when page is explicitly set)
      page: newFilters.page !== undefined ? newFilters.page : 
             (newFilters.search !== undefined || newFilters.status !== undefined || 
              newFilters.sortBy !== undefined || newFilters.sortOrder !== undefined) ? 1 : prev.page
    }));
  }, []);

  const refreshData = useCallback(() => {
    fetchInventory(filters);
  }, [filters, fetchInventory]);

  return {
    data,
    isLoading,
    error,
    filters,
    setFilters,
    refreshData
  };
};