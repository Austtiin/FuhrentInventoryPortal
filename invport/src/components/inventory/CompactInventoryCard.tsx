'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  EyeIcon, 
  PencilIcon, 
  ClockIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/Loading';
import { SingleVehicleImage } from '@/components/inventory/SingleVehicleImage';
import { Vehicle } from '@/types';

interface CompactInventoryCardProps {
  item: Vehicle;
  onView?: (item: Vehicle) => void; // Made optional since we're using Link navigation
  onEdit: (item: Vehicle) => void;
  onMarkAsPending: (item: Vehicle) => void;
  onMarkAsAvailable: (item: Vehicle) => void;
  onMarkAsSold: (item: Vehicle) => void;
  onShowNotification?: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
  enableImageLoading?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-800', 
        label: 'Available'
      };
    case 'sold':
      return { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        label: 'Sold'
      };
    case 'pending':
      return { 
        bg: 'bg-amber-100', 
        text: 'text-amber-800', 
        label: 'Pending'
      };
    default:
      return { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        label: status || 'Unknown'
      };
  }
};

export default function CompactInventoryCard({
  item,
  onView,
  onEdit,
  onMarkAsPending,
  onMarkAsAvailable,
  onMarkAsSold,
  onShowNotification,
  enableImageLoading = true
}: CompactInventoryCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const statusConfig = getStatusConfig(item.status);

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'Price TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleStatusChange = async (action: 'pending' | 'available' | 'sold') => {
    console.log(`🎯 CompactInventoryCard: handleStatusChange called with action: ${action} for vehicle: ${item.id}`);
    if (isLoading) return;
    setIsLoading(true);
    try {
      switch (action) {
        case 'pending':
          console.log(`📞 Calling onMarkAsPending for vehicle: ${item.id}`);
          await onMarkAsPending(item);
          onShowNotification?.('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as pending`);
          break;
        case 'available':
          console.log(`📞 Calling onMarkAsAvailable for vehicle: ${item.id}`);
          await onMarkAsAvailable(item);
          onShowNotification?.('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as available`);
          break;
        case 'sold':
          console.log(`📞 Calling onMarkAsSold for vehicle: ${item.id}`);
          await onMarkAsSold(item);
          onShowNotification?.('success', 'Status Updated', `${item.year} ${item.make} ${item.model} marked as sold`);
          break;
      }
    } catch (error) {
      console.error(`❌ CompactInventoryCard: Error in handleStatusChange:`, error);
      onShowNotification?.('error', 'Error', 'Failed to update vehicle status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden max-w-xs mx-auto lg:max-w-none lg:mx-0">
      {/* Image Section - Fixed Height */}
      <div className="relative h-48 bg-gray-100">
        {enableImageLoading ? (
          <SingleVehicleImage 
            vin={item.vin}
            typeId={item.typeId || 2}
            className="w-full h-full"
            lazy={true}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="text-xs text-gray-500 mt-2">Loading image...</p>
            </div>
          </div>
        )}
        
        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} shadow-sm`}>
            {statusConfig.label}
          </span>
        </div>
        
        {/* Stock Number Overlay */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            #{item.stock}
          </span>
        </div>
      </div>

      {/* Content Section */}
  <div className="p-4 flex flex-col">
        {/* Vehicle Title */}
        <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight line-clamp-2 min-h-10">
          {item.year} {item.make} {item.model}
        </h3>

        {/* Vehicle Details */}
        <div className="space-y-1 mb-3 flex-1">
          <div className="text-sm text-gray-600">
            <span className="font-medium">VIN:</span> 
            <span className="ml-1 font-mono text-xs">{item.vin}</span>
          </div>
          
          {item.mileage && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Mileage:</span> 
              <span className="ml-1">{item.mileage?.toLocaleString()} miles</span>
            </div>
          )}
          
          {item.color && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Color:</span> 
              <span className="ml-1">{item.color}</span>
            </div>
          )}
        </div>

        {/* Price + MSRP */}
        <div className="mb-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <p className="text-xl font-bold text-emerald-600 m-0">
              {formatPrice(item.price)}
            </p>
            {typeof item.msrp === 'number' && !Number.isNaN(item.msrp) && (
              <span className="text-xs text-gray-600 font-medium">
                MSRP: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.msrp)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Row (View + Status) */}
        <div className="flex gap-2 flex-wrap">
          {onView ? (
            <button
              onClick={() => onView(item)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </button>
          ) : (
            <Link
              href={`/inventory/vehicle?id=${item.id || item.unitId}`}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </Link>
          )}

          {/* Conditional Status Buttons */}
          {item.status?.toLowerCase() === 'available' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ BUTTON CLICKED: Mark as Pending for vehicle:', item.id);
                handleStatusChange('pending');
              }}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Pending
                </>
              )}
            </button>
          )}

          {item.status?.toLowerCase() === 'pending' && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ BUTTON CLICKED: Mark as Available for vehicle:', item.id);
                  handleStatusChange('available');
                }}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center px-2 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Available'
                )}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ BUTTON CLICKED: Mark as Sold for vehicle:', item.id);
                  handleStatusChange('sold');
                }}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center px-2 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Sold'
                )}
              </button>
            </>
          )}

          {item.status?.toLowerCase() === 'sold' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ BUTTON CLICKED: Mark as Available for vehicle:', item.id);
                handleStatusChange('available');
              }}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Mark Available
                </>
              )}
            </button>
          )}
        </div>

        {/* Edit Button - Full width at bottom */}
        <button
          onClick={() => onEdit(item)}
          className="mt-2 w-full flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </button>
      </div>
    </div>
  );
}

