'use client';

import { useState } from 'react';
import { useBookingCache } from '@/lib/cache/BookingCacheContext';
import { useAuth } from '@/lib/hooks/useAuth';

export default function CacheControls() {
  const { isAdmin } = useAuth();
  const {
    clearCache,
    clearCategoryCache,
    clearServiceCache,
    clearStaffCache,
    clearAvailabilityCache,
    isCacheClearing
  } = useBookingCache();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isExpanded ? (
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Cache Controls</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={clearCategoryCache}
              disabled={isCacheClearing}
              className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-2 rounded border border-blue-200"
            >
              Clear Categories Cache
            </button>
            <button
              onClick={() => clearServiceCache()}
              disabled={isCacheClearing}
              className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-2 rounded border border-blue-200"
            >
              Clear Services Cache
            </button>
            <button
              onClick={() => clearStaffCache()}
              disabled={isCacheClearing}
              className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-2 rounded border border-blue-200"
            >
              Clear Staff Cache
            </button>
            <button
              onClick={() => clearAvailabilityCache()}
              disabled={isCacheClearing}
              className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-2 rounded border border-blue-200"
            >
              Clear Availability Cache
            </button>
            <button
              onClick={clearCache}
              disabled={isCacheClearing}
              className="w-full text-xs bg-red-50 hover:bg-red-100 text-red-700 py-1 px-2 rounded border border-red-200"
            >
              Clear All Cache
            </button>
          </div>
          {isCacheClearing && (
            <div className="mt-2 text-xs text-center text-gray-500">Clearing cache...</div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-white shadow-lg rounded-full p-2 border border-gray-200 hover:bg-gray-50"
          title="Cache Controls"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      )}
    </div>
  );
}
