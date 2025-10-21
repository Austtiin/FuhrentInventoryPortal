'use client';

import React, { useState, useEffect } from 'react';
import { useInventorySWR, VehicleData } from '@/hooks/useInventorySWR';
import CompactInventoryCard from '@/components/inventory/CompactInventoryCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal';
import NotificationCard, { NotificationType } from '@/components/ui/NotificationCard';
import { Layout } from '@/components/layout';
import { Vehicle, VehicleStatus, TransmissionType, FuelType, VehicleCategory } from '@/types';
import { apiFetch } from '@/lib/apiClient';
import { ErrorBoundary } from '@/components/ui';
import { useRouter } from 'next/navigation';

// Function to convert VehicleData to Vehicle type
const convertToVehicle = (vehicleData: VehicleData): Vehicle => ({
  id: vehicleData.UnitID.toString(),
  name: `${vehicleData.Year} ${vehicleData.Make} ${vehicleData.Model}`,
  model: vehicleData.Model,
  year: vehicleData.Year,
  make: vehicleData.Make,
  price: vehicleData.Price || 0,
  mileage: vehicleData.Odometer || 0,
  color: vehicleData.ExtColor || 'Unknown',
  status: (vehicleData.Status?.toLowerCase() || 'available') as VehicleStatus,
  images: [],
  vin: vehicleData.VIN || '',
  transmission: vehicleData.Transmission as TransmissionType || 'Automatic',
  fuelType: 'Gasoline' as FuelType,
  category: (vehicleData.Category || 'Sedan') as VehicleCategory,
  description: vehicleData.Description || `${vehicleData.Year} ${vehicleData.Make} ${vehicleData.Model}`,
  location: vehicleData.Location || '',
  dealer: 'Fuhrent Motors',
  dateAdded: vehicleData.CreatedAt || vehicleData.DateInStock || new Date().toISOString(),
  lastUpdated: vehicleData.UpdatedAt || new Date().toISOString(),
  stock: vehicleData.StockNo,
  // Add additional fields for extended information
  condition: vehicleData.Condition,
  typeId: vehicleData.TypeID,
  widthCategory: vehicleData.WidthCategory,
  sizeCategory: vehicleData.SizeCategory,
  bodyStyle: vehicleData.BodyStyle,
  engine: vehicleData.Engine,
  drivetrain: vehicleData.Drivetrain,
  intColor: vehicleData.IntColor,
  extColor: vehicleData.ExtColor,
  daysInStock: vehicleData.DaysInStock
});

