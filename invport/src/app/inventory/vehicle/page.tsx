'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, ClockIcon, TruckIcon, TagIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout';
import { VehicleImageGallery } from '@/components/inventory/VehicleImageGallery';
import { Vehicle } from '@/types';
import { apiFetch } from '@/lib/apiClient';

// Simple vehicle detail page using search params instead of dynamic routes
export default function VehicleDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('id');
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!vehicleId) {
        setError('No vehicle ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log(`🔍 Fetching vehicle details for ID: ${vehicleId}`);
        
        // Fetch all inventory from GrabInventoryAll (includes all types)
        const response = await apiFetch('/GrabInventoryAll');
        
        if (response && Array.isArray(response)) {
          // Find the specific vehicle by UnitId
          const foundVehicle = response.find((item: Record<string, unknown>) => 
            item.unitId?.toString() === vehicleId || 
            item.UnitId?.toString() === vehicleId ||
            item.id?.toString() === vehicleId
          );

          if (foundVehicle) {
            // Normalize the vehicle data structure
            const normalizedVehicle: Vehicle = {
              id: foundVehicle.unitId || foundVehicle.UnitId || foundVehicle.id,
              unitId: foundVehicle.unitId || foundVehicle.UnitId,
              stock: foundVehicle.stockNo || foundVehicle.StockNo,
              typeId: foundVehicle.typeId || foundVehicle.TypeId || 2,
              year: foundVehicle.year || foundVehicle.Year,
              make: foundVehicle.make || foundVehicle.Make,
              model: foundVehicle.model || foundVehicle.Model,
              vin: foundVehicle.vin || foundVehicle.VIN,
              price: foundVehicle.price || foundVehicle.Price,
              status: foundVehicle.status || foundVehicle.Status || 'available',
              mileage: foundVehicle.mileage || foundVehicle.Mileage || 0,
              color: foundVehicle.color || foundVehicle.Color || '',
              description: foundVehicle.description || foundVehicle.Description,
              engine: foundVehicle.engine || foundVehicle.Engine,
              transmission: foundVehicle.transmission || foundVehicle.Transmission || 'Automatic',
              fuelType: foundVehicle.fuelType || foundVehicle.FuelType || 'Gasoline',
              drivetrain: foundVehicle.drivetrain || foundVehicle.Drivetrain,
              bodyStyle: foundVehicle.bodyStyle || foundVehicle.BodyStyle,
              // Standard Vehicle interface properties
              name: `${foundVehicle.year} ${foundVehicle.make} ${foundVehicle.model}`,
              category: 'SUV', // Default category, you can map this based on bodyStyle
              images: [], // Will be loaded by VehicleImageGallery
              dateAdded: foundVehicle.createdAt || foundVehicle.CreatedAt || new Date().toISOString(),
              lastUpdated: foundVehicle.updatedAt || foundVehicle.UpdatedAt || new Date().toISOString(),
              location: 'Main Lot', // Default location
              dealer: 'Flatt Motors' // Default dealer
            };
            
            setVehicle(normalizedVehicle);
          } else {
            setError(`Vehicle with ID ${vehicleId} not found`);
          }
        } else {
          setError('Failed to load inventory data');
        }
      } catch (err) {
        console.error('Error fetching vehicle details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vehicle details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleData();
  }, [vehicleId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
                <div className="h-64 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <button
                onClick={() => router.back()}
                className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Inventory
              </button>
              
              <div className="text-center py-12">
                <div className="text-red-600 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Vehicle Not Found</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => router.push('/inventory')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!vehicle) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🚗</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Vehicle Not Found</h1>
                <p className="text-gray-600 mb-6">The requested vehicle could not be found.</p>
                <button
                  onClick={() => router.push('/inventory')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Back Navigation */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Inventory
          </button>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-blue-100">
                    <span className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      Stock: {vehicle.stock || 'N/A'}
                    </span>
                    <span className="flex items-center">
                      <TruckIcon className="h-4 w-4 mr-1" />
                      VIN: {vehicle.vin}
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <div className="text-3xl font-bold mb-2">
                    {formatPrice(vehicle.price)}
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status?.charAt(0).toUpperCase() + vehicle.status?.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Image Gallery */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Photos</h3>
                <VehicleImageGallery vin={vehicle.vin} typeId={vehicle.typeId || 2} />
              </div>

              {/* Vehicle Details */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Vehicle Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Year</label>
                      <p className="mt-1 text-lg text-gray-900">{vehicle.year}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Mileage</label>
                      <p className="mt-1 text-lg text-gray-900">
                        {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Color</label>
                      <p className="mt-1 text-lg text-gray-900">{vehicle.color || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Body Style</label>
                      <p className="mt-1 text-lg text-gray-900">{vehicle.bodyStyle || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Engine</label>
                      <p className="mt-1 text-lg text-gray-900">{vehicle.engine || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Transmission</label>
                      <p className="mt-1 text-lg text-gray-900">{vehicle.transmission || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Fuel Type</label>
                      <p className="mt-1 text-lg text-gray-900">{vehicle.fuelType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Drivetrain</label>
                      <p className="mt-1 text-lg text-gray-900">{vehicle.drivetrain || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {vehicle.description && (
              <div className="border-t border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
              </div>
            )}

            {/* Last Updated */}
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-4 w-4 mr-2" />
                Last updated: {vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

