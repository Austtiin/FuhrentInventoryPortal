export interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  make: string;
  vin: string;
  mileage: number;
  price: number;
  status: VehicleStatus;
  color: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  category: VehicleCategory;
  description?: string;
  images: string[];
  dateAdded: string;
  lastUpdated: string;
  location: string;
  dealer: string;
}

export type VehicleStatus = 'available' | 'sold' | 'pending' | 'reserved' | 'maintenance';

export type FuelType = 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid' | 'Plug-in Hybrid';

export type TransmissionType = 'Automatic' | 'Manual' | 'CVT';

export type VehicleCategory = 'Sedan' | 'SUV' | 'Truck' | 'Sports Car' | 'Electric' | 'Hybrid' | 'Luxury' | 'Compact';

export interface StatusOption {
  value: VehicleStatus;
  label: string;
  color: string;
}

export interface VehicleFormData {
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number | string;
  price: number | string;
  status: VehicleStatus;
  color: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  category: VehicleCategory;
  description: string;
  location: string;
  dealer: string;
}

export interface SearchFilters {
  searchTerm: string;
  statusFilter: VehicleStatus | 'all';
  categoryFilter: VehicleCategory | 'all';
  makeFilter: string | 'all';
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
}

export interface SortOptions {
  field: keyof Vehicle;
  direction: 'asc' | 'desc';
}

export interface InventoryStats {
  total: number;
  available: number;
  sold: number;
  pending: number;
  reserved: number;
  maintenance: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'dealer';
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}