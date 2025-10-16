'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Vehicle } from '@/types';
import VehicleImage from '@/components/ui/VehicleImage';

interface VehicleDetailsModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  const router = useRouter();
  
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Stock: {vehicle.stock || 'N/A'} • VIN: {vehicle.vin}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Images */}
              <div className="space-y-4">
                <div>
                  <VehicleImage
                    vehicleId={vehicle.id}
                    year={vehicle.year}
                    make={vehicle.make}
                    model={vehicle.model}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {/* Placeholder for additional images */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
                      >
                        <span className="text-gray-400 text-sm">Image {index + 2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-6">
                {/* Price and Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(vehicle.price)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      vehicle.status === 'available' 
                        ? 'bg-green-100 text-green-800'
                        : vehicle.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : vehicle.status === 'sold'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {formatMileage(vehicle.mileage)} miles • Located in {vehicle.location}
                  </p>
                </div>

                {/* Basic Vehicle Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Unit Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Year:</span>
                      <span className="ml-2 text-gray-900">{vehicle.year}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Make:</span>
                      <span className="ml-2 text-gray-900">{vehicle.make}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Model:</span>
                      <span className="ml-2 text-gray-900">{vehicle.model}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Stock #:</span>
                      <span className="ml-2 text-gray-900">{vehicle.stock || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">VIN:</span>
                      <span className="ml-2 text-gray-900 font-mono text-xs">{vehicle.vin}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Condition:</span>
                      <span className="ml-2 text-gray-900">{vehicle.condition || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="ml-2 text-gray-900">{vehicle.category}</span>
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Appearance</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Exterior Color:</span>
                      <span className="ml-2 text-gray-900">{vehicle.extColor || vehicle.color}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Interior Color:</span>
                      <span className="ml-2 text-gray-900">{vehicle.intColor || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Body Style:</span>
                      <span className="ml-2 text-gray-900">{vehicle.bodyStyle || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Size Category:</span>
                      <span className="ml-2 text-gray-900">{vehicle.sizeCategory || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Engine & Drivetrain */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Engine & Drivetrain</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Engine:</span>
                      <span className="ml-2 text-gray-900">{vehicle.engine || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Transmission:</span>
                      <span className="ml-2 text-gray-900">{vehicle.transmission}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Drivetrain:</span>
                      <span className="ml-2 text-gray-900">{vehicle.drivetrain || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Fuel Type:</span>
                      <span className="ml-2 text-gray-900">{vehicle.fuelType}</span>
                    </div>
                  </div>
                </div>

                {/* Inventory Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Inventory Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Days in Stock:</span>
                      <span className="ml-2 text-gray-900">{vehicle.daysInStock || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type ID:</span>
                      <span className="ml-2 text-gray-900">{vehicle.typeId || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Width Category:</span>
                      <span className="ml-2 text-gray-900">{vehicle.widthCategory || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="ml-2 text-gray-900">{vehicle.location}</span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Important Dates</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Date Added:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(vehicle.dateAdded).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(vehicle.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {vehicle.description && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {vehicle.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                router.push(`/inventory/edit/${vehicle.id}`);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Edit Unit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsModal;