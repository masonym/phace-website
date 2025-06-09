/**
 * Cache utility for booking-related data
 * Implements client-side caching using localStorage with expiration
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export class BookingCache {
  /**
   * Default cache expiration time in milliseconds (5 minutes)
   */
  private static DEFAULT_EXPIRATION = 0 * 60 * 1000;

  /**
   * Categories cache expiration time (15 minutes)
   */
  private static CATEGORIES_EXPIRATION = 0 * 60 * 1000;

  /**
   * Staff cache expiration time (10 minutes)
   */
  private static STAFF_EXPIRATION = 10 * 60 * 1000;

  /**
   * Availability cache expiration time (2 minutes)
   * Shorter expiration for availability to ensure freshness
   */
  private static AVAILABILITY_EXPIRATION = 2 * 60 * 1000;

  /**
   * Set an item in the cache
   */
  static set<T>(key: string, data: T, expiration?: number): void {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`booking_cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error setting cache:', error);
      // If localStorage fails, we'll just continue without caching
    }
  }

  /**
   * Get an item from the cache
   * Returns null if the item doesn't exist or has expired
   */
  static get<T>(key: string, expiration: number = this.DEFAULT_EXPIRATION): T | null {
    try {
      const cachedData = localStorage.getItem(`booking_cache_${key}`);
      if (!cachedData) return null;

      const cacheEntry: CacheEntry<T> = JSON.parse(cachedData);
      const now = Date.now();

      // Check if the cache entry has expired
      if (now - cacheEntry.timestamp > expiration) {
        localStorage.removeItem(`booking_cache_${key}`);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  /**
   * Remove an item from the cache
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(`booking_cache_${key}`);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  }

  /**
   * Clear all booking-related cache entries
   */
  static clearAll(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('booking_cache_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get categories from cache or fetch them
   */
  static async getCategories(fetchFn: () => Promise<any[]>): Promise<any[]> {
    const cachedCategories = this.get<any[]>('categories', this.CATEGORIES_EXPIRATION);
    if (cachedCategories) {
      console.log('Using cached categories');
      return cachedCategories;
    }

    console.log('Fetching fresh categories');
    const categories = await fetchFn();
    this.set('categories', categories, this.CATEGORIES_EXPIRATION);
    return categories;
  }

  /**
   * Get services for a category from cache or fetch them
   */
  static async getServicesByCategory(categoryId: string, fetchFn: () => Promise<any[]>): Promise<any[]> {
    const cacheKey = `services_${categoryId}`;
    const cachedServices = this.get<any[]>(cacheKey);
    if (cachedServices) {
      console.log(`Using cached services for category ${categoryId}`);
      return cachedServices;
    }

    console.log(`Fetching fresh services for category ${categoryId}`);
    const services = await fetchFn();
    this.set(cacheKey, services);
    return services;
  }

  /**
   * Get staff members from cache or fetch them
   */
  static async getStaffForService(serviceId: string, fetchFn: () => Promise<any[]>): Promise<any[]> {
    const cacheKey = `staff_${serviceId}`;
    const cachedStaff = this.get<any[]>(cacheKey, this.STAFF_EXPIRATION);
    if (cachedStaff) {
      console.log(`Using cached staff for service ${serviceId}`);
      return cachedStaff;
    }

    console.log(`Fetching fresh staff for service ${serviceId}`);
    const staff = await fetchFn();
    this.set(cacheKey, staff, this.STAFF_EXPIRATION);
    return staff;
  }

  /**
   * Get availability for a specific date from cache or fetch it
   */
  static async getAvailability(
    staffId: string,
    serviceId: string,
    date: string,
    fetchFn: () => Promise<any>
  ): Promise<any> {
    const cacheKey = `availability_${staffId}_${serviceId}_${date}`;
    const cachedAvailability = this.get<any>(cacheKey, this.AVAILABILITY_EXPIRATION);
    if (cachedAvailability) {
      console.log(`Using cached availability for ${date}`);
      return cachedAvailability;
    }

    console.log(`Fetching fresh availability for ${date}`);
    const availability = await fetchFn();
    this.set(cacheKey, availability, this.AVAILABILITY_EXPIRATION);
    return availability;
  }
}
