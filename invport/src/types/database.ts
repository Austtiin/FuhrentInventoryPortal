// Database type definitions for Azure SQL Database integration

export interface DatabaseConnection {
  isConnected: boolean;
  lastChecked: Date;
  error?: string;
}

export interface InventoryStats {
  totalCount: number;
  lastUpdated: Date;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  price: number;
  status: 'Available' | 'Sold' | 'Pending' | 'Reserved';
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DatabaseStatus {
  status: 'Connected' | 'Disconnected' | 'Error';
  message: string;
  lastChecked: Date;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  description: string;
  timestamp: Date;
}