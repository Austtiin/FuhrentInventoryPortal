'use client';

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout';
import { VehicleImageGallery } from '@/components/inventory/VehicleImageGallery';
import { NotificationContainer } from '@/components/ui/Notification';
import { useNotification } from '@/hooks/useNotification';
import { apiFetch } from '@/lib/apiClient';
import { LoadingSpinner } from '@/components/ui/Loading';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ArrowLeftIcon, ArrowPathIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { VEHICLE_COLORS, STATUS_OPTIONS } from '@/constants/inventory';
import { FEATURE_CATEGORIES } from '@/constants/features';
import FeaturesSelector from '@/components/inventory/FeaturesSelector';

// Utility function to capitalize first letter of each word
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface VehicleData {
  UnitID: number;
  VIN?: string;
  Year?: number;
  Make?: string;
  Model?: string;
  Color?: string;
  Price?: number;
  MSRP?: number;
  StockNo?: string;
  Condition?: string;
  Category?: string;
  WidthCategory?: string;
  SizeCategory?: string;
  TypeID?: number;
  Status?: string;
  Description?: string;
}

interface VehicleFormData {
  Year?: number;
  Make?: string;
  Model?: string;
  VIN?: string;
  Color?: string;
  Price?: number;
  MSRP?: number;
  StockNo?: string;
  Condition?: string;
  Category?: string;
  Status?: string;
  Description?: string;
  WidthCategory?: string;
  SizeCategory?: string;
  TypeID?: number;
}

// Fields that should be capitalized / uppercased when editing
const TITLE_CASE_FIELDS: (keyof VehicleFormData)[] = ['Make', 'Model'];
const UPPERCASE_FIELDS: (keyof VehicleFormData)[] = ['VIN', 'StockNo'];

// Suggestions and category options similar to Add page
const MAKE_SUGGESTIONS = [
  'Ice Castle Fish House',
  'Aluma-Light',
  'Toyota',
  'BMW',
  'Chevy',
  'Ford',
  'Honda',
];

const BASE_CATEGORY_OPTIONS = ['RV', 'No Water', 'Toy Hauler', 'Snowmobile Trailer', 'Skid House'];
const VEHICLE_CATEGORY_OPTIONS = [
  'Car', 'Truck', 'SUV', 'Sedan', 'Coupe', 'Van', 'Hatchback', 'Convertible', 'Box Truck', 'Pickup Truck', 'Wagon', 'Crossover',
];

function EditInventoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifications, success, error, warning, closeNotification } = useNotification();
  const [unitId, setUnitId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'blue' as 'blue' | 'green' | 'yellow' | 'red',
    onConfirm: () => {},
  });

  // Detect mobile viewport to adjust default open state for Features
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 640px)');
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(listener);
      return () => mq.removeListener(listener);
    }
  }, []);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);
  const initialFeatureIdsRef = useRef<number[]>([]);
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);
  // Track initial status to detect changes saved via the form control
  const initialStatusRef = useRef<string>('');

  const itemType = useMemo<'FishHouse' | 'Vehicle' | 'Trailer'>(() => {
    if (!vehicle?.TypeID) return 'Vehicle';
    return vehicle.TypeID === 1 ? 'FishHouse' : vehicle.TypeID === 3 ? 'Trailer' : 'Vehicle';
  }, [vehicle?.TypeID]);

  const typeId = useMemo(() => (itemType === 'FishHouse' ? 1 : itemType === 'Trailer' ? 3 : 2), [itemType]);
  const categoryOptions = useMemo(() => itemType === 'Vehicle' ? VEHICLE_CATEGORY_OPTIONS : BASE_CATEGORY_OPTIONS, [itemType]);

  // Look up UnitID by VIN
  const getUnitIdByVin = async (vin: string): Promise<string> => {
    try {
      const res = await apiFetch(`/checkvin/${vin}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to lookup VIN: ${res.status}`);
      }
      const data = await res.json();
      if (!data.exists || !data.unitId) {
        throw new Error(`VIN ${vin} not found in inventory`);
      }
      return data.unitId.toString();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'VIN lookup failed';
      throw new Error(msg);
    }
  };

  // Load vehicle data by UnitID (numeric)
  const fetchVehicle = async (unitId: string) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await apiFetch(`/vehicles/${unitId}`, { cache: 'no-store' });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to load vehicle: ${res.status} ${txt}`);
      }
      const data = await res.json();
      const v: VehicleData = data?.success && data?.data ? data.data : data;
      if (!v?.UnitID && !v?.VIN) throw new Error('Invalid vehicle data');
      setVehicle(v);
      // Initialize form data with current vehicle data
      const rawMsrp = (v as unknown as Record<string, unknown>)['MSRP'] ?? (v as unknown as Record<string, unknown>)['msrp'];
      const msrpNum = typeof rawMsrp === 'number' ? rawMsrp : rawMsrp != null ? Number(rawMsrp) : undefined;
      setFormData({
        Year: v.Year,
        Make: v.Make,
        Model: v.Model,
        VIN: v.VIN,
        Color: v.Color,
        Price: v.Price,
        MSRP: msrpNum,
        StockNo: v.StockNo,
        Condition: v.Condition,
        Category: v.Category,
        Status: v.Status,
        Description: v.Description,
        WidthCategory: v.WidthCategory,
        SizeCategory: v.SizeCategory,
        TypeID: v.TypeID,
      });
      // Capture initial status in normalized (lowercase) form
      initialStatusRef.current = (v.Status || '').toString().toLowerCase();
      setHasUnsavedChanges(false);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing features for the unit from canonical endpoint
  const fetchUnitFeatures = async (unitIdStr: string) => {
    try {
      const res = await apiFetch(`/units/${unitIdStr}/features`, { cache: 'no-store', skipRetry: true });
      if (!res.ok) {
        setSelectedFeatureIds([]);
        initialFeatureIdsRef.current = [];
        return;
      }
      const text = await res.text();
      let ids: number[] = [];
      try {
        const parsed = JSON.parse(text) as unknown;
        if (Array.isArray(parsed)) {
          if (parsed.length && typeof parsed[0] === 'number') {
            ids = parsed as number[];
          } else {
            const objects = parsed as Array<Record<string, unknown>>;
            ids = objects
              .filter(o => {
                const isActive = (o['Active'] ?? o['active'] ?? true) as boolean;
                return isActive !== false;
              })
              .map(o => Number((o['FeatureID'] ?? o['featureId'] ?? o['id']) as number | string | undefined) || 0)
              .filter(n => n > 0);
          }
        } else if (parsed && typeof parsed === 'object') {
          const obj = parsed as Record<string, unknown>;
          const arr = (obj['features'] || obj['data'] || obj['items']) as unknown;
          if (Array.isArray(arr)) {
            ids = (arr as unknown[])
              .map((v: unknown) => typeof v === 'number' ? v : Number((v as Record<string, unknown>)['FeatureID'] ?? (v as Record<string, unknown>)['featureId'] ?? (v as Record<string, unknown>)['id'] ?? 0))
              .filter((n: number) => n > 0);
          }
        }
      } catch (e) {
        console.warn('Feature JSON parse failed:', e, text?.slice(0, 200));
      }
      setSelectedFeatureIds(ids);
      initialFeatureIdsRef.current = [...ids];
    } catch {
      setSelectedFeatureIds([]);
      initialFeatureIdsRef.current = [];
    }
  };

  const hasFeatureChanges = useMemo(() => {
    const a = new Set(initialFeatureIdsRef.current);
    const b = new Set(selectedFeatureIds);
    if (a.size !== b.size) return true;
    for (const id of a) if (!b.has(id)) return true;
    return false;
  }, [selectedFeatureIds]);

  const saveFeatures = async () => {
    if (!vehicle?.UnitID) return;
    setIsSavingFeatures(true);
    try {
      // Backend expects either { featureIds: number[] } or a raw array [1,2,3]
      let res = await apiFetch(`/units/${vehicle.UnitID}/features`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureIds: selectedFeatureIds }),
        skipRetry: true,
      });

      // If the server rejects the object wrapper, retry with raw array
      if (!res.ok && res.status === 400) {
        try {
          res = await apiFetch(`/units/${vehicle.UnitID}/features`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedFeatureIds),
            skipRetry: true,
          });
        } catch {
          // Fall through to error handling below
        }
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Update features failed: ${res.status} ${txt?.slice(0, 200)}`);
      }
      initialFeatureIdsRef.current = [...selectedFeatureIds];
      success('Features Updated', 'Unit features have been saved');
    } catch (e) {
      error('Save Failed', e instanceof Error ? e.message : 'Failed to update features');
      throw e;
    } finally {
      setIsSavingFeatures(false);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof VehicleFormData, value: string | number | undefined) => {
    // Apply appropriate text formatting based on field
    let processedValue = value;
    if (typeof value === 'string') {
      // Normalize Status values to lowercase to match API/option values
      if (field === 'Status') {
        processedValue = value.toLowerCase().trim();
      }
      if (TITLE_CASE_FIELDS.includes(field)) {
        processedValue = toTitleCase(value);
      } else if (UPPERCASE_FIELDS.includes(field)) {
        processedValue = value.toUpperCase();
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    setHasUnsavedChanges(true);
  };

  // Save vehicle changes
  const saveVehicle = async () => {
    if (!vehicle?.UnitID) return;
    
    setIsSaving(true);
    try {
      // If status changed via the form, update it through dedicated endpoint first for reliability
      const newStatusRaw = (formData.Status ?? '').toString();
      const newStatus = newStatusRaw ? newStatusRaw.toLowerCase() : '';
      const statusChanged = !!newStatus && newStatus !== initialStatusRef.current;
      if (statusChanged) {
        const statusRes = await apiFetch(`/SetStatus/${vehicle.UnitID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus as 'available' | 'pending' | 'sold' }),
        });
        let statusResult: { success?: boolean; error?: string } = {};
        try {
          statusResult = await statusRes.json();
        } catch {
          statusResult = {};
        }
        if (!statusRes.ok || !statusResult?.success) {
          throw new Error(statusResult?.error || `Status update failed (${statusRes.status})`);
        }
        initialStatusRef.current = newStatus;
        success('Status Updated', `Unit marked as ${newStatus}`);
      }

      // Convert TypeID to typeId for API compatibility and map MSRP to msrp
      const { TypeID, MSRP } = formData;
      // Map formData (mixed case keys) to API's expected camelCase schema
      const apiPayload: Record<string, unknown> = {
        vin: formData.VIN,
        year: formData.Year,
        make: formData.Make,
        model: formData.Model,
        color: formData.Color,
        price: typeof formData.Price === 'number' ? formData.Price : null,
        stockNo: formData.StockNo,
        condition: formData.Condition,
        category: formData.Category,
  status: (formData.Status ?? '').toString().toLowerCase() || undefined,
        description: formData.Description,
        widthCategory: formData.WidthCategory,
        sizeCategory: formData.SizeCategory,
        typeId: TypeID,
        msrp: typeof MSRP === 'number' ? MSRP : null,
      };
      // Also include uppercase MSRP to support backends expecting DB column casing
      if (typeof MSRP === 'number') {
        apiPayload.MSRP = MSRP;
      } else {
        apiPayload.MSRP = null;
      }
      
      console.log('Saving vehicle with payload:', apiPayload);
      
      const res = await apiFetch(`/vehicles/${vehicle.UnitID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
      const result = await res.json();
      console.log('Save response:', result);
      if (!result?.success) throw new Error(result?.error || 'Save failed');
      
      // Persist feature updates if there are changes
      if (hasFeatureChanges) {
        await saveFeatures();
      }

      // Refresh vehicle data
      await fetchVehicle(unitId);
      setHasUnsavedChanges(false);
      success('Vehicle Saved', 'Changes have been saved successfully');
    } catch (e) {
      error('Save Failed', e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Prioritize ?id= (UnitID) over ?vin= for direct access
    const idFromQuery = (searchParams.get('id') || searchParams.get('vin') || '').trim();
    if (!idFromQuery) {
      setLoadError('Missing unit id (use ?id= for UnitID or ?vin= for VIN lookup)');
      setIsLoading(false);
      return;
    }
    
    // If it looks like a VIN (contains letters), lookup the UnitID first
    const loadVehicle = async () => {
      try {
        let actualUnitId = idFromQuery;
        
        // Check if the parameter looks like a VIN (contains letters) vs UnitID (numeric)
        if (/[A-Za-z]/.test(idFromQuery)) {
          // It's a VIN, look up the UnitID
          actualUnitId = await getUnitIdByVin(idFromQuery);
        }
        
        setUnitId(actualUnitId);
        await fetchVehicle(actualUnitId);
        // Load unit features after basic vehicle load
        await fetchUnitFeatures(actualUnitId);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load vehicle');
        setIsLoading(false);
      }
    };
    
    loadVehicle();
  }, [searchParams]);



  const runStatusUpdate = async (status: 'available' | 'pending' | 'sold') => {
    setIsSaving(true);
    try {
      const res = await apiFetch(`/SetStatus/${unitId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!result?.success) throw new Error(result?.error || 'Status update failed');
      await fetchVehicle(unitId);
      success('Status Updated', `Unit marked as ${status}`);
    } catch (e) {
      error('Update Failed', e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmStatus = (status: 'available' | 'pending' | 'sold', label: string, color: 'blue' | 'green' | 'yellow') => {
    setConfirmDialog({
      isOpen: true,
      title: `${label}`,
      message: `Are you sure you want to mark this unit as ${label}?`,
      confirmText: `Mark ${label}`,
      confirmColor: color,
      onConfirm: async () => {
        setConfirmDialog((d) => ({ ...d, isOpen: false }));
        await runStatusUpdate(status);
      },
    });
  };

  const confirmDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: '🗑️ DELETE Unit',
      message: 'This action cannot be undone. Delete this unit?',
      confirmText: 'Delete Permanently',
      confirmColor: 'red',
      onConfirm: async () => {
        setConfirmDialog((d) => ({ ...d, isOpen: false }));
        setIsDeleting(true);
        try {
              const res = await apiFetch(`/vehicles/delete/${unitId}`, { method: 'DELETE' });
          const result = await res.json();
          if (!result?.success) throw new Error(result?.error || 'Delete failed');
          success('Unit Deleted', 'The unit has been deleted.');
          setTimeout(() => router.push('/inventory'), 1200);
        } catch (e) {
          error('Delete Failed', e instanceof Error ? e.message : 'Failed to delete');
          setIsDeleting(false);
        }
      },
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

  if (loadError || !vehicle) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-300 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">⚠</span>
                </div>
              </div>
              <h2 className="text-red-900 font-semibold text-lg">Error Loading Vehicle</h2>
            </div>
            <p className="text-red-800 text-sm mb-4 leading-relaxed">{loadError || 'Unknown error occurred while loading vehicle data'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => fetchVehicle(unitId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
              <Link 
                href="/inventory" 
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Inventory
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const status = ((formData.Status ?? vehicle.Status) || 'Available').toString().toLowerCase();

  return (
    <Layout>
      {/* Notifications and Confirm Dialog */}
      <NotificationContainer notifications={notifications} onClose={closeNotification} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((d) => ({ ...d, isOpen: false }))}
      />

      <div className="space-y-6">
        {/* Header with Save Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/inventory" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors shrink-0">
              <ArrowLeftIcon className="w-5 h-5" /> Back to Inventory
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate" title={`${vehicle?.Year ?? ''} ${vehicle?.Make ?? ''} ${vehicle?.Model ?? ''}`}>
              Edit {vehicle?.Year} {vehicle?.Make} {vehicle?.Model}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => fetchVehicle(unitId)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              <ArrowPathIcon className="w-5 h-5" /> Refresh
            </button>
            <button
              onClick={saveVehicle}
              disabled={isSaving || isSavingFeatures || (!hasUnsavedChanges && !hasFeatureChanges)}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-4 h-4" />
              {isSaving || isSavingFeatures ? 'Saving...' : (hasUnsavedChanges || hasFeatureChanges) ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>

        {/* 1) Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quick Status Actions</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => confirmStatus('available', 'Available', 'green')}
                disabled={isSaving || status === 'available'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" /> Mark Available
              </button>
              <button
                type="button"
                onClick={() => confirmStatus('pending', 'Pending', 'yellow')}
                disabled={isSaving || status === 'pending'}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" /> Mark Pending
              </button>
              <button
                type="button"
                onClick={() => confirmStatus('sold', 'Sold', 'blue')}
                disabled={isSaving || status === 'sold'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" /> Mark Sold
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">Current Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              status === 'available' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : status === 'pending' 
                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                : status === 'sold' 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>

        {/* 2) Photo Gallery - First main section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo Gallery</h2>
          {vehicle.VIN ? (
            <VehicleImageGallery
              vin={vehicle.VIN}
              typeId={typeId}
              mode="gallery"
              editable
              unitId={vehicle.UnitID}
              maxImages={20}
              onNotification={(type, title, message) => {
                if (type === 'success') success(title, message || '');
                else if (type === 'error') error(title, message || '');
                else warning(title, message || '');
              }}
              className="w-full"
            />
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-800 font-medium">VIN is required to manage images</p>
            </div>
          )}
        </div>

        {/* 3) Unit Information - Editable Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Information</h2>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Year</label>
              <input
                type="number"
                value={formData.Year || ''}
                onChange={(e) => handleFieldChange('Year', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="2024"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">VIN</label>
              <input
                type="text"
                value={formData.VIN || ''}
                onChange={(e) => handleFieldChange('VIN', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="1234567890ABCDEFG"
                maxLength={17}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Make</label>
              <input
                type="text"
                value={formData.Make || ''}
                onChange={(e) => handleFieldChange('Make', e.target.value)}
                list="make-options"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="Ford"
              />
              <datalist id="make-options">
                {MAKE_SUGGESTIONS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Model</label>
              <input
                type="text"
                value={formData.Model || ''}
                onChange={(e) => handleFieldChange('Model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="F-150"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Color</label>
              <select
                value={formData.Color || ''}
                onChange={(e) => handleFieldChange('Color', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
              >
                <option value="">Select Color</option>
                {VEHICLE_COLORS.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Stock Number</label>
              <input
                type="text"
                value={formData.StockNo || ''}
                onChange={(e) => handleFieldChange('StockNo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="VH001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Price</label>
              <input
                type="number"
                value={formData.Price || ''}
                onChange={(e) => handleFieldChange('Price', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="35000"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">MSRP</label>
              <input
                type="number"
                value={formData.MSRP || ''}
                onChange={(e) => handleFieldChange('MSRP', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="35000"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Condition</label>
              <select
                value={formData.Condition || ''}
                onChange={(e) => handleFieldChange('Condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
              >
                <option value="">Select Condition</option>
                <option value="New">New</option>
                <option value="Pre-Owned">Pre-Owned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Category</label>
              <input
                type="text"
                value={formData.Category || ''}
                onChange={(e) => handleFieldChange('Category', e.target.value)}
                list="category-options"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="Truck"
              />
              <datalist id="category-options">
                {categoryOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Width Category</label>
              <input
                type="text"
                value={formData.WidthCategory || ''}
                onChange={(e) => handleFieldChange('WidthCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="Standard"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Size Category</label>
              <input
                type="text"
                value={formData.SizeCategory || ''}
                onChange={(e) => handleFieldChange('SizeCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                placeholder="Full Size"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Status</label>
                <select
                  value={(formData.Status ?? vehicle.Status ?? '').toString().toLowerCase()}
                  onChange={(e) => handleFieldChange('Status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                >
                  <option value="">Select Status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Type ID Selector */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-800">Unit Type</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  TypeID: {formData.TypeID || 'Not set'}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleFieldChange('TypeID', 1)}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  formData.TypeID === 1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🏠 Fish House
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('TypeID', 2)}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  formData.TypeID === 2
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🚗 Vehicle
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('TypeID', 3)}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  formData.TypeID === 3
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🚛 Trailer
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Select the type of unit this item represents</p>
          </div>

          {/* Read-only info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Read-Only Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold text-gray-800">VIN:</span> <span className="ml-1 font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded break-all">{vehicle.VIN}</span></div>
              <div><span className="font-semibold text-gray-800">Unit ID:</span> <span className="ml-1 text-gray-900 font-medium">{vehicle.UnitID}</span></div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
            <textarea
              value={formData.Description || ''}
              onChange={(e) => handleFieldChange('Description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
              placeholder="Enter vehicle description..."
            />
          </div>
        </div>

        {/* 4) Unit Features */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Unit Features</h2>
            {hasFeatureChanges && (
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">Unsaved feature changes</span>
            )}
          </div>
          <FeaturesSelector
            title="Select Features"
            selected={selectedFeatureIds}
            onChange={setSelectedFeatureIds}
            lazy
            defaultOpen={!isMobile}
            small
            categoryConfig={FEATURE_CATEGORIES}
          />
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveVehicle}
            disabled={isSaving || isSavingFeatures || (!hasUnsavedChanges && !hasFeatureChanges)}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="w-5 h-5" />
            {isSaving || isSavingFeatures ? 'Saving Changes...' : (hasUnsavedChanges || hasFeatureChanges) ? 'Save Changes' : 'All Changes Saved'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default function EditInventoryPage() {
  return (
    <Suspense fallback={null}>
      <EditInventoryPageContent />
    </Suspense>
  );
}
