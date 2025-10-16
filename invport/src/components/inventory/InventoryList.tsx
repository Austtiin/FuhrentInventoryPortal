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
import SkeletonCard from '@/components/ui/SkeletonCard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { Vehicle, VehicleStatus } from '@/types';
import { statusOptions } from '@/data/mockData';
import { useInventoryDirect } from '@/hooks/useInventoryAPI';

interface InventoryListProps {
  onAdd: () => void;
  onView: (item: Vehicle) => void;
  onEdit: (item: Vehicle) => void;
  onDelete?: (item: Vehicle) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ onAdd, onView, onEdit }) => {
  const { filteredVehicles, isLoading, error, filters, setFilters, refreshData, markAsSold } = useInventoryDirect();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    try {
      await markAsSold(item.id);
    } catch (error) {
      console.error('Failed to mark as sold:', error);
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
                {statusOptions.map(option => (
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
          Showing {filteredVehicles.length} vehicles
        </p>
      </div>

      {/* Vehicle Grid/List - Mobile First */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
          : 'flex flex-col gap-3'
        }
      `}>
        {isLoading && filteredVehicles.length === 0 ? (
          // Skeleton loading state
          <SkeletonCard count={8} />
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
          filteredVehicles.map(item => (
            <LoadingOverlay key={item.id} isLoading={false}>
              <CompactInventoryCard
                item={item}
                onView={onView}
                onEdit={onEdit}
                onMarkAsSold={handleMarkAsSold}
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
    </div>
  );
};

export default InventoryList;