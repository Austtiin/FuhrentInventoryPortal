'use client';

import React, { useState } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import CompactInventoryCard from './CompactInventoryCard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { Vehicle, VehicleStatus } from '@/types';
import { STATUS_OPTIONS } from '@/constants/inventory';
import { useInventoryDirect } from '@/hooks/useInventoryAPI';

interface InventoryListProps {
  onAdd: () => void;
  onView: (item: Vehicle) => void;
  onEdit: (item: Vehicle) => void;
  onDelete?: (item: Vehicle) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ onAdd, onView, onEdit }) => {
  const { filteredVehicles, isLoading, error, filters, setFilters, refreshData, markAsSold, markAsPending, markAsAvailable } = useInventoryDirect();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Simple notification handler
  const showNotification = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    
    // Create a simple toast-like notification
    const toast = document.createElement('div');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
    
    toast.innerHTML = `
      <div class="fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[300px]">
        <span class="text-lg">${icon}</span>
        <div>
          <div class="font-semibold">${title}</div>
          <div class="text-sm opacity-90">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.remove();
    }, 4000);
  };

  // Calculate pagination
  const totalItems = filteredVehicles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredVehicles.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.sortBy]);

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
  };

  const handleStatusChange = (value: VehicleStatus | 'all') => {
    setFilters({ status: value });
  };

  const handleSortChange = (value: keyof Vehicle) => {
    setFilters({ sortBy: value });
  };

  const handleSortOrderChange = () => {
    setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
  };

  const handleMarkAsSold = async (item: Vehicle) => {
    console.log(`🔄 InventoryList: handleMarkAsSold called for vehicle: ${item.id}`);
    try {
      await markAsSold(item.id);
      console.log(`✅ InventoryList: Successfully marked vehicle ${item.id} as sold`);
      showNotification('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as sold`);
    } catch (error) {
      console.error('❌ InventoryList: Failed to mark as sold:', error);
      showNotification('error', 'Error', 'Failed to update vehicle status');
    }
  };

  const handleMarkAsPending = async (item: Vehicle) => {
    console.log(`🔄 InventoryList: handleMarkAsPending called for vehicle: ${item.id}`);
    try {
      await markAsPending(item.id);
      console.log(`✅ InventoryList: Successfully marked vehicle ${item.id} as pending`);
      showNotification('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as pending`);
    } catch (error) {
      console.error('❌ InventoryList: Failed to mark as pending:', error);
      showNotification('error', 'Error', 'Failed to update vehicle status');
    }
  };

  const handleMarkAsAvailable = async (item: Vehicle) => {
    console.log(`🔄 InventoryList: handleMarkAsAvailable called for vehicle: ${item.id}`);
    try {
      await markAsAvailable(item.id);
      console.log(`✅ InventoryList: Successfully marked vehicle ${item.id} as available`);
      showNotification('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as available`);
    } catch (error) {
      console.error('❌ InventoryList: Failed to mark as available:', error);
      showNotification('error', 'Error', 'Failed to update vehicle status');
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Inventory Management
            </h1>
            {isLoading && (
              <div className="animate-spin">
                <ArrowPathIcon className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
          <button 
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-800 text-sm">
              <span className="font-medium">Error:</span> {error}
            </p>
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:p-6">
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search VIN, make, model, year, stock..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500"
          />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <select 
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value as VehicleStatus | 'all')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value as keyof Vehicle)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="dateAdded">Date Added</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="year">Year</option>
                <option value="status">Status</option>
                <option value="make">Make</option>
                <option value="model">Model</option>
                <option value="stock">Stock #</option>
              </select>
              
              <button 
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer text-base w-10 h-10 flex items-center justify-center transition-colors hover:bg-gray-200"
                onClick={handleSortOrderChange}
                title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              className={`px-3 py-2 bg-transparent border-none rounded-lg cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : ''
              }`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Squares2X2Icon className={`w-5 h-5 ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-600'}`} />
            </button>
            <button
              className={`px-3 py-2 bg-transparent border-none rounded-lg cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm' : ''
              }`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <ListBulletIcon className={`w-5 h-5 ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600 m-0">
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} vehicles
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </p>
      </div>

      {/* Vehicle Grid/List - Mobile First */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid gap-3 sm:gap-3 lg:gap-2 xl:gap-2 2xl:gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
          : 'flex flex-col gap-4'
        }
      `}>
        {isLoading && filteredVehicles.length === 0 ? (
          // Loading spinner state
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading inventory...</p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="col-span-full text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <div className="mb-4">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-base text-red-700 mb-4 font-medium">Failed to load inventory</p>
            <p className="text-sm text-red-600 mb-6">{error}</p>
            <button 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white border border-red-600 rounded-lg text-sm font-medium transition-colors hover:bg-red-700"
              onClick={refreshData}
            >
              <ArrowPathIcon className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : filteredVehicles.length > 0 ? (
          // Vehicles with loading overlay for individual actions
          currentItems.map(item => (
            <LoadingOverlay key={item.id} isLoading={false}>
              <CompactInventoryCard
                item={item}
                onView={onView}
                onEdit={onEdit}
                onMarkAsPending={handleMarkAsPending}
                onMarkAsAvailable={handleMarkAsAvailable}
                onMarkAsSold={handleMarkAsSold}
                onShowNotification={showNotification}
              />
            </LoadingOverlay>
          ))
        ) : (
          // No results
          <div className="col-span-full text-center p-8 bg-white rounded-lg border border-gray-200">
            <div className="mb-4">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-500" />
              </div>
            </div>
            <p className="text-base text-gray-600 mb-6">
              No vehicles found matching your criteria.
            </p>
            <button 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700"
              onClick={() => setFilters({ search: '', status: 'all' })}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 2 && page <= currentPage + 2)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'text-white bg-blue-600 hover:bg-blue-700'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            } else if (
              page === currentPage - 3 ||
              page === currentPage + 3
            ) {
              return (
                <span key={page} className="px-3 py-2 text-sm text-gray-500">
                  ...
                </span>
              );
            }
            return null;
          })}
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default InventoryList;