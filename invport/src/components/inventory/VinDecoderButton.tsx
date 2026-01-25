'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

interface VinDecoderData {
  make?: string;
  model?: string;
  modelYear?: string;
  vehicleType?: string;
  bodyClass?: string;
  bodyStyle?: string;
  numberOfDoors?: string;
  trailerType?: string;
  trailerLength?: string;
  trailerBodyType?: string;
  engineCylinders?: string;
  engineDisplacement?: string;
  engineHP?: string;
  fuelType?: string;
  driveType?: string;
  transmission?: string;
  gvwr?: string;
  gvwrTo?: string;
  manufacturer?: string;
  series?: string;
  trim?: string;
  abs?: string;
  airBagLocations?: string;
  entertainmentSystem?: string;
  [key: string]: string | undefined;
}

interface VinDecodeResponse {
  success: boolean;
  vin: string;
  hasWarnings?: boolean;
  errorLevel?: string;
  warnings?: string[];
  errors?: string[];
  data?: VinDecoderData;
  source?: string;
  useAlternateApi?: boolean;
  timestamp?: string;
  responseTimeMs?: number;
}

interface VinDecoderButtonProps {
  currentVin?: string;
  onFeaturesGenerated: (features: string[]) => void;
  className?: string;
}

export function VinDecoderButton({ currentVin, onFeaturesGenerated, className = '' }: VinDecoderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [vin, setVin] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string>('');
  const [decodedData, setDecodedData] = useState<VinDecoderData | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleOpen = () => {
    setVin(currentVin || '');
    setIsOpen(true);
    setError('');
    setDecodedData(null);
    setWarnings([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setVin('');
    setError('');
    setDecodedData(null);
    setWarnings([]);
  };

  const mapDataToFeatures = (data: VinDecoderData): string[] => {
    const features: string[] = [];

    // Engine & Drivetrain
    if (data.engineCylinders) {
      features.push(`${data.engineCylinders} Cylinder Engine`);
    }
    if (data.engineDisplacement) {
      features.push(`${data.engineDisplacement}L Engine`);
    }
    if (data.engineHP) {
      features.push(`${data.engineHP} HP Engine`);
    }
    if (data.fuelType && data.fuelType !== 'Not Applicable') {
      features.push(`Fuel Type: ${data.fuelType}`);
    }
    if (data.driveType && data.driveType !== 'Not Applicable') {
      features.push(`Drive Type: ${data.driveType}`);
    }
    if (data.transmission && data.transmission !== 'Not Applicable') {
      features.push(`Transmission: ${data.transmission}`);
    }

    // Body & Style
    if (data.bodyClass && data.bodyClass !== 'Not Applicable') {
      features.push(`Body Class: ${data.bodyClass}`);
    }
    if (data.bodyStyle && data.bodyStyle !== 'Not Applicable') {
      features.push(`Body Style: ${data.bodyStyle}`);
    }
    if (data.numberOfDoors && data.numberOfDoors !== 'Not Applicable') {
      features.push(`${data.numberOfDoors} Doors`);
    }

    // Trailer specific
    if (data.trailerType && data.trailerType !== 'Not Applicable') {
      features.push(`Trailer Type: ${data.trailerType}`);
    }
    if (data.trailerLength && data.trailerLength !== 'Not Applicable') {
      features.push(`Trailer Length: ${data.trailerLength}ft`);
    }
    if (data.trailerBodyType && data.trailerBodyType !== 'Not Applicable') {
      features.push(`Trailer Body: ${data.trailerBodyType}`);
    }

    // Safety & Tech
    if (data.abs && data.abs !== 'Not Applicable' && data.abs.toLowerCase() !== 'no') {
      features.push('ABS Brakes');
    }
    if (data.airBagLocations && data.airBagLocations !== 'Not Applicable') {
      features.push(`Air Bags: ${data.airBagLocations}`);
    }
    if (data.entertainmentSystem && data.entertainmentSystem !== 'Not Applicable') {
      features.push(`Entertainment: ${data.entertainmentSystem}`);
    }

    // Weight ratings
    if (data.gvwr && data.gvwr !== 'Not Applicable') {
      features.push(`GVWR: ${data.gvwr} lbs`);
    }

    // Series & Trim
    if (data.series && data.series !== 'Not Applicable') {
      features.push(`Series: ${data.series}`);
    }
    if (data.trim && data.trim !== 'Not Applicable') {
      features.push(`Trim: ${data.trim}`);
    }

    return features;
  };

  const handleDecode = async () => {
    if (!vin || vin.trim().length !== 17) {
      setError('VIN must be exactly 17 characters');
      return;
    }

    setIsDecoding(true);
    setError('');
    setWarnings([]);
    setDecodedData(null);

    try {
      const response = await apiFetch(`/decodevins/${vin.trim().toUpperCase()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to decode VIN: ${response.status}`);
      }

      const data: VinDecodeResponse = await response.json();

      if (!data.success) {
        setError(data.errors?.join(', ') || 'Failed to decode VIN');
        if (data.warnings && data.warnings.length > 0) {
          setWarnings(data.warnings);
        }
        return;
      }

      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings);
      }

      setDecodedData(data.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode VIN');
    } finally {
      setIsDecoding(false);
    }
  };

  const handleApplyFeatures = () => {
    if (!decodedData) return;

    const features = mapDataToFeatures(decodedData);
    onFeaturesGenerated(features);
    handleClose();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Decode VIN
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">VIN Decoder</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* VIN Input */}
          <div>
            <label htmlFor="vin-input" className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle VIN
            </label>
            <div className="flex gap-2">
              <input
                id="vin-input"
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
                placeholder="Enter 17-character VIN"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleDecode}
                disabled={isDecoding || vin.trim().length !== 17}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isDecoding ? 'Decoding...' : 'Decode'}
              </button>
            </div>
            {vin.trim().length > 0 && vin.trim().length !== 17 && (
              <p className="mt-1 text-sm text-amber-600">VIN must be exactly 17 characters</p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Warnings Display */}
          {warnings.length > 0 && (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-900 mb-1">Warnings:</p>
              <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Decoded Data Display */}
          {decodedData && (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-blue-50 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Decoded Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {decodedData.make && (
                    <div>
                      <span className="font-medium text-gray-700">Make:</span>
                      <span className="ml-2 text-gray-900">{decodedData.make}</span>
                    </div>
                  )}
                  {decodedData.model && (
                    <div>
                      <span className="font-medium text-gray-700">Model:</span>
                      <span className="ml-2 text-gray-900">{decodedData.model}</span>
                    </div>
                  )}
                  {decodedData.modelYear && (
                    <div>
                      <span className="font-medium text-gray-700">Year:</span>
                      <span className="ml-2 text-gray-900">{decodedData.modelYear}</span>
                    </div>
                  )}
                  {decodedData.vehicleType && (
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-2 text-gray-900">{decodedData.vehicleType}</span>
                    </div>
                  )}
                  {decodedData.manufacturer && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Manufacturer:</span>
                      <span className="ml-2 text-gray-900">{decodedData.manufacturer}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-md bg-green-50 border border-green-200">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Features to be Added</h3>
                <p className="text-xs text-gray-600 mb-3">
                  These features will be added to your existing features (duplicates will be handled automatically)
                </p>
                <div className="space-y-1">
                  {mapDataToFeatures(decodedData).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-900">{feature}</span>
                    </div>
                  ))}
                  {mapDataToFeatures(decodedData).length === 0 && (
                    <p className="text-sm text-gray-600">No features could be extracted from this VIN</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {decodedData && (
            <button
              onClick={handleApplyFeatures}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Add Features
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
