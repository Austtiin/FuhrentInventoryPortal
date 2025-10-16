import { useState, useEffect, useCallback, useMemo } from 'react';
import { Vehicle, VehicleStatus } from '@/types';
import { executeQuery } from '@/lib/database/connection';

interface InventoryFilters {
  search: string;
  status: VehicleStatus | 'all';
  sortBy: keyof Vehicle;
  sortOrder: 'asc' | 'desc';
}

interface UseInventoryDirectReturn {
  vehicles: Vehicle[];
  filteredVehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  filters: InventoryFilters;
  setFilters: (filters: Partial<InventoryFilters>) => void;
  refreshData: () => void;
  markAsSold: (vehicleId: string | number) => Promise<void>;
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

      console.log('🔄 Fetching all inventory directly from database...');

      // Get all vehicles from database
      const query = `
        SELECT 
          UnitID as id,
          VIN as vin,
          Make as make,
          Model as model,
          [Year] as year,
          Color as color,
          Status as status,
          Price as price,
          Mileage as mileage,
          Stock as stock,
          DateAdded as dateAdded,
          LastUpdated as lastUpdated,
          CONCAT(Make, ' ', Model, ' ', [Year]) as name
        FROM dbo.Units
        ORDER BY DateAdded DESC
      `;

      const result = await executeQuery(query);

      if (result.success && result.data) {
        // Transform data to match frontend expectations
        const transformedVehicles: Vehicle[] = result.data.map((vehicle: Record<string, unknown>) => ({
          id: String(vehicle.id || ''),
          name: String(vehicle.name || ''),
          model: String(vehicle.model || ''),
          make: String(vehicle.make || ''),
          vin: String(vehicle.vin || ''),
          color: String(vehicle.color || ''),
          status: (vehicle.status as VehicleStatus) || 'available',
          stock: String(vehicle.stock || ''),
          price: parseFloat(String(vehicle.price)) || 0,
          mileage: parseInt(String(vehicle.mileage)) || 0,
          year: parseInt(String(vehicle.year)) || 0,
          dateAdded: vehicle.dateAdded ? new Date(String(vehicle.dateAdded)).toISOString() : new Date().toISOString(),
          lastUpdated: vehicle.lastUpdated ? new Date(String(vehicle.lastUpdated)).toISOString() : new Date().toISOString(),
          // Add default properties
          category: 'Sedan',
          transmission: 'Automatic',
          location: 'Main Lot',
          dealer: 'Main Dealer',
          images: [],
          fuelType: 'Gasoline'
        }));

        setVehicles(transformedVehicles);
        console.log(`✅ Loaded ${transformedVehicles.length} vehicles from database`);
      } else {
        throw new Error(result.error || 'Failed to fetch vehicles');
      }

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

      const updateQuery = `
        UPDATE dbo.Units 
        SET Status = 'Sold', LastUpdated = GETDATE()
        WHERE UnitID = @vehicleId
      `;

      const result = await executeQuery(updateQuery, { vehicleId });

      if (result.success) {
        console.log(`✅ Vehicle ${vehicleId} marked as sold`);
        // Update local state
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === vehicleId 
            ? { ...vehicle, status: 'Sold' as VehicleStatus, lastUpdated: new Date().toISOString() }
            : vehicle
        ));
      } else {
        throw new Error(result.error || 'Failed to update vehicle status');
      }

    } catch (err) {
      console.error('❌ Failed to mark vehicle as sold:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicle';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Client-side filtering and sorting
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.vin?.toLowerCase().includes(searchLower) ||
        vehicle.make?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.year?.toString().includes(searchLower) ||
        vehicle.color?.toLowerCase().includes(searchLower) ||
        vehicle.stock?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];

      if (filters.sortBy === 'price' || filters.sortBy === 'mileage' || filters.sortBy === 'year') {
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
    markAsSold
  };
};