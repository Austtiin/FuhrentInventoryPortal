'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Layout } from '@/components/layout';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { VEHICLE_COLORS, STATUS_OPTIONS } from '@/constants/inventory';

// Utility function to capitalize first letter of each word
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Fields that should be capitalized
// Note: exclude 'category' to preserve exact option values like 'RV'
const TITLE_CASE_FIELDS = ['make', 'model'];
const UPPERCASE_FIELDS = ['vin', 'stockNo'];

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
    color: '',
    stockNo: '',
    condition: 'New',
    status: 'Available',
    category: '',
    width: '',
    length: '',
    price: '',
    msrp: '',
  });

  // Category options
  const BASE_CATEGORY_OPTIONS = ['RV', 'No Water', 'Toy Hauler', 'Snowmobile Trailer', 'Skid House'];
  const VEHICLE_CATEGORY_OPTIONS = [
    'Car',
    'Truck',
    'SUV',
    'Sedan',
    'Coupe',
    'Van',
    'Hatchback',
    'Convertible',
    'Box Truck',
    'Pickup Truck',
    'Wagon',
    'Crossover',
  ];

  const categoryOptions = itemType === 'Vehicle'
    ? VEHICLE_CATEGORY_OPTIONS
    : BASE_CATEGORY_OPTIONS;

  // Ensure category remains valid when item type changes
  useEffect(() => {
    if (formData.category && !categoryOptions.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType]);

  // Make quick suggestions (free-text remains allowed)
  const MAKE_SUGGESTIONS = [
    'Ice Castle Fish House',
    'Aluma-Light',
    'Toyota',
    'BMW',
    'Chevy',
    'Ford',
    'Honda',
  ];

  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const filteredMakeSuggestions = MAKE_SUGGESTIONS.filter(s =>
    !formData.make ? true : s.toLowerCase().includes(formData.make.toLowerCase())
  );

  // Derived: what will be sent for MSRP
  const msrpToSend = formData.msrp !== '' && !Number.isNaN(parseFloat(formData.msrp))
    ? parseFloat(formData.msrp)
    : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Apply appropriate text formatting based on field
    let processedValue = value;
    if (TITLE_CASE_FIELDS.includes(name)) {
      processedValue = toTitleCase(value);
    } else if (UPPERCASE_FIELDS.includes(name)) {
      processedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const checkVINExists = async (vin: string): Promise<boolean> => {
    try {
      const response = await apiFetch(`/checkvin/${vin.toUpperCase()}`, {
        method: 'GET',
        headers: {
          // Ensure fresh data for critical VIN checking
          'Cache-Control': 'no-cache',
          'X-Timestamp': Date.now().toString(),
        }
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.exists || false;
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
      // Basic required validations
      if (!formData.stockNo || !formData.stockNo.trim()) {
        setError('Stock Number is required');
        setIsSubmitting(false);
        return;
      }
      // Check if VIN already exists
      const vinExists = await checkVINExists(formData.vin);
      
      if (vinExists) {
        setError('This VIN Already EXISTS in the database');
        setIsSubmitting(false);
        return;
      }
      
      // Determine TypeID based on itemType
      const typeId = itemType === 'FishHouse' ? 1 : itemType === 'Vehicle' ? 2 : 3;
      
      const submissionData: {
        vin: string;
        year: number;
        make: string;
        model: string;
        typeId: number;
        price: number;
        status: string;
        color: string;
        stockNo: string;
        condition: string;
        category: string;
        widthCategory: string;
        sizeCategory: string;
        msrp: number | null;
        MSRP?: number | null;
      } = {
        vin: formData.vin,
        year: parseInt(formData.year) || 0,
        make: formData.make,
        model: formData.model,
        typeId,
        price: parseFloat(formData.price) || 0,
        status: formData.status,
        color: formData.color,
        stockNo: formData.stockNo,
        condition: formData.condition,
        category: formData.category,
        widthCategory: formData.width,
        sizeCategory: formData.length,
        msrp: formData.msrp !== '' && !Number.isNaN(parseFloat(formData.msrp)) ? parseFloat(formData.msrp) : null,
      };
      // Duplicate with uppercase for compatibility with backends expecting 'MSRP'
      submissionData.MSRP = submissionData.msrp;
      
      // Submit to API
      const response = await apiFetch('/vehicles/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Best-effort: ensure storage folder exists for this VIN
        try {
          if (formData.vin) {
            await apiFetch(`/ensureVinFolder/${encodeURIComponent(formData.vin)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, skipRetry: true });
          }
        } catch (e) {
          console.warn('ensureVinFolder failed (non-fatal):', e);
        }
        // Success! Redirect to inventory page
        window.location.href = '/inventory';
      } else {
        setError(result.error || 'Failed to add vehicle');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('An error occurred while submitting the form');
      setIsSubmitting(false);
      console.error('Submit error:', err);
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

                {/* Make - Required with quick suggestions */}
                <div className="relative overflow-visible">
                  <label htmlFor="make" className="block text-sm font-medium text-gray-900 mb-2">
                    Make <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    value={formData.make}
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowMakeSuggestions(true);
                    }}
                    onFocus={() => setShowMakeSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowMakeSuggestions(false), 150)}
                    required
                    list="make-suggestions"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Enter make"
                  />
                  <datalist id="make-suggestions">
                    <option value="Ice Castle Fish House" />
                    <option value="Toyota" />
                    <option value="BMW" />
                    <option value="Chevy" />
                    <option value="Ford" />
                    <option value="Honda" />
                  </datalist>

                  {showMakeSuggestions && filteredMakeSuggestions.length > 0 && (
                    <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {filteredMakeSuggestions.map((opt) => (
                        <li
                          key={opt}
                          className="cursor-pointer px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
                          onMouseDown={(e) => {
                            // onMouseDown to avoid blur before click
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, make: opt }));
                            setShowMakeSuggestions(false);
                          }}
                        >
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
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

                {/* Color */}
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-900 mb-2">
                    Color <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Select Color</option>
                    {VEHICLE_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
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

                {/* MSRP - Optional */}
                <div>
                  <label htmlFor="msrp" className="block text-sm font-medium text-gray-900 mb-2">
                    MSRP (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-600 font-medium">$</span>
                    <input
                      type="number"
                      id="msrp"
                      name="msrp"
                      value={formData.msrp}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Will send: <span className="font-medium">msrp</span> = {msrpToSend === null ? 'null' : msrpToSend} and <span className="font-medium">MSRP</span> = {msrpToSend === null ? 'null' : msrpToSend}
                  </p>
                </div>

                {/* Stock Number - Required */}
                <div>
                  <label htmlFor="stockNo" className="block text-sm font-medium text-gray-900 mb-2">
                    Stock No <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="stockNo"
                    name="stockNo"
                    value={formData.stockNo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase"
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

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.label}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category - Required */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-2">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
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

              {/* Features Info - Managed on Edit */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Features</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zM9 9V5h2v4H9zm0 2h2v4H9v-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-amber-900">Add features once unit is created</h3>
                      <p className="text-sm text-amber-800 mt-1">You can manage features on the Edit Inventory page after creating this item.</p>
                    </div>
                  </div>
                </div>
              </div>

            {/* Photo Upload Information */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">5. Photos</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">📸 Upload Photos After Creating Unit</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Photos can be added and managed after you create the inventory item. 
                      Once you click <strong>&quot;Add Inventory Item&quot;</strong> below, you&apos;ll be redirected to the inventory list. 
                      From there, click <strong>&quot;Edit&quot;</strong> on your newly created item to upload and organize photos.
                    </p>
                    <div className="bg-white rounded p-3 space-y-1.5 text-sm text-gray-700">
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Upload multiple images at once
                      </p>
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Drag and drop to reorder images
                      </p>
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Images automatically numbered (1, 2, 3...)
                      </p>
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        JPG, PNG, GIF, WEBP (max 10MB each)
                      </p>
                    </div>
                  </div>
                </div>
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