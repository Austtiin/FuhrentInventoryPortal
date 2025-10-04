'use client';

import React, { useState, useMemo } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import InventoryCard from './InventoryCard';
import { Vehicle, VehicleStatus } from '@/types';
import { mockInventoryData, statusOptions } from '@/data/mockData';

interface InventoryListProps {
  onAdd: () => void;
  onView: (item: Vehicle) => void;
  onEdit: (item: Vehicle) => void;
  onDelete: (item: Vehicle) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ onAdd, onView, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<keyof Vehicle>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredAndSortedData = useMemo(() => {
    const filtered = mockInventoryData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.vin.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortBy === 'price' || sortBy === 'mileage' || sortBy === 'year') {
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      } else if (sortBy === 'dateAdded' || sortBy === 'lastUpdated') {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        return sortOrder === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
      } else {
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        if (sortOrder === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      }
    });

    return filtered;
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl font-bold text-primary-black md:text-3xl">
            Inventory Management
          </h1>
          <button 
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-mint text-white border border-primary-mint rounded-md text-sm font-medium transition-colors hover:bg-primary-mint-dark cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Add Inventory
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center md:p-6">
            <span className="block text-2xl font-bold text-primary-mint mb-1">
              {mockInventoryData.length}
            </span>
            <span className="text-sm text-gray-600 font-medium">Total Vehicles</span>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center md:p-6">
            <span className="block text-2xl font-bold text-primary-mint mb-1">
              {mockInventoryData.filter(item => item.status === 'available').length}
            </span>
            <span className="text-sm text-gray-600 font-medium">Available</span>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center md:p-6">
            <span className="block text-2xl font-bold text-primary-mint mb-1">
              {mockInventoryData.filter(item => item.status === 'sold').length}
            </span>
            <span className="text-sm text-gray-600 font-medium">Sold</span>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center md:p-6">
            <span className="block text-2xl font-bold text-primary-mint mb-1">
              {mockInventoryData.filter(item => item.status === 'pending').length}
            </span>
            <span className="text-sm text-gray-600 font-medium">Pending</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 md:p-6">
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, make, model, or VIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-sm transition-colors focus:border-primary-mint focus:outline-none placeholder-gray-500"
          />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | 'all')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white transition-colors focus:border-primary-red focus:outline-none"
              >
                <option value="all">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof Vehicle)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white transition-colors focus:border-primary-red focus:outline-none"
              >
                <option value="dateAdded">Date Added</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="year">Year</option>
                <option value="mileage">Mileage</option>
                <option value="status">Status</option>
              </select>
              
              <button 
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer text-base w-10 h-10 flex items-center justify-center transition-colors hover:bg-gray-200"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
            <button
              className={`px-3 py-2 bg-transparent border-none rounded-sm cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : ''
              }`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Squares2X2Icon className={`w-5 h-5 ${viewMode === 'grid' ? 'text-primary-mint' : 'text-gray-600'}`} />
            </button>
            <button
              className={`px-3 py-2 bg-transparent border-none rounded-sm cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm' : ''
              }`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <ListBulletIcon className={`w-5 h-5 ${viewMode === 'list' ? 'text-primary-mint' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600 m-0">
          Showing {filteredAndSortedData.length} of {mockInventoryData.length} vehicles
        </p>
      </div>

      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'flex flex-col gap-4'
        }
      `}>
        {filteredAndSortedData.length > 0 ? (
          filteredAndSortedData.map(item => (
            <InventoryCard
              key={item.id}
              item={item}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
            <p className="text-base text-gray-600 mb-6">
              No vehicles found matching your criteria.
            </p>
            <button 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-mint text-white border border-primary-mint rounded-md text-sm font-medium transition-colors hover:bg-primary-mint-dark"
              onClick={() => setSearchTerm('')}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryList;