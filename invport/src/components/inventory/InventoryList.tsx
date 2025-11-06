"use client";

import React, { useState } from 'react';
import { 
  PlusIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import CompactInventoryCard from './CompactInventoryCard';
import { Vehicle } from '@/types';
import { useInventoryDirect } from '@/hooks/useInventoryAPI';

interface InventoryListProps {
  onAdd: () => void;
  onView: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  markAsPending: (id: string) => void;
  markAsAvailable: (id: string) => void;
  markAsSold: (id: string) => void;
}

const InventoryContent: React.FC<InventoryListProps> = ({
  onAdd,
  onView,
  onEdit,
  markAsPending,
  markAsAvailable,
  markAsSold
}) => {
  // Example hooks (these should align with your API/hook structure)
  const { 
    filteredVehicles = [],
    error,
    isLoading,
    refreshData
  } = useInventoryDirect();

  // Local pagination & state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalItems = filteredVehicles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredVehicles.slice(startIndex, endIndex);
  const viewMode = 'grid'; // or list, depending on your UI
  const setFilters = (filters: Record<string, unknown>) => console.log('Clear filters', filters);

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

      {/* Pagination Controls - Top */}
      {totalPages > 1 && (
        <div className="mb-6 flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
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
            } else if (page === currentPage - 3 || page === currentPage + 3) {
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

      {/* Error Display */}
      {error && (
        <div className="col-span-full text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-base text-red-700 mb-4 font-medium">Failed to load inventory</p>
          <p className="text-sm text-red-600 mb-6">{String(error)}</p>
          <button 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white border border-red-600 rounded-lg text-sm font-medium transition-colors hover:bg-red-700"
            onClick={refreshData}
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600 m-0">
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} vehicles
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </p>
      </div>

      {/* Vehicle Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid gap-3 sm:gap-3 lg:gap-2 xl:gap-2 2xl:gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
            : 'flex flex-col gap-4'
        }
      >
        {isLoading && filteredVehicles.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading inventory...</p>
            </div>
          </div>
        ) : error ? null : currentItems.length === 0 ? (
          <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-base text-gray-600 mb-6">No vehicles found matching your criteria.</p>
            <button 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700"
              onClick={() => setFilters({ search: '', status: 'all' })}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          currentItems.map(item => (
            <CompactInventoryCard 
              key={item.id || item.unitId}
              item={item}
              onView={() => onView(item)}
              onEdit={() => onEdit(item)}
              onMarkAsPending={() => markAsPending(item.id ?? item.unitId ?? '')}
              onMarkAsAvailable={() => markAsAvailable(item.id ?? item.unitId ?? '')}
              onMarkAsSold={() => markAsSold(item.id ?? item.unitId ?? '')}
            />
          ))
        )}
      </div>

      {/* Pagination Controls - Bottom */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
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
            } else if (page === currentPage - 3 || page === currentPage + 3) {
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

const InventoryList: React.FC<InventoryListProps> = (props) => {
  return <InventoryContent {...props} />;
};

export default InventoryList;
