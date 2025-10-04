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
      return 'bg-green-500';
    case 'sold':
      return 'bg-blue-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'reserved':
      return 'bg-purple-500';
    case 'maintenance':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const InventoryCard: React.FC<InventoryCardProps> = ({ item, onView, onEdit, onDelete }) => {
  return (
    <div className="group bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary-mint/30">
      <div className="relative h-48 overflow-hidden lg:h-56">
        
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide text-white shadow-lg ${getStatusColor(item.status)}`}>
          {item.status}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary-mint transition-colors">
            {item.name}
          </h3>
          <p className="text-sm text-slate-600 font-medium">
            {item.year} {item.make} {item.model}
          </p>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-mint/10 rounded-lg flex items-center justify-center">
              <span className="text-primary-mint font-bold text-sm">$</span>
            </div>
            <span className="font-bold text-primary-mint text-lg">
              ${item.price.toLocaleString()}
            </span>
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
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
            {item.mileage.toLocaleString()} mi
          </span>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200/50">
          <button
            onClick={() => onView(item)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-white text-slate-700 border border-gray-300 rounded-xl transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm font-medium cursor-pointer"
          >
            <EyeIcon className="w-4 h-4" />
            View
          </button>
          
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-white text-slate-700 border border-gray-300 rounded-xl transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm font-medium cursor-pointer"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </button>
          
          <button
            onClick={() => onDelete(item)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-primary-mint to-primary-mint-dark text-white border-0 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-mint/30 hover:scale-105 font-medium cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryCard;