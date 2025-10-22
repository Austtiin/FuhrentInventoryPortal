'use client';

import React, { useState } from 'react';
import { useInventoryDirect } from '@/hooks/useInventoryAPI';
import CompactInventoryCard from '@/components/inventory/CompactInventoryCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal';
import NotificationCard, { NotificationType } from '@/components/ui/NotificationCard';
import { Layout } from '@/components/layout';
import { Vehicle } from '@/types';
import { ErrorBoundary } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function InventoryPageClient() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: NotificationType;
    title: string;
    message: string;
    isVisible: boolean;
  } | null>(null);
  
  const { 
    vehicles,
    filteredVehicles, 
    error, 
    isLoading, 
    filters,
    setFilters,
    refreshData,
    markAsSold,
    markAsPending,
    markAsAvailable
  } = useInventoryDirect();
  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    router.push(`/inventory/edit?id=${vehicle.unitId || vehicle.id}`);
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
      await markAsSold(vehicle.id);
      showNotification('success', 'Status Updated', `${vehicle.year} ${vehicle.make} ${vehicle.model} marked as sold`);
    } catch (error) {
      console.error('Error marking vehicle as sold:', error);
      showNotification('error', 'Update Failed', 'Failed to mark vehicle as sold. Please try again.');
    }
  };

  const handleMarkAsPending = async (vehicle: Vehicle) => {
    try {
      await markAsPending(vehicle.id);
      showNotification('success', 'Status Updated', `${vehicle.year} ${vehicle.make} ${vehicle.model} marked as pending`);
    } catch (error) {
      console.error('Error marking vehicle as pending:', error);
      showNotification('error', 'Update Failed', 'Failed to mark vehicle as pending. Please try again.');
    }
  };

  const handleMarkAsAvailable = async (vehicle: Vehicle) => {
    try {
      await markAsAvailable(vehicle.id);
      showNotification('success', 'Status Updated', `${vehicle.year} ${vehicle.make} ${vehicle.model} marked as available`);
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
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={() => refreshData()}
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
                {isLoading ? 'Loading...' : `${filteredVehicles.length} vehicles`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => refreshData()}
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
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value as 'all' | 'available' | 'pending' | 'sold' })}
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
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ sortBy: e.target.value as 'year' | 'price' | 'make' | 'status' | 'dateAdded' })}
                  className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="year">Year</option>
                  <option value="price">Price</option>
                  <option value="make">Make</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                  title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.search || filters.status !== 'all') && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  Search: &ldquo;{filters.search}&rdquo;
                  <button
                    onClick={() => setFilters({ search: '' })}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  Status: {filters.status}
                  <button
                    onClick={() => setFilters({ status: 'all' })}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => setFilters({ search: '', status: 'all' })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
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
          )}

          {/* Empty state */}
          {!isLoading && filteredVehicles.length === 0 && vehicles.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No vehicles match your search criteria.</p>
              <button
                onClick={() => setFilters({ search: '', status: 'all' })}
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
                onClick={() => refreshData()}
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

