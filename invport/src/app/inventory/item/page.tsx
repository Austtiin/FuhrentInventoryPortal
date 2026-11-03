'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { VehicleImageGallery } from '@/components/inventory/VehicleImageGallery';
import { Vehicle } from '@/types';
import { apiFetchJson } from '@/lib/apiClient';
import { inventoryRecords, normalizeInventoryVehicle } from '@/lib/inventoryResponse';
import UnitViewMetricsPanel from '@/components/inventory/UnitViewMetricsPanel';

export default function InventoryItemPage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine the ID from the current path or query string
        let id: string | null = null;
        try {
          const url = new URL(window.location.href);
          id = url.searchParams.get('id');
        } catch {
          // ignore
        }

        if (!id) {
          // fallback: take last segment of the pathname, e.g. /inventory/123 -> 123
          const parts = window.location.pathname.split('/').filter(Boolean);
          if (parts.length) {
            id = parts[parts.length - 1];
          }
        }

        if (!id) {
          setError('No vehicle id provided');
          setIsLoading(false);
          return;
        }

        const result = await apiFetchJson<unknown>('/GrabInventoryAll');
        const found = inventoryRecords(result).map(normalizeInventoryVehicle).find(unit => unit.id === id);

        if (!found) {
          setError(`Vehicle with ID ${id} not found`);
          setIsLoading(false);
          return;
        }

        setVehicle(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vehicle');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

  if (isLoading) return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">Loading...</div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
          <h2 className="text-xl font-bold">Error</h2>
          <p className="text-sm text-red-600 mt-2">{error}</p>
          <button onClick={() => router.push('/inventory')} className="mt-4 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800">Back to inventory</button>
        </div>
      </div>
  );

  if (!vehicle) return null;

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <button onClick={() => router.push('/inventory')} className="mb-6 flex items-center text-blue-600"> 
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to inventory
          </button>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold">{vehicle.name || `${vehicle.make} ${vehicle.model}`}</h1>
              <div className="mt-2 text-gray-600">Stock: {vehicle.stock || 'N/A'} • VIN: {vehicle.vin || 'N/A'}</div>
              <div className="mt-4 text-3xl font-bold">{formatPrice(vehicle.price)}</div>
              <div className="mt-4">
                <UnitViewMetricsPanel unitId={vehicle.unitId ?? (Number(vehicle.id) || null)} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              <div>
                <VehicleImageGallery vin={vehicle.vin} typeId={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Details</h3>
                <div className="mt-3 text-gray-700">
                  <p><strong>Year:</strong> {vehicle.year || 'N/A'}</p>
                  <p><strong>Mileage:</strong> {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : 'N/A'}</p>
                  <p><strong>Color:</strong> {vehicle.color || 'N/A'}</p>
                  <p className="mt-3">{vehicle.description}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 text-sm text-gray-500">
              <ClockIcon className="inline-block h-4 w-4 mr-1" /> Last updated: {vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>
  );
}
