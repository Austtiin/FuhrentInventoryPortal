import React from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Vehicle } from '@/types';

interface InventoryCardProps {
  item: Vehicle;
  onView: (item: Vehicle) => void;
  onEdit: (item: Vehicle) => void;
  onDelete: (item: Vehicle) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
    case 'Available':
      return 'bg-green-500';
    case 'sold':
    case 'Sold':
      return 'bg-blue-500';
    case 'pending':
    case 'Pending':
      return 'bg-yellow-500';
    case 'reserved':
    case 'Reserved':
      return 'bg-purple-500';
    case 'maintenance':
    case 'Maintenance':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const InventoryCard: React.FC<InventoryCardProps> = ({ item, onView, onEdit, onDelete }) => {
  return (
    <div className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300/50">
  <div className="relative h-48 overflow-hidden lg:h-56 bg-linear-to-br from-gray-100 to-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">Vehicle Image</p>
          </div>
        </div>
        
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide text-white shadow-lg ${getStatusColor(item.status)}`}>
          {item.status}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-sm text-slate-600 font-medium">
            {item.year} {item.make} {item.model}
          </p>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 bg-primary-mint/10 rounded-lg flex items-center justify-center">
              <span className="text-primary-mint font-bold text-sm">$</span>
            </div>
            <span className="font-bold text-primary-mint text-lg">
              ${item.price.toLocaleString()}
            </span>
            {typeof item.msrp === 'number' && !Number.isNaN(item.msrp) && (
              <span className="text-xs text-slate-600 font-medium">
                MSRP: ${item.msrp.toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <MapPinIcon className="w-4 h-4" />
            </div>
            <span className="font-medium">{item.location}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span className="font-medium">{new Date(item.dateAdded).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
            {item.category}
          </span>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
            {item.transmission}
          </span>
          {item.color && (
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
              {item.color}
            </span>
          )}
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
            {item.mileage.toLocaleString()} mi
          </span>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200/50">
          <button
            onClick={() => onView(item)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-white text-slate-700 border border-gray-300 rounded-lg transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 font-medium cursor-pointer"
          >
            <EyeIcon className="w-4 h-4" />
            View
          </button>
          
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white border border-blue-600 rounded-lg transition-all hover:bg-blue-700 hover:border-blue-700 font-medium cursor-pointer"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
          
          <button
            onClick={() => onDelete(item)}
            className="px-3 py-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryCard;