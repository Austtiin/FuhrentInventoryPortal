import React from 'react';

interface SkeletonCardProps {
  count?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
        >
          {/* Image skeleton */}
          <div className="w-full h-40 sm:h-48 bg-gray-200"></div>
          
          {/* Content skeleton */}
          <div className="p-4 sm:p-5">
            {/* Header skeleton */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-16 ml-3"></div>
            </div>

            {/* Details grid skeleton */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="h-3 bg-gray-200 rounded w-8 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>

            {/* Price skeleton */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="h-3 bg-gray-200 rounded w-8 mb-1"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
              <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
              <div className="h-10 bg-gray-200 rounded-lg flex-1 sm:flex-initial"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonCard;