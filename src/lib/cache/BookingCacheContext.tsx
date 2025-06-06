'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BookingCache } from './bookingCache';

interface BookingCacheContextType {
  clearCache: () => void;
  clearCategoryCache: () => void;
  clearServiceCache: (categoryId?: string) => void;
  clearStaffCache: (serviceId?: string) => void;
  clearAvailabilityCache: (staffId?: string, serviceId?: string, date?: string) => void;
  isCacheClearing: boolean;
}

const BookingCacheContext = createContext<BookingCacheContextType | undefined>(undefined);

export function BookingCacheProvider({ children }: { children: ReactNode }) {
  const [isCacheClearing, setIsCacheClearing] = useState(false);

  // Clear all booking cache
  const clearCache = useCallback(() => {
    setIsCacheClearing(true);
    try {
      BookingCache.clearAll();
    } finally {
      setIsCacheClearing(false);
    }
  }, []);

  // Clear only category cache
  const clearCategoryCache = useCallback(() => {
    setIsCacheClearing(true);
    try {
      BookingCache.remove('categories');
    } finally {
      setIsCacheClearing(false);
    }
  }, []);

  // Clear service cache for a specific category or all categories
  const clearServiceCache = useCallback((categoryId?: string) => {
    setIsCacheClearing(true);
    try {
      if (categoryId) {
        BookingCache.remove(`services_${categoryId}`);
      } else {
        // Clear all service caches by finding all keys that start with 'services_'
        Object.keys(localStorage)
          .filter(key => key.startsWith('booking_cache_services_'))
          .forEach(key => localStorage.removeItem(key));
      }
    } finally {
      setIsCacheClearing(false);
    }
  }, []);

  // Clear staff cache for a specific service or all services
  const clearStaffCache = useCallback((serviceId?: string) => {
    setIsCacheClearing(true);
    try {
      if (serviceId) {
        BookingCache.remove(`staff_${serviceId}`);
      } else {
        // Clear all staff caches
        Object.keys(localStorage)
          .filter(key => key.startsWith('booking_cache_staff_'))
          .forEach(key => localStorage.removeItem(key));
      }
    } finally {
      setIsCacheClearing(false);
    }
  }, []);

  // Clear availability cache for specific parameters or all availability
  const clearAvailabilityCache = useCallback((staffId?: string, serviceId?: string, date?: string) => {
    setIsCacheClearing(true);
    try {
      if (staffId && serviceId && date) {
        // Clear specific availability
        BookingCache.remove(`availability_${staffId}_${serviceId}_${date}`);
      } else {
        // Clear all availability caches
        Object.keys(localStorage)
          .filter(key => key.startsWith('booking_cache_availability_'))
          .forEach(key => localStorage.removeItem(key));
      }
    } finally {
      setIsCacheClearing(false);
    }
  }, []);

  const value = {
    clearCache,
    clearCategoryCache,
    clearServiceCache,
    clearStaffCache,
    clearAvailabilityCache,
    isCacheClearing
  };

  return (
    <BookingCacheContext.Provider value={value}>
      {children}
    </BookingCacheContext.Provider>
  );
}

export function useBookingCache() {
  const context = useContext(BookingCacheContext);
  if (context === undefined) {
    throw new Error('useBookingCache must be used within a BookingCacheProvider');
  }
  return context;
}
