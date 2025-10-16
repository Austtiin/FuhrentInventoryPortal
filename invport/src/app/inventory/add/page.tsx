'use client';

import React, { useState } from 'react';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout';
import Link from 'next/link';

interface VehicleData {
  VIN?: string;
  [key: string]: unknown;
}

const AddInventoryPage: React.FC = () => {
  const [itemType, setItemType] = useState<'FishHouse' | 'Vehicle' | 'Trailer'>('Vehicle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    // Basic Information
    year: '',
    make: '',
    model: '',
    vin: '',
    stockNo: '',
    condition: 'New',
    category: '',
    width: '',
    length: '',
    price: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const checkVINExists = async (vin: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/inventory?search=${encodeURIComponent(vin)}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      // Check if any vehicles have matching VIN
      return data.vehicles?.some((vehicle: VehicleData) => 
        vehicle.VIN?.toUpperCase() === vin.toUpperCase()
      ) || false;
    } catch (error) {
      console.error('Error checking VIN:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Check if VIN already exists
      const vinExists = await checkVINExists(formData.vin);
      
      if (vinExists) {
        setError('This VIN Already EXISTS');
        setIsSubmitting(false);
        return;
      }
      
      // Determine TypeID based on itemType
      const typeId = itemType === 'FishHouse' ? 1 : itemType === 'Vehicle' ? 2 : 3;
      
      const submissionData = {
        ...formData,
        typeId,
        itemType
      };
      
      console.log('Form submitted:', submissionData);
      // TODO: Implement API submission logic
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitting(false);
      // TODO: Redirect or show success message
    } catch {
      setError('An error occurred while submitting the form');
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/inventory" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Inventory
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Add New Inventory Item</h1>
            <p className="text-gray-600 mt-1">Enter the details for the new item</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Section 1: Item Type Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Item Type</h2>
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

            {/* Section 2: Item Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Item Details</h2>
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

                {/* VIN - Required */}
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

                {/* Condition - Required (New or Pre-Owned only) */}
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
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="e.g., Sedan, Utility, etc."
                  />
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

            {/* Photo Upload */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Photos (Optional)</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-600 transition-colors bg-gray-50">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 mb-2 font-medium">Click to upload photos or drag and drop</p>
                <p className="text-sm text-gray-600">PNG, JPG, GIF up to 10MB each</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-block mt-4 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer transition-colors font-medium"
                >
                  Choose Files
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Checking VIN...</span>
                  </>
                ) : (
                  'Add Inventory Item'
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
};

export default AddInventoryPage;