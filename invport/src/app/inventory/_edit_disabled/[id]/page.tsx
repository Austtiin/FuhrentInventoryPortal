'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, TrashIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/Loading';
import { VehicleImageGallery } from '@/components/inventory/VehicleImageGallery';
import { useNotification } from '@/hooks/useNotification';
import { apiFetch } from '@/lib/apiClient';
import { NotificationContainer } from '@/components/ui/Notification';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface VehicleData {
  UnitID: number;
  VIN?: string;
  Year?: number;
  Make?: string;
  Model?: string;
  Price?: number;
  StockNo?: string;
  Condition?: string;
  Category?: string;
  WidthCategory?: string;
  SizeCategory?: string;
  TypeID?: number;
  Status?: string;
}

interface EditInventoryPageProps {
  params: Promise<{ id: string }>;
}

export default function EditInventoryPage({ params }: EditInventoryPageProps) {
  const router = useRouter();
  const { notifications, success, error: showError, warning, closeNotification } = useNotification();
  const [unitId, setUnitId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [itemType, setItemType] = useState<'FishHouse' | 'Vehicle' | 'Trailer'>('Vehicle');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState({
    vin: '',
    year: '',
    make: '',
    model: '',
    stockNo: '',
    condition: 'New',
    category: '',
    width: '',
    length: '',
    price: '',
    status: 'Available',
  });

  // Safe sessionStorage operations with error handling
  const safeSetSessionStorage = (key: string, value: string) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('⚠️ Failed to set sessionStorage:', error);
      // Continue without sessionStorage - functionality will still work
    }
  };

  // Fetch vehicle data function (for initial load and refresh)
  const fetchVehicleData = async (id: string) => {
    try {
      console.log(`🔄 Fetching vehicle data for ID: ${id}`);
      const response = await apiFetch(`/vehicles/${id}`, {
        cache: 'no-store' // Force fresh data
      });
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch vehicle data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📋 API Response:`, result);
      
      // According to API docs, /vehicles/{id} returns vehicle data directly
      // Check if it's wrapped in a success/data structure or direct
      let vehicle: VehicleData;
      if (result.success && result.data) {
        vehicle = result.data;
      } else if (result.unitId || result.UnitID) {
        // Direct vehicle data
        vehicle = result;
      } else {
        throw new Error('Invalid response format from API');
      }
      
      console.log(`🚗 Vehicle data:`, vehicle);
        
        // Set item type based on TypeID
        if (vehicle.TypeID === 1) setItemType('FishHouse');
        else if (vehicle.TypeID === 3) setItemType('Trailer');
        else setItemType('Vehicle');

        // Populate form data
        setFormData({
          vin: vehicle.VIN || '',
          year: vehicle.Year?.toString() || '',
          make: vehicle.Make || '',
          model: vehicle.Model || '',
          stockNo: vehicle.StockNo || '',
          condition: vehicle.Condition || 'New',
          category: vehicle.Category || '',
          width: vehicle.WidthCategory || '',
          length: vehicle.SizeCategory || '',
          price: vehicle.Price?.toString() || '',
          status: vehicle.Status || 'Available',
        });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicle data';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Fetch vehicle data on mount
  useEffect(() => {
    const initFetch = async () => {
      const resolvedParams = await params;
      setUnitId(resolvedParams.id);
      await fetchVehicleData(resolvedParams.id);
    };

    initFetch();
  }, [params]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    
    try {
      const typeId = itemType === 'FishHouse' ? 1 : itemType === 'Vehicle' ? 2 : 3;
      
      const updateData = {
        ...formData,
        typeId,
        itemType
      };
      
      const response = await apiFetch(`/vehicles/${unitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh the data to show updated values
        await fetchVehicleData(unitId);
        // Set flag to refresh inventory list when user goes back
        safeSetSessionStorage('refreshInventory', 'true');
        success('Changes Saved!', 'Your changes have been saved successfully and the data has been refreshed.');
        setIsSaving(false);
      } else {
        throw new Error(result.error || 'Failed to update vehicle');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicle';
      setError(errorMessage);
      showError('Save Failed', errorMessage);
      setIsSaving(false);
    }
  };

  const handleMarkAsPending = async () => {
    setConfirmDialog({
      isOpen: true,
      title: '⏳ Mark as Pending',
      message: 'Are you sure you want to mark this unit as Pending?\n\nThis will update the status to indicate the unit is reserved or being processed.',
      confirmText: 'Mark as Pending',
      confirmColor: 'warning',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsSaving(true);
        try {
          const response = await apiFetch(`/SetStatus/${unitId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'pending' }),
          });

          const result = await response.json();
          if (result.success) {
            // Refresh the data from database to ensure we have latest status
            await fetchVehicleData(unitId);
            // Set flag to refresh inventory list when user goes back
            safeSetSessionStorage('refreshInventory', 'true');
            success('Status Updated', 'Unit has been marked as Pending successfully!');
          } else {
            throw new Error(result.error || 'Failed to update status');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to mark unit as pending';
          showError('Update Failed', errorMessage);
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const handleMarkAsAvailable = async () => {
    setConfirmDialog({
      isOpen: true,
      title: '✅ Mark as Available',
      message: 'Are you sure you want to mark this unit as Available?\n\nThis will make the unit available for sale again.',
      confirmText: 'Mark as Available',
      confirmColor: 'success',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsSaving(true);
        try {
          const response = await apiFetch(`/SetStatus/${unitId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'available' }),
          });

          const result = await response.json();
          if (result.success) {
            // Refresh the data from database to ensure we have latest status
            await fetchVehicleData(unitId);
            // Set flag to refresh inventory list when user goes back
            safeSetSessionStorage('refreshInventory', 'true');
            success('Status Updated', 'Unit is now marked as Available for sale!');
          } else {
            throw new Error(result.error || 'Failed to update status');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to mark unit as available';
          showError('Update Failed', errorMessage);
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const handleMarkAsSold = async () => {
    setConfirmDialog({
      isOpen: true,
      title: '💰 Mark as Sold',
      message: 'Are you sure you want to mark this unit as Sold?\n\nThis will update the status to indicate the unit has been sold.',
      confirmText: 'Mark as Sold',
      confirmColor: 'primary',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsSaving(true);
        try {
          const response = await apiFetch(`/SetStatus/${unitId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'sold' }),
          });

          const result = await response.json();
          if (result.success) {
            // Refresh the data from database to ensure we have latest status
            await fetchVehicleData(unitId);
            // Set flag to refresh inventory list when user goes back
            safeSetSessionStorage('refreshInventory', 'true');
            success('Status Updated', 'Unit has been marked as Sold successfully!');
          } else {
            throw new Error(result.error || 'Failed to update status');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to mark unit as sold';
          showError('Update Failed', errorMessage);
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const handleDelete = async () => {
    setConfirmDialog({
      isOpen: true,
      title: '🗑️ DELETE Unit',
      message: '⚠️ WARNING: Are you sure you want to DELETE this unit?\n\nThis action CANNOT be undone!\n\nAll data including photos and history will be permanently removed.',
      confirmText: 'Yes, Delete Permanently',
      confirmColor: 'error',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsDeleting(true);
        try {
          const response = await fetch(`/api/vehicles/${unitId}`, {
            method: 'DELETE',
          });

          const result = await response.json();
          if (result.success) {
            // Set flag to refresh inventory list
            safeSetSessionStorage('refreshInventory', 'true');
            success('Unit Deleted', 'The unit has been permanently deleted from the inventory.');
            setTimeout(() => {
              router.push('/inventory');
            }, 1500); // Give time for notification to show
          } else {
            throw new Error(result.error);
          }
        } catch {
          showError('Delete Failed', 'Failed to delete the unit. Please try again.');
          setIsDeleting(false);
        }
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="xl" />
        </div>
      </Layout>
    );
  }

  if (error && !formData.vin) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error Loading Vehicle</h2>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Link href="/inventory" className="mt-3 inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Back to Inventory
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={closeNotification} 
      />
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      
      <div className="space-y-6">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <Link 
            href="/inventory" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Inventory
          </Link>
          
          <button
            onClick={() => fetchVehicleData(unitId)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data from database"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleMarkAsAvailable}
                disabled={isSaving || formData.status === 'Available'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={formData.status === 'Available' ? 'Already marked as Available' : 'Mark this unit as Available for sale'}
              >
                <CheckIcon className="w-4 h-4" />
                Mark as Available
              </button>
              <button
                type="button"
                onClick={handleMarkAsPending}
                disabled={isSaving || formData.status === 'Pending'}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={formData.status === 'Pending' ? 'Already marked as Pending' : 'Mark this unit as Pending'}
              >
                <CheckIcon className="w-4 h-4" />
                Mark as Pending
              </button>
              <button
                type="button"
                onClick={handleMarkAsSold}
                disabled={isSaving || formData.status === 'Sold'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={formData.status === 'Sold' ? 'Already marked as Sold' : 'Mark this unit as Sold'}
              >
                <CheckIcon className="w-4 h-4" />
                Mark as Sold
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Permanently delete this unit"
              >
                <TrashIcon className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Current Status: <span className={`font-semibold ${
              formData.status === 'Available' ? 'text-green-600' :
              formData.status === 'Pending' ? 'text-yellow-600' :
              'text-gray-600'
            }`}>{formData.status}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Edit Inventory Item</h1>
            <p className="text-gray-600 mt-1">Update the details for this item</p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Section 1: Photos */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Photos</h2>
              {unitId && formData.vin ? (
                <VehicleImageGallery 
                  vin={formData.vin}
                  typeId={itemType === 'FishHouse' ? 1 : itemType === 'Vehicle' ? 2 : 3}
                  mode="gallery"
                  editable={true}
                  maxImages={20}
                  onNotification={(type, title, message) => {
                    if (type === 'success') {
                      success(title, message || '');
                    } else if (type === 'error') {
                      showError(title, message || '');
                    } else {
                      warning(title, message || '');
                    }
                  }}
                />
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    {!unitId ? 'Loading vehicle data...' : 'VIN required for photo management'}
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Item Type Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Item Type</h2>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setItemType('FishHouse')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    itemType === 'FishHouse'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className={`font-semibold ${itemType === 'FishHouse' ? 'text-blue-900' : 'text-gray-900'}`}>Fish House</div>
                  <div className="text-sm text-gray-600 mt-1">Ice fishing shelters</div>
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('Vehicle')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    itemType === 'Vehicle'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className={`font-semibold ${itemType === 'Vehicle' ? 'text-blue-900' : 'text-gray-900'}`}>Vehicle</div>
                  <div className="text-sm text-gray-600 mt-1">Cars, trucks, SUVs</div>
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('Trailer')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    itemType === 'Trailer'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className={`font-semibold ${itemType === 'Trailer' ? 'text-blue-900' : 'text-gray-900'}`}>Trailer</div>
                  <div className="text-sm text-gray-600 mt-1">Utility & cargo trailers</div>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Selected Type ID: {itemType === 'FishHouse' ? '1' : itemType === 'Vehicle' ? '2' : '3'}
              </p>
            </div>

            {/* Section 3: Item Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Item Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Year - Required */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-900 mb-2">
                    Year <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter year"
                  />
                </div>

                {/* Make - Required */}
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-gray-900 mb-2">
                    Make <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter make"
                  />
                </div>

                {/* Model - Required */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-900 mb-2">
                    Model <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter model"
                  />
                </div>

                {/* VIN - Required (can't be deleted) */}
                <div>
                  <label htmlFor="vin" className="block text-sm font-medium text-gray-900 mb-2">
                    VIN <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="vin"
                    name="vin"
                    value={formData.vin}
                    onChange={handleInputChange}
                    required
                    maxLength={17}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase"
                    placeholder="17-character VIN"
                  />
                  <p className="text-xs text-gray-500 mt-1">VIN is required and cannot be empty</p>
                </div>

                {/* Price - Optional */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-2">
                    Price (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-600 font-medium">$</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Stock Number - Optional */}
                <div>
                  <label htmlFor="stockNo" className="block text-sm font-medium text-gray-900 mb-2">
                    Stock No (Optional)
                  </label>
                  <input
                    type="text"
                    id="stockNo"
                    name="stockNo"
                    value={formData.stockNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter stock number"
                  />
                </div>

                {/* Condition - Required */}
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-900 mb-2">
                    Condition <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="New">New</option>
                    <option value="Pre-Owned">Pre-Owned</option>
                  </select>
                </div>

                {/* Category - Optional */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-2">
                    Category (Optional)
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    <option value="RV">RV</option>
                    <option value="No Water">No Water</option>
                    <option value="Toy Hauler">Toy Hauler</option>
                    <option value="Snowmobile Trailer">Snowmobile Trailer</option>
                  </select>
                </div>

                {/* Width - Optional */}
                <div>
                  <label htmlFor="width" className="block text-sm font-medium text-gray-900 mb-2">
                    Width (Optional)
                  </label>
                  <input
                    type="text"
                    id="width"
                    name="width"
                    value={formData.width}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter width"
                  />
                </div>

                {/* Length - Optional */}
                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-gray-900 mb-2">
                    Length (Optional)
                  </label>
                  <input
                    type="text"
                    id="length"
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter length"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <Link
                href="/inventory"
                className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

