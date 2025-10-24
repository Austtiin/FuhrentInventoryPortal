'use client';

import React, { useState, useEffect } from 'react';
import { useInventoryDirect } from '@/hooks/useInventoryAPI';
import CompactInventoryCard from '@/components/inventory/CompactInventoryCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import NotificationCard, { NotificationType } from '@/components/ui/NotificationCard';
import { Layout } from '@/components/layout';
import { Vehicle } from '@/types';
import { ErrorBoundary } from '@/components/ui';
import { useRouter } from 'next/navigation';
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal';
import { apiFetch } from '@/lib/apiClient';
import { safeJsonParse } from '@/lib/safeJson';

export default function InventoryPageClient() {
  const router = useRouter();
  const [imagesLoaded, setImagesLoaded] = useState(false);
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
    debug: hookDebug,
    filters,
    setFilters,
    refreshData,
    markAsSold,
    markAsPending,
    markAsAvailable
  } = useInventoryDirect();

  // Trigger image loading after inventory data is loaded
  useEffect(() => {
    if (!isLoading && filteredVehicles.length > 0) {
      // Delay image loading to prioritize inventory data display
      const timer = setTimeout(() => {
        setImagesLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, filteredVehicles.length]);

  const handleEditVehicle = (vehicle: Vehicle) => {
    router.push(`/inventory/edit?id=${vehicle.unitId || vehicle.id}`);
  };

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
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

  // --- Debug panel state ---
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [debugRawShape, setDebugRawShape] = useState<'array' | 'object' | 'unknown'>('unknown');
  const [debugFirstItem, setDebugFirstItem] = useState<Record<string, unknown> | null>(null);
  const [debugFirstItemKeys, setDebugFirstItemKeys] = useState<string[]>([]);

  const loadDebugSnapshot = async () => {
    try {
      setDebugLoading(true);
      setDebugError(null);
      const res = await apiFetch('/GrabInventoryAll', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      // Try tolerant parse: read text then JSON-parse safely (handles text/plain)
      const contentType = res.headers.get('content-type') || '';
      const bodyText = await res.text();
      const data = safeJsonParse<unknown>(bodyText, null);
      if (data === null) {
        setDebugRawShape('unknown');
        setDebugFirstItem(null);
        setDebugFirstItemKeys([]);
        setDebugError(`Non-JSON or unparsable body (Content-Type: ${contentType}). Body preview: ${bodyText.substring(0, 200)}`);
        return;
      }
      if (Array.isArray(data)) {
        setDebugRawShape('array');
        const first = (data[0] ?? null) as Record<string, unknown> | null;
        setDebugFirstItem(first);
        setDebugFirstItemKeys(first ? Object.keys(first) : []);
      } else if (data && typeof data === 'object') {
        setDebugRawShape('object');
        // Try common wrappers
        const r = data as Record<string, unknown>;
        const vehiclesCandidate = (r as { vehicles?: unknown }).vehicles;
        const dataCandidate = (r as { data?: unknown }).data;
        const nestedVehiclesCandidate = (dataCandidate as { vehicles?: unknown } | undefined)?.vehicles;
        const arr = Array.isArray(vehiclesCandidate)
          ? (vehiclesCandidate as unknown[])
          : Array.isArray(dataCandidate)
          ? (dataCandidate as unknown[])
          : Array.isArray(nestedVehiclesCandidate)
          ? (nestedVehiclesCandidate as unknown[])
          : [];
        const first = (arr[0] ?? null) as Record<string, unknown> | null;
        setDebugFirstItem(first);
        setDebugFirstItemKeys(first ? Object.keys(first) : []);
      } else {
        setDebugRawShape('unknown');
        setDebugFirstItem(null);
        setDebugFirstItemKeys([]);
      }
    } catch (e) {
      setDebugError(e instanceof Error ? e.message : String(e));
    } finally {
      setDebugLoading(false);
    }
  };

  // Auto-open debug if ?debug=1 (client-only, no useSearchParams to avoid SSR/Suspense requirements)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const dbg = params.get('debug');
    if (dbg === '1' || dbg === 'true') {
      setDebugOpen(true);
      setTimeout(() => {
        void loadDebugSnapshot();
      }, 0);
    }
  }, []);

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

        {/* Floating Debug Panel (also visible on error) */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Inventory Debug</span>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => {
                    setDebugOpen((v) => !v);
                    if (!debugOpen) {
                      void loadDebugSnapshot();
                    }
                  }}
                >
                  {debugOpen ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {debugOpen && (
              <div className="p-3 max-w-[90vw] sm:max-w-[520px] max-h-[70vh] overflow-auto">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div><span className="text-gray-500">Env:</span> <span className="font-mono">{process.env.NODE_ENV}</span></div>
                    <div><span className="text-gray-500">Host:</span> <span className="font-mono">{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</span></div>
                    <div><span className="text-gray-500">isLoading:</span> {String(isLoading)}</div>
                    <div><span className="text-gray-500">error:</span> {error ? String(error) : 'null'}</div>
                  </div>
                  <div className="space-y-1">
                    <div><span className="text-gray-500">vehicles:</span> {vehicles.length}</div>
                    <div><span className="text-gray-500">filtered:</span> {filteredVehicles.length}</div>
                      <div><span className="text-gray-500">raw shape:</span> {hookDebug?.rawShape ?? debugRawShape}</div>
                    <div><span className="text-gray-500">debug loading:</span> {String(debugLoading)}</div>
                      <div><span className="text-gray-500">status:</span> {hookDebug?.status ?? '-'}</div>
                      <div><span className="text-gray-500">content-type:</span> {hookDebug?.contentType ?? '-'}</div>
                      <div><span className="text-gray-500">extracted:</span> {hookDebug?.vehiclesExtracted ?? '-'}</div>
                  </div>
                </div>

                {debugError && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 rounded border border-red-200">
                    {debugError}
                  </div>
                )}

                  {hookDebug?.bodyPreview && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-600 mb-1">Body preview</div>
                      <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">{hookDebug.bodyPreview}</pre>
                    </div>
                  )}

                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">Client-mapped first vehicle</div>
                  <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
{JSON.stringify(filteredVehicles[0] ?? vehicles[0] ?? null, null, 2)}
                  </pre>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">Raw API first item keys</div>
                  <div className="flex flex-wrap gap-1">
                    {debugFirstItemKeys.length > 0 ? debugFirstItemKeys.map(k => (
                      <span key={k} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">{k}</span>
                    )) : <span className="text-gray-500">(none)</span>}
                  </div>
                  <pre className="mt-2 text-[10px] bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
{JSON.stringify(debugFirstItem, null, 2)}
                  </pre>
                </div>

                <div className="mt-2 text-right">
                  <button
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => void loadDebugSnapshot()}
                  >
                    Refresh snapshot
                  </button>
                </div>
              </div>
            )}
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-3">
              {filteredVehicles.map((vehicle) => (
                <CompactInventoryCard
                  key={vehicle.id}
                  item={vehicle}
                  onView={handleViewVehicle}
                  onEdit={() => handleEditVehicle(vehicle)}
                  onMarkAsPending={() => handleMarkAsPending(vehicle)}
                  onMarkAsAvailable={() => handleMarkAsAvailable(vehicle)}
                  onMarkAsSold={() => handleMarkAsSold(vehicle)}
                  onShowNotification={showNotification}
                  enableImageLoading={imagesLoaded}
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
      {/* Vehicle details modal (reuses in-memory vehicle data; no extra API calls) */}
      {selectedVehicle && (
        <VehicleDetailsModal vehicle={selectedVehicle} isOpen={isModalOpen} onClose={closeModal} />
      )}

      {/* Floating Debug Panel */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Inventory Debug</span>
            <div className="flex items-center gap-2">
              <button
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => {
                  setDebugOpen((v) => !v);
                  if (!debugOpen) {
                    void loadDebugSnapshot();
                  }
                }}
              >
                {debugOpen ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {debugOpen && (
            <div className="p-3 max-w-[90vw] sm:max-w-[520px] max-h-[70vh] overflow-auto">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div><span className="text-gray-500">Env:</span> <span className="font-mono">{process.env.NODE_ENV}</span></div>
                  <div><span className="text-gray-500">Host:</span> <span className="font-mono">{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</span></div>
                  <div><span className="text-gray-500">isLoading:</span> {String(isLoading)}</div>
                  <div><span className="text-gray-500">error:</span> {error ? String(error) : 'null'}</div>
                </div>
                <div className="space-y-1">
                  <div><span className="text-gray-500">vehicles:</span> {vehicles.length}</div>
                  <div><span className="text-gray-500">filtered:</span> {filteredVehicles.length}</div>
                  <div><span className="text-gray-500">raw shape:</span> {debugRawShape}</div>
                  <div><span className="text-gray-500">debug loading:</span> {String(debugLoading)}</div>
                </div>
              </div>

              {debugError && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 rounded border border-red-200">
                  {debugError}
                </div>
              )}

              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-1">Client-mapped first vehicle</div>
                <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
{JSON.stringify(filteredVehicles[0] ?? vehicles[0] ?? null, null, 2)}
                </pre>
              </div>

              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-1">Raw API first item keys</div>
                <div className="flex flex-wrap gap-1">
                  {debugFirstItemKeys.length > 0 ? debugFirstItemKeys.map(k => (
                    <span key={k} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">{k}</span>
                  )) : <span className="text-gray-500">(none)</span>}
                </div>
                <pre className="mt-2 text-[10px] bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
{JSON.stringify(debugFirstItem, null, 2)}
                </pre>
              </div>

              <div className="mt-2 text-right">
                <button
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => void loadDebugSnapshot()}
                >
                  Refresh snapshot
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </ErrorBoundary>
    </Layout>
  );
}

