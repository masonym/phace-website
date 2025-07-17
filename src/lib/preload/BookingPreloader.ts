/**
 * BookingPreloader
 * 
 * A utility class for aggressively pre-loading booking data to improve perceived performance
 */

import { BookingCache } from '../cache/bookingCache';

export class BookingPreloader {
  /**
   * Pre-load service categories when the booking page first loads
   */
  static async preloadCategories(): Promise<void> {
    try {
      console.log('Pre-loading service categories');
      const response = await fetch('/api/booking/services');
      if (!response.ok) throw new Error('Failed to pre-load categories');
      const data = await response.json();
      BookingCache.set('categories', data, BookingCache['CATEGORIES_EXPIRATION']);
      console.log('Pre-loaded service categories successfully');
    } catch (error) {
      console.error('Error pre-loading categories:', error);
    }
  }

  /**
   * Pre-load services for a category in the background
   */
  static async preloadServicesForCategory(categoryId: string): Promise<void> {
    try {
      console.log(`Pre-loading services for category ${categoryId}`);
      const response = await fetch(`/api/booking/services?categoryId=${encodeURIComponent(categoryId)}`);
      if (!response.ok) throw new Error('Failed to pre-load services');
      const data = await response.json();
      
      if (data && data.length > 0 && Array.isArray(data[0].services)) {
        const cacheKey = `services_${categoryId}`;
        BookingCache.set(cacheKey, data[0].services);
        console.log(`Pre-loaded ${data[0].services.length} services for category ${categoryId}`);
      }
    } catch (error) {
      console.error(`Error pre-loading services for category ${categoryId}:`, error);
    }
  }

  /**
   * Pre-load staff for a service in the background
   */
  static async preloadStaffForService(serviceId: string): Promise<void> {
    try {
      console.log(`[PRELOADER DEBUG] Starting pre-load of staff for service ${serviceId}`);
      // Check if we already have this cached before making the request
      const cachedStaff = BookingCache.get(`staff_${serviceId}`, BookingCache['STAFF_EXPIRATION']);
      if (cachedStaff) {
        console.log(`[PRELOADER DEBUG] Using cached staff for service ${serviceId}`);
        return;
      }
      
      console.time(`preload-staff-${serviceId}`);
      const response = await fetch(`/api/booking/staff?serviceId=${serviceId}`);
      if (!response.ok) throw new Error('Failed to pre-load staff');
      const data = await response.json();
      const cacheKey = `staff_${serviceId}`;
      BookingCache.set(cacheKey, data, BookingCache['STAFF_EXPIRATION']);
      console.timeEnd(`preload-staff-${serviceId}`);
      console.log(`[PRELOADER DEBUG] Successfully pre-loaded ${data.length} staff members for service ${serviceId}`);
    } catch (error) {
      console.error(`[PRELOADER DEBUG] Error pre-loading staff for service ${serviceId}:`, error);
    }
  }

  /**
   * Pre-load addons for a service in the background
   * @returns Array of addons for the service
   */
  static async preloadAddonsForService(serviceId: string): Promise<any[]> {
    try {
      console.log(`Pre-loading addons for service ${serviceId}`);
      const response = await fetch(`/api/booking/addons?serviceId=${serviceId}`);
      if (!response.ok) throw new Error('Failed to pre-load addons');
      const data = await response.json();
      const cacheKey = `addons_${serviceId}`;
      BookingCache.set(cacheKey, data);
      console.log(`Pre-loaded ${data.length} addons for service ${serviceId}`);
      return data;
    } catch (error) {
      console.error(`Error pre-loading addons for service ${serviceId}:`, error);
      return [];
    }
  }

  /**
   * Pre-load availability for a date range
   * 
   * @param serviceId Service ID
   * @param staffId Staff ID
   * @param date ISO date string (YYYY-MM-DD)
   * @param variationId Optional variation ID
   */
  static async preloadAvailability(
    serviceId: string, 
    staffId: string, 
    date: string,
    variationId?: string
  ): Promise<void> {
    try {
      console.log(`Pre-loading availability for ${date}`);
      const params = new URLSearchParams({
        serviceId,
        staffId,
        date,
        ...(variationId && { variationId })
      });
      
      const response = await fetch(`/api/booking/availability?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to pre-load availability');
      const data = await response.json();
      
      const cacheKey = `availability_${staffId}_${serviceId}_${date}`;
      BookingCache.set(cacheKey, data, BookingCache['AVAILABILITY_EXPIRATION']);
      console.log(`Pre-loaded availability for ${date}`);
    } catch (error) {
      console.error(`Error pre-loading availability for ${date}:`, error);
    }
  }
}