export default function InventoryPageClient() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'year' | 'price' | 'make' | 'status' | 'dateAdded'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'pending' | 'sold'>('all');
  const [notification, setNotification] = useState<{
    type: NotificationType;
    title: string;
    message: string;
    isVisible: boolean;
  } | null>(null);
  
  const { 
    vehicles: vehicleDataList, 
    total, 
    page,
    totalPages,
    hasNext,
    hasPrev,
    error, 
    isLoading, 
    isValidating, 
    mutate,
    refresh 
  } = useInventorySWR({ page: currentPage, limit: 10 });
  
  // Check for refresh flag on mount and when page becomes visible
  useEffect(() => {
    const checkRefreshFlag = async () => {
      try {
        const shouldRefresh = sessionStorage.getItem('refreshInventory');
        if (shouldRefresh === 'true') {
          console.log('🔄 Forcing inventory list refresh after edit/delete...');
          // Use mutate() to force revalidation and bypass cache
          await mutate();
          sessionStorage.removeItem('refreshInventory');
        }
      } catch (error) {
        // Handle sessionStorage access errors (e.g., browser extensions, incognito mode)
        console.warn('⚠️ SessionStorage access failed:', error);
        // Fallback: Force refresh anyway since we can't check the flag
        console.log('🔄 Forcing inventory list refresh as fallback...');
        await mutate();
      }
    };

    // Check on mount
    checkRefreshFlag();

    // Also check when page becomes visible (user returns from another tab/page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkRefreshFlag();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [mutate]);
  
  // Convert VehicleData to Vehicle type
  const vehicles = vehicleDataList.map(convertToVehicle);

  // Filter vehicles based on search query and status
  const filteredVehicles = vehicles.filter(vehicle => {
    // Status filter
    if (filterStatus !== 'all' && vehicle.status !== filterStatus) {
      return false;
    }
    
    // Search filter
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      vehicle.vin?.toLowerCase().includes(query) ||
      vehicle.year.toString().includes(query) ||
      vehicle.make.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.stock?.toLowerCase().includes(query) ||
      vehicle.status.toLowerCase().includes(query) ||
      vehicle.price.toString().includes(query)
    );
  });

  // Sort filtered vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'year':
        comparison = a.year - b.year;
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'make':
        comparison = a.make.localeCompare(b.make);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'dateAdded':
        comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    router.push(`/inventory/edit/${vehicle.id}`);
  };

  const showNotification = (type: NotificationType, title: string, message: string) => {
    setNotification({
      type,
      title,
      message,
      isVisible: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, isVisible: false } : null);
  };

  const handleMarkAsSold = async (vehicle: Vehicle) => {
    try {
      const response = await apiFetch(`/SetStatus/${vehicle.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "sold"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle status');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the cache to get updated data
        await refresh();
        showNotification('success', 'Status Updated', `${vehicle.year} ${vehicle.make} ${vehicle.model} marked as sold`);
      } else {
        throw new Error(result.error || 'Failed to update vehicle status');
      }
    } catch (error) {
      console.error('Error marking vehicle as sold:', error);
      showNotification('error', 'Update Failed', 'Failed to mark vehicle as sold. Please try again.');
    }
  };

  const handleMarkAsPending = async (vehicle: Vehicle) => {
    try {
      const response = await apiFetch(`/SetStatus/${vehicle.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "pending"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle status');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the cache to get updated data
        await refresh();
        showNotification('success', 'Status Updated', `${vehicle.year} ${vehicle.make} ${vehicle.model} marked as pending`);
      } else {
        throw new Error(result.error || 'Failed to update vehicle status');
      }
    } catch (error) {
      console.error('Error marking vehicle as pending:', error);
      showNotification('error', 'Update Failed', 'Failed to mark vehicle as pending. Please try again.');
    }
  };

  const handleMarkAsAvailable = async (vehicle: Vehicle) => {
    try {
      const response = await apiFetch(`/SetStatus/${vehicle.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "available"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle status');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the cache to get updated data
        await refresh();
        showNotification('success', 'Status Updated', `${vehicle.year} ${vehicle.make} ${vehicle.model} marked as available`);
      } else {
        throw new Error(result.error || 'Failed to update vehicle status');
      }
    } catch (error) {
      console.error('Error marking vehicle as available:', error);
      showNotification('error', 'Update Failed', 'Failed to mark vehicle as available. Please try again.');
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error Loading Inventory</h2>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button 
            onClick={() => refresh()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ErrorBoundary>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Unit Inventory</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-gray-800">
                {isLoading ? 'Loading...' : `${sortedVehicles.length} of ${total} vehicles`}
              </p>
              {isValidating && !isLoading && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-blue-600">Refreshing</span>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => refresh()}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Refresh
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Inventory
              </label>
              <input
                type="text"
                placeholder="Search by VIN, year, make, model, stock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'available' | 'pending' | 'sold')}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'year' | 'price' | 'make' | 'status' | 'dateAdded')}
                  className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="year">Year</option>
                  <option value="price">Price</option>
                  <option value="make">Make</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || filterStatus !== 'all') && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  Status: {filterStatus}
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedVehicles.map((vehicle) => (
                  <CompactInventoryCard
                    key={vehicle.id}
                    item={vehicle}
                    onView={() => handleViewVehicle(vehicle)}
                    onEdit={() => handleEditVehicle(vehicle)}
                    onMarkAsPending={() => handleMarkAsPending(vehicle)}
                    onMarkAsAvailable={() => handleMarkAsAvailable(vehicle)}
                    onMarkAsSold={() => handleMarkAsSold(vehicle)}
                    onShowNotification={showNotification}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="flex items-center text-sm text-gray-800">
                    <span>
                      Showing page {page} of {totalPages} ({total} total vehicles)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!hasPrev || isLoading}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={isLoading}
                            className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                              pageNum === currentPage
                                ? 'bg-blue-600 text-white border border-blue-600'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!hasNext || isLoading}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!isLoading && sortedVehicles.length === 0 && vehicles.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No vehicles match your search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}

          {!isLoading && vehicles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No vehicles found</p>
              <button 
                onClick={() => refresh()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Inventory
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
      
      {/* Notification Component */}
      {notification && (
        <NotificationCard
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      )}
      </ErrorBoundary>
    </Layout>
  );
}

