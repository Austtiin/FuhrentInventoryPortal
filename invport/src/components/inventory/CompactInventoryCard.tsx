import React, { useState } from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  ClockIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import VehicleImage from '@/components/ui/VehicleImage';
import { Vehicle } from '@/types';

interface CompactInventoryCardProps {
  item: Vehicle;
  onView: (item: Vehicle) => void;
  onEdit: (item: Vehicle) => void;
  onMarkAsSold: (item: Vehicle) => void;
  onShowNotification?: (type: 'success' | 'error' | 'warning', title: string, message: string) => void;
}

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-800', 
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Available'
      };
    case 'sold':
      return { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        dot: 'bg-gray-500',
        label: 'Sold'
      };
    case 'pending':
      return { 
        bg: 'bg-amber-100', 
        text: 'text-amber-800', 
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'Pending'
      };
    case 'reserved':
      return { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800', 
        border: 'border-purple-200',
        dot: 'bg-purple-500',
        label: 'Reserved'
      };
    case 'maintenance':
      return { 
        bg: 'bg-orange-100', 
        text: 'text-orange-800', 
        border: 'border-orange-200',
        dot: 'bg-orange-500',
        label: 'Maintenance'
      };
    default:
      return { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        dot: 'bg-gray-500',
        label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      };
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const CompactInventoryCard: React.FC<CompactInventoryCardProps> = ({ 
  item, 
  onView, 
  onEdit, 
  onMarkAsSold,
  onShowNotification 
}) => {
  const [isMarkingAsPending, setIsMarkingAsPending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(item.status);
  const isAvailable = currentStatus.toLowerCase() === 'available';
  const statusConfig = getStatusConfig(currentStatus);

  const handleMarkAsPendingClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmMarkAsPending = async () => {
    if (isMarkingAsPending) return;
    
    try {
      setIsMarkingAsPending(true);
      setShowConfirmation(false);
      await onMarkAsSold(item);
      // Update local state to reflect the change immediately
      setCurrentStatus('pending');
      onShowNotification?.('success', 'Unit Updated', `${item.year} ${item.make} ${item.model} has been marked as pending.`);
    } catch (error) {
      console.error('Failed to mark as pending:', error);
      onShowNotification?.('error', 'Update Failed', 'Failed to mark unit as pending. Please try again.');
    } finally {
      setIsMarkingAsPending(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-blue-400 hover:-translate-y-1">
      {/* Vehicle Image */}
      <div className="relative">
        <VehicleImage 
          vehicleId={item.id}
          make={item.make}
          model={item.model}
          year={item.year}
          className="w-full h-40 object-cover"
        />
        
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></div>
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3">
        {/* Vehicle Title */}
        <div className="mb-2">
          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
            {item.year} {item.make} {item.model}
          </h3>
          <p className="text-xs text-gray-600">
            Stock: {item.stock || 'N/A'} • VIN: {item.vin?.slice(-6) || 'N/A'}
          </p>
        </div>

        {/* Price - Prominent Display */}
        <div className="mb-3 text-center">
          <span className="text-lg font-bold text-blue-600">
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <button
            onClick={() => onView(item)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-gray-300 rounded font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <EyeIcon className="w-3 h-3" />
            <span className="hidden sm:inline">View</span>
          </button>
          
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-blue-600 rounded font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <PencilIcon className="w-3 h-3" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          
          {isAvailable && (
            <button
              onClick={handleMarkAsPendingClick}
              disabled={isMarkingAsPending}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border rounded font-medium transition-all ${
                isMarkingAsPending 
                  ? 'bg-yellow-400 text-white border-yellow-400 cursor-not-allowed' 
                  : 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600 cursor-pointer'
              }`}
            >
              {isMarkingAsPending ? (
                <>
                  <LoadingSpinner size="sm" color="gray" />
                </>
              ) : (
                <>
                  <ClockIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">Mark as Pending</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Action</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to mark this unit as pending?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelConfirmation}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkAsPending}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 border border-yellow-500 rounded-md hover:bg-yellow-600"
              >
                Mark Pending
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactInventoryCard;