import { SquareClient } from "square";
import { randomUUID } from 'crypto';

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
});

// Types for Square Booking
interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  updatedAt?: string;
  isActive: boolean;
}

interface ServiceVariation {
  id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  imageUrl?: string;
  isActive: boolean;
  updatedAt?: string;
  variationId: string;
  variations?: ServiceVariation[];
}

interface ServiceAddon {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface StaffAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface StaffMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  imageUrl?: string;
  defaultAvailability: StaffAvailability[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  totalDuration: number;
  addons?: ServiceAddon[];
  notes?: string;
  consentFormResponses?: any[];
  userId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface CreateAppointmentParams {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  totalDuration: number;
  addons?: string[];
  notes?: string;
  consentFormResponses?: any[];
  userId?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

/**
 * Service for interacting with Square's Booking API
 */
export class SquareBookingService {
  /**
   * Helper function to safely convert BigInt values to numbers
   * @param value The value to convert
   */
  static safeNumber(value: number | bigint): number {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return value;
  }

  /**
   * Helper function to safely stringify objects with BigInt values
   * @param obj The object to stringify
   */
  static safeStringify(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, 2);
  }

  /**
   * Helper to get location ID
   */
  static async getLocationId(): Promise<string> {
    return process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;
  }

  /**
   * Helper to convert Square day of week to number
   */
  static convertDayOfWeekToNumber(dayOfWeek: string): number {
    const days = {
      'MON': 1,
      'TUE': 2,
      'WED': 3,
      'THU': 4,
      'FRI': 5,
      'SAT': 6,
      'SUN': 0
    };
    return days[dayOfWeek as keyof typeof days];
  }

  /**
   * Helper to convert number to Square day of week
   */
  static convertNumberToDayOfWeek(dayNumber: number): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[dayNumber];
  }

  /**
   * Map our appointment status to Square's booking status
   */
  static mapToSquareBookingStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'confirmed': 'ACCEPTED',
      'cancelled': 'CANCELLED',
      'completed': 'ACCEPTED',
      'no-show': 'NO_SHOW'
    };
    return statusMap[status] || 'ACCEPTED';
  }

  /**
   * Map Square's booking status to our appointment status
   */
  static mapFromSquareBookingStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'ACCEPTED': 'confirmed',
      'CANCELLED': 'cancelled',
      'NO_SHOW': 'no-show',
      'DECLINED': 'cancelled'
    };
    return statusMap[status] || 'confirmed';
  }

  /**
   * Get all service categories
   */
  static async getServiceCategories(): Promise<ServiceCategory[]> {
    try {
      console.log("Running getServiceCategories()")
      const locationId = await this.getLocationId();

      // Get catalog items that are categories
      const result = await client.catalog.search({
        objectTypes: ['CATEGORY']
      });

      console.log("Result: ", result)

      if (!result.objects) {
        return [];
      }

      // Get detailed information about each category with related objects
      const categoryIds = result.objects.map(obj => obj.id!);
      const detailedResult = await client.catalog.batchGet({
        objectIds: categoryIds,
        includeRelatedObjects: true
      });

      if (!detailedResult.objects) {
        return [];
      }

      // Map Square catalog categories to our ServiceCategory format
      return detailedResult.objects
        .filter(obj => obj.type === 'CATEGORY')
        .map(obj => {
          const category = obj.categoryData!;

          // Look for an image in related objects that might be associated with this category
          let imageUrl: string | undefined = undefined;
          if (detailedResult.relatedObjects) {
            const relatedImage = detailedResult.relatedObjects.find(
              related => related.type === 'IMAGE' &&
                related.imageData?.url &&
                obj.categoryData?.imageIds?.includes(related.id!)
            );
            //if (relatedImage?.imageId?.url) {
            //  imageUrl = relatedImage.imageData.url;
            //}
          }

          return {
            id: obj.id!,
            name: category.name!,
            //description: category.description || '',
            imageUrl,
            isActive: true, // Set all categories to active by default
            updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : undefined
          };
        });
    } catch (error) {
      console.error('Error fetching service categories from Square:', error);
      return [];
    }
  }

  /**
   * Get all services (cached by category ID)
   * This is used internally to avoid multiple API calls for the same category
   */
  private static servicesByCategory: Record<string, { services: Service[], timestamp: number }> = {};

  /**
   * Cache expiration time in milliseconds (5 minutes)
   */
  private static SERVICES_CACHE_EXPIRATION = 5 * 60 * 1000;

  /**
   * Get services by category
   * @param categoryId The category ID to fetch services for
   * @param forceRefresh Whether to force a refresh from the API instead of using cache
   */
  static async getServicesByCategory(categoryId: string, forceRefresh = false): Promise<Service[]> {
    try {
      console.log(`getServicesByCategory called for ${categoryId}, forceRefresh: ${forceRefresh}`);

      // Check if we have a cached version that's less than 5 minutes old
      const now = Date.now();
      const cacheEntry = this.servicesByCategory[categoryId];
      const cacheValid = cacheEntry && (now - cacheEntry.timestamp < this.SERVICES_CACHE_EXPIRATION); // 5 minutes

      if (!forceRefresh && cacheValid) {
        console.log(`Returning ${cacheEntry.services.length} services from cache for category ${categoryId}`);
        return cacheEntry.services;
      }

      const locationId = await this.getLocationId();
      console.log(`Fetching services from Square API for category ${categoryId}`);

      // Get catalog items that are items with the specified category
      const result = await client.catalog.searchItems({
        categoryIds: [categoryId],
        productTypes: ['APPOINTMENTS_SERVICE']
      });

      console.log(`Square API returned ${result.items?.length || 0} items for category ${categoryId}`);

      // Use a custom replacer function to handle BigInt values in logging
      console.log('Raw result:', this.safeStringify(result));

      if (!result.items) {
        console.log(`No items found for category ${categoryId}, returning empty array`);
        this.servicesByCategory[categoryId] = { services: [], timestamp: now };
        return [];
      }

      // Map Square catalog items to our Service format
      const services = result.items.map(item => {
        try {
          console.log('Processing item:', this.safeStringify(item));

          // Find the first variation that has appointment data
          const variations = item.itemData?.variations || [];
          console.log('Variations:', this.safeStringify(variations));

          const variation = variations.find(v =>
            v.itemVariationData?.serviceDuration !== undefined
          ) || variations[0];

          console.log('Selected variation:', this.safeStringify(variation));

          const price = variation?.itemVariationData?.priceMoney?.amount || 0;
          const duration = variation?.itemVariationData?.serviceDuration || 0;
          const categoryId = item.itemData?.categoryId || '';

          const service = {
            id: item.id!,
            categoryId,
            name: item.itemData?.name || 'Unnamed Service',
            description: item.itemData?.description,
            price: this.safeNumber(price),
            duration: this.safeNumber(duration),
            imageUrl: item.itemData?.imageUrl,
            isActive: true,
            updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
            variationId: variation?.id || '',
            variations: variations.map(v => ({
              id: v.id,
              name: v.itemVariationData?.name || 'Unnamed Variation',
              price: this.safeNumber(v.itemVariationData?.priceMoney?.amount || 0),
              duration: this.safeNumber(v.itemVariationData?.serviceDuration || 0),
              isActive: true
            }))
          };

          console.log(`Mapped service: ${this.safeStringify(service)}`);
          return service;
        } catch (err) {
          console.error('Error mapping service item:', err);
          // Return a default service object if mapping fails
          return {
            id: item.id || `unknown-${Math.random().toString(36).substring(7)}`,
            categoryId,
            name: 'Error Loading Service',
            description: 'There was an error loading this service',
            price: 0,
            duration: 0,
            imageUrl: undefined,
            isActive: false,
            updatedAt: undefined,
            variationId: '',
            variations: []
          };
        }
      });

      console.log(`Mapped ${services.length} services for category ${categoryId}`);

      // Update the cache
      this.servicesByCategory[categoryId] = { services, timestamp: now };
      return services;
    } catch (error) {
      console.error(`Error fetching services for category ${categoryId}:`, error);
      return [];
    }
  }

  /**
   * Clear the services cache for a specific category or all categories
   * @param categoryId Optional category ID to clear cache for. If not provided, clears all caches.
   */
  static clearServicesCache(categoryId?: string): void {
    if (categoryId) {
      delete this.servicesByCategory[categoryId];
    } else {
      this.servicesByCategory = {};
    }
  }

  // Cache for individual services
  private static serviceByIdCache: {
    [serviceId: string]: {
      data: Service;
      timestamp: number;
    };
  } = {};

  /**
   * Get a service by ID with caching
   */
  static async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      // Check if we have cached data that's still valid
      if (
        this.serviceByIdCache[serviceId] &&
        Date.now() - this.serviceByIdCache[serviceId].timestamp < this.SERVICES_CACHE_EXPIRATION
      ) {
        console.log(`Using cached service data for ${serviceId}`);
        return this.serviceByIdCache[serviceId].data;
      }

      console.log(`Fetching fresh service data for ${serviceId} from Square`);

      // First check if the service is in our category cache
      for (const categoryId in this.servicesByCategory) {
        const cacheEntry = this.servicesByCategory[categoryId];
        const cachedService = cacheEntry.services.find(service => service.id === serviceId || service.variationId === serviceId);
        if (cachedService) {
          // Update the individual service cache
          this.serviceByIdCache[serviceId] = {
            data: cachedService,
            timestamp: Date.now()
          };
          console.log(`Found service ${serviceId} in category cache`);
          return cachedService;
        }
      }

      console.log(`Fetching fresh service data for ${serviceId} from Square`);

      // First try to get the object to determine if it's an ITEM or ITEM_VARIATION
      const result = await client.catalog.object.get({
        objectId: serviceId
      });

      console.log(`Square API response for ID ${serviceId}: ${this.safeStringify(result)}`);

      if (!result.object) {
        console.log(`No object found with ID ${serviceId}`);
        return null;
      }

      let service: Service;

      // Handle different object types
      if (result.object.type === 'ITEM') {
        // This is a regular service item
        const item = result.object;

        // Find the first variation that has appointment data
        const variation = item.itemData?.variations?.find(v =>
          v.itemVariationData?.serviceDuration !== undefined
        );

        const price = variation?.itemVariationData?.priceMoney?.amount || 0;
        const duration = variation?.itemVariationData?.serviceDuration || 0;
        const categoryId = item.itemData?.categoryId || '';

        service = {
          id: item.id!,
          categoryId,
          name: item.itemData?.name || 'Unnamed Service',
          description: item.itemData?.description,
          price: this.safeNumber(price),
          duration: this.safeNumber(duration),
          imageUrl: item.itemData?.imageUrl,
          isActive: true,
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
          variationId: variation?.id || '',
          variations: item.itemData?.variations?.map(v => ({
            id: v.id,
            name: v.itemVariationData?.name || 'Unnamed Variation',
            price: this.safeNumber(v.itemVariationData?.priceMoney?.amount || 0),
            duration: this.safeNumber(v.itemVariationData?.serviceDuration || 0),
            isActive: true
          })) || []
        };
      } else if (result.object.type === 'ITEM_VARIATION') {
        // This is a variation of a service
        const variation = result.object;

        // Get the parent item to get the service details
        const parentId = variation.itemVariationData?.itemId;
        if (!parentId) {
          console.log(`Variation ${serviceId} has no parent item ID`);
          return null;
        }

        const parentResult = await client.catalog.object.get({
          objectId: parentId
        });

        if (!parentResult.object || parentResult.object.type !== 'ITEM') {
          console.log(`Parent item not found for variation ${serviceId}`);
          return null;
        }

        const item = parentResult.object;
        const price = variation.itemVariationData?.priceMoney?.amount || 0;
        const duration = variation.itemVariationData?.serviceDuration || 0;
        const categoryId = item.itemData?.categoryId || '';

        service = {
          id: item.id!,
          categoryId,
          name: item.itemData?.name || 'Unnamed Service',
          description: item.itemData?.description,
          price: this.safeNumber(price),
          duration: this.safeNumber(duration),
          imageUrl: item.itemData?.imageUrl,
          isActive: true,
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
          variationId: variation.id!,
          variations: item.itemData?.variations?.map(v => ({
            id: v.id,
            name: v.itemVariationData?.name || 'Unnamed Variation',
            price: this.safeNumber(v.itemVariationData?.priceMoney?.amount || 0),
            duration: this.safeNumber(v.itemVariationData?.serviceDuration || 0),
            isActive: true
          })) || []
        };
      } else {
        console.log(`Object with ID ${serviceId} is not a service or variation (type: ${result.object.type})`);
        return null;
      }

      console.log(`Service found: ${service.name}, duration: ${service.duration}, variationId: ${service.variationId}`);

      // Update the individual service cache
      this.serviceByIdCache[serviceId] = {
        data: service,
        timestamp: Date.now()
      };

      // If this service has a category ID and we have a cache for it, add to cache
      if (service.categoryId && this.servicesByCategory[service.categoryId]) {
        // Check if service already exists in cache
        const existingIndex = this.servicesByCategory[service.categoryId].services.findIndex(s => s.id === service.id);
        if (existingIndex >= 0) {
          // Update existing service
          this.servicesByCategory[service.categoryId].services[existingIndex] = service;
        } else {
          // Add new service
          this.servicesByCategory[service.categoryId].services.push(service);
        }
      }

      return service;
    } catch (error) {
      console.error('Error fetching service by ID from Square:', error);

      // Return cached data if available, even if expired
      if (this.serviceByIdCache[serviceId]) {
        console.log(`Using expired cached service data for ${serviceId} due to error`);
        return this.serviceByIdCache[serviceId].data;
      }

      return null;
    }
  }

  /**
   * Get all services from all categories
   */
  static async getServices(): Promise<Service[]> {
    try {
      console.log("Getting all services");

      // Get all categories first
      const categories = await this.getServiceCategories();
      if (!categories || categories.length === 0) {
        console.log("No categories found");
        return [];
      }

      // Get services for each category and combine them
      const allServices: Service[] = [];
      for (const category of categories) {
        const services = await this.getServicesByCategory(category.id);
        allServices.push(...services);
      }

      console.log(`Retrieved ${allServices.length} total services`);
      return allServices;
    } catch (error) {
      console.error("Error getting all services:", error);
      return [];
    }
  }

  /**
   * Cache for staff members
   */
  private static staffCache: {
    data: StaffMember[];
    timestamp: number;
  } | null = null;

  /**
   * Cache expiration time in milliseconds (5 minutes)
   */
  private static STAFF_CACHE_EXPIRATION = 5 * 60 * 1000;

  /**
   * Get staff members with caching
   */
  static async getStaffMembers(): Promise<StaffMember[]> {
    try {
      // Check if we have cached data that's still valid
      if (
        this.staffCache &&
        Date.now() - this.staffCache.timestamp < this.STAFF_CACHE_EXPIRATION
      ) {
        console.log('Using cached staff members data');
        return this.staffCache.data;
      }

      console.log('Fetching fresh staff members data from Square');

      // Get team members who can be booked
      const bookingProfilesResponse = await client.bookings.teamMemberProfiles.list();

      if (!bookingProfilesResponse.data) {
        console.log('No team member booking profiles found');
        return [];
      }

      const bookingProfiles = bookingProfilesResponse.data;
      console.log(`Found ${bookingProfiles.length} team member booking profiles`);

      // Get detailed team member info for all team members
      const teamMemberIds = bookingProfiles.map(profile => profile.teamMemberId!);

      if (teamMemberIds.length === 0) {
        console.log('No team member IDs found in booking profiles');
        return [];
      }

      const teamMembersResult = await client.teamMembers.search({
        query: {
        }
      });

      if (!teamMembersResult.teamMembers || teamMembersResult.teamMembers.length === 0) {
        console.log('No team members found');
        return [];
      }

      console.log(`Found ${teamMembersResult.teamMembers.length} team members`);

      // Map Square team members to our StaffMember format
      const staffMembers = bookingProfiles.map(profile => {
        const teamMember = teamMembersResult.teamMembers?.find(
          tm => tm.id === profile.teamMemberId
        );

        if (!teamMember) {
          console.log(`No team member found for profile ${profile.teamMemberId}`);
          return null;
        }

        // Parse availability from the booking profile

        return {
          id: profile.teamMemberId!,
          name: profile.displayName || `${teamMember.givenName || ''} ${teamMember.familyName || ''}`.trim(),
          email: teamMember.emailAddress,
          phone: teamMember.phoneNumber,
          bio: profile.description,
          isActive: profile.isBookable && teamMember.status === 'ACTIVE',
          createdAt: new Date(teamMember.createdAt || Date.now()).toISOString(),
          updatedAt: teamMember.updatedAt
            ? new Date(teamMember.updatedAt).toISOString()
            : undefined
        };
      }).filter(Boolean) as StaffMember[];

      // Update the cache
      this.staffCache = {
        data: staffMembers,
        timestamp: Date.now()
      };

      return staffMembers;
    } catch (error) {
      console.error('Error fetching staff members from Square:', error);

      // Return cached data if available, even if expired
      if (this.staffCache) {
        console.log('Returning expired cached staff data due to error');
        return this.staffCache.data;
      }

      return [];
    }
  }

  // Cache for individual staff members
  private static staffByIdCache: {
    [staffId: string]: {
      data: StaffMember;
      timestamp: number;
    };
  } = {};

  /**
   * Get a staff member by ID with caching
   */
  static async getStaffById(staffId: string): Promise<StaffMember | null> {
    try {
      // Check if we have cached data that's still valid
      if (
        this.staffByIdCache[staffId] &&
        Date.now() - this.staffByIdCache[staffId].timestamp < this.STAFF_CACHE_EXPIRATION
      ) {
        console.log(`Using cached staff data for ${staffId}`);
        return this.staffByIdCache[staffId].data;
      }

      console.log(`Fetching fresh staff data for ${staffId} from Square`);

      // First check if the team member
      const teamMemberResult = await client.teamMembers.get({
        teamMemberId: staffId
      });

      if (!teamMemberResult.teamMember) {
        console.log(`No team member found with ID ${staffId}`);
        return null;
      }

      const teamMember = teamMemberResult.teamMember;

      // Get the booking profile for this team member
      const bookingProfileResult = await client.bookings.teamMemberProfiles.get({
        teamMemberId: staffId
      });

      if (!bookingProfileResult.teamMemberBookingProfile) {
        console.log(`No booking profile found for team member ${staffId}`);
        return null;
      }

      const profile = bookingProfileResult.teamMemberBookingProfile;

      console.log(`Retrieved booking profile for ${teamMember.givenName || ''} ${teamMember.familyName || ''}`);

      // We don't need to create default availability - we'll use searchAvailability
      // in the booking flow to check for specific service availability
      const defaultAvailability: StaffAvailability[] = [];

      const staffMember: StaffMember = {
        id: profile.teamMemberId!,
        name: profile.displayName || `${teamMember.givenName || ''} ${teamMember.familyName || ''}`.trim(),
        email: teamMember.emailAddress,
        phone: teamMember.phoneNumber,
        bio: profile.description,
        imageUrl: teamMember.profileImageUrl || '',
        defaultAvailability,
        isActive: profile.isBookable && teamMember.status === 'ACTIVE',
        createdAt: new Date(teamMember.createdAt || Date.now()).toISOString(),
        updatedAt: teamMember.updatedAt
          ? new Date(teamMember.updatedAt).toISOString()
          : undefined
      };

      // Update the cache
      this.staffByIdCache[staffId] = {
        data: staffMember,
        timestamp: Date.now()
      };

      return staffMember;
    } catch (error) {
      console.error('Error fetching staff member by ID from Square:', error);

      // Return cached data if available, even if expired
      if (this.staffByIdCache[staffId]) {
        console.log(`Returning expired cached staff data for ${staffId} due to error`);
        return this.staffByIdCache[staffId].data;
      }

      return null;
    }
  }

  static async getAllAddons(): Promise<ServiceAddon[]> {
    try {

      //TODO: IDK IF THIS WORKS
      //ADDON CATEGORY ID: JLTNITVYIK73RGMQAEE4D5TB
      const addonCategoryId = await client.catalog.searchItems({
        textFilter: 'Add-ons',
        productTypes: ['APPOINTMENTS_SERVICE']
      });
      var result = null
      const locationId = await this.getLocationId();
      if (addonCategoryId?.items) {
        result = await client.catalog.searchItems({
          categoryIds: [addonCategoryId.items[0].id!],
        });
      }

      console.log("Result: ", result)

      if (!result?.items) {
        return [];
      }

      // Map Square catalog items to our ServiceAddon format
      return result.items.map(item => {
        const price = item.itemData?.variations?.[0]?.itemVariationData?.priceMoney?.amount || 0;
        const duration = item.itemData?.variations?.[0]?.itemVariationData?.serviceDuration || 0;

        return {
          id: item.id!,
          name: item.itemData?.name || 'Unnamed Addon',
          description: item.itemData?.description,
          price: this.safeNumber(price),
          duration: this.safeNumber(duration),
          isActive: true
        };
      });
    } catch (error) {
      console.error('Error fetching addons from Square:', error);
      return [];
    }
  }


  /**
   * Get addons by IDs
   */
  static async getAddonsByIds(addonIds: string[]): Promise<ServiceAddon[]> {
    try {
      if (addonIds.length === 0) {
        return [];
      }

      // Get catalog items by IDs
      const result = await client.catalog.batchGet({
        objectIds: addonIds
      });

      if (!result.objects) {
        return [];
      }

      // Map Square catalog items to our ServiceAddon format
      return result.objects
        .filter(obj => obj.type === 'ITEM')
        .map(obj => {
          const item = obj.itemData!;
          const variation = item.variations?.[0];
          const price = variation?.itemVariationData?.priceMoney?.amount || 0;

          // For duration, we might need to use custom attributes
          // This is a placeholder - you'd need to define how duration is stored
          const customAttributes = variation?.itemVariationData?.customAttributeValues || {};
          const durationAttribute = Object.values(customAttributes).find(
            attr => attr.name === 'duration'
          );
          const duration = durationAttribute?.numberValue || 0;

          return {
            id: obj.id!,
            name: item.name || 'Unnamed Addon',
            description: item.description,
            price: this.safeNumber(price),
            duration: this.safeNumber(duration),
            isActive: true
          };
        });
    } catch (error) {
      console.error('Error fetching addons by IDs from Square:', error);
      return [];
    }
  }

  /**
   * Calculate the total duration of an appointment including addons
   * @param baseDuration The base duration of the service in milliseconds
   * @param addonIds Optional array of addon IDs to include in the duration
   * @returns The total duration in minutes
   */
  static async calculateTotalDuration(baseDuration: number, addonIds?: string[]): Promise<number> {
    try {
      // Convert base duration from milliseconds to minutes
      let totalDuration = Math.ceil(baseDuration / 60000);

      // Add durations of any addons
      if (addonIds && addonIds.length > 0) {
        const addons = await this.getAddonsByIds(addonIds);
        for (const addon of addons) {
          if (addon) {
            // Convert addon duration from milliseconds to minutes
            totalDuration += Math.ceil(addon.duration / 60000);
          }
        }
      }

      return totalDuration;
    } catch (error) {
      console.error('Error calculating total duration:', error);
      // Return the base duration if there's an error
      return Math.ceil(baseDuration / 60000);
    }
  }

  /**
   * Check if a time slot is available
   */
  static async checkTimeSlotAvailability(
    staffId: string,
    startTime: string,
    endTime: string,
    serviceId?: string
  ): Promise<boolean> {
    try {
      console.log(`Starting availability check for staff ${staffId} from ${startTime} to ${endTime}`);

      // Check if the requested time is in the past
      const requestedStartTime = new Date(startTime);
      const now = new Date();

      if (requestedStartTime < now) {
        console.log(`Requested time ${startTime} is in the past. Returning unavailable.`);
        return false;
      }

      const locationId = await this.getLocationId();
      console.log(`Using location ID: ${locationId}`);

      // Get a valid service ID to use for availability check
      let validServiceId = serviceId;
      if (!validServiceId) {
        // If no specific service ID is provided, get the first service
        const services = await this.getServices();
        if (!services || services.length === 0) {
          console.error('No services found to check availability');
          return false;
        }
        validServiceId = services[0].id;
      }

      // Get the service to find the variation ID
      const service = await this.getServiceById(validServiceId);
      if (!service) {
        console.error(`Service not found: ${validServiceId}`);
        return false;
      }

      const variationId = service.variationId;
      console.log(`Checking availability for staff ${staffId} with service ${validServiceId} (variation ${variationId}) from ${startTime} to ${endTime}`);

      // Ensure dates are in RFC 3339 format with timezone (Z for UTC)
      // If the dates don't already have a timezone, assume they're in UTC
      const formattedStartTime = startTime.endsWith('Z') ? startTime : `${startTime}Z`;
      const formattedEndTime = endTime.endsWith('Z') ? endTime : `${endTime}Z`;

      console.log(`Formatted times: ${formattedStartTime} to ${formattedEndTime}`);

      // Construct the request body
      const requestBody = {
        query: {
          filter: {
            startAtRange: {
              startAt: formattedStartTime,
              endAt: formattedEndTime
            },
            locationId,
            segmentFilters: [
              {
                serviceVariationId: variationId,
                teamMemberIdFilter: {
                  any: [staffId]
                }
              }
            ]
          }
        }
      };

      console.log('Availability check request:', JSON.stringify(requestBody, null, 2));

      // Make the API call
      const result = await client.bookings.searchAvailability(requestBody);

      console.log('Availability search result:', this.safeStringify(result));

      // If we're checking for a full day (24+ hours), then we just need to know if any slots are available
      const isFullDayCheck = new Date(endTime).getTime() - new Date(startTime).getTime() >= 24 * 60 * 60 * 1000;

      if (isFullDayCheck) {
        const hasAvailability = (result.result?.availabilities?.length || 0) > 0;
        console.log(`Full day availability check result: ${hasAvailability ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
        return hasAvailability;
      }

      // For specific time slot checks, we need to see if there's an availability that matches our exact time slot
      const exactSlotAvailable = result.result?.availabilities?.some(availability => {
        const availStart = new Date(availability.startAt!);

        // Convert times to comparable format (seconds since midnight)
        const timeSeconds = this.timeToSeconds(availStart.toTimeString().substring(0, 8));
        const startSeconds = this.timeToSeconds(startTime);
        const endSeconds = this.timeToSeconds(endTime);

        return timeSeconds >= startSeconds && timeSeconds <= endSeconds;
      });

      console.log(`Exact time slot availability check result: ${exactSlotAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
      return !!exactSlotAvailable;
    } catch (error) {
      console.error('Error checking time slot availability in Square:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }

  /**
   * Get available time slots for a staff member and service
   * @param params The parameters for the request
   * @returns An array of available time slots
   */
  static async getAvailableTimeSlots(params: {
    staffId: string;
    serviceId?: string;
    id?: string;
    variationId?: string;
    date: string;
    addonIds?: string[];
  }): Promise<TimeSlot[]> {
    try {
      // Check if the requested date is in the past
      const requestedDate = new Date(params.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to beginning of today

      if (requestedDate < today) {
        console.log(`Requested date ${params.date} is in the past. Returning empty availability.`);
        return [];
      }

      // Use id parameter if provided, otherwise use serviceId
      const serviceId = params.id || params.serviceId;

      console.log(`Availability request for service: ${serviceId}, variation: ${params.variationId}, staff: ${params.staffId}, date: ${params.date}, addons: ${params.addonIds?.join(', ') || 'none'}`);

      // Get the service details to get the variation ID and duration
      const service = await this.getServiceById(serviceId);
      if (!service) {
        console.error(`Service not found: ${serviceId}`);
        return [];
      }

      console.log(`Service found: ${service.name}, duration: ${service.duration}, variationId: ${service.variationId}`);

      // Use the variation ID that was explicitly passed in the request parameters if available
      // Otherwise fall back to the variation ID from the service
      let bookableVariationId = params.variationId || service.variationId;

      console.log(`Using variation ID: ${bookableVariationId} for availability search`);

      // Check if the service variation is bookable
      try {
        // Get the catalog item variation to verify it's bookable
        const variationResult = await client.catalog.batchGet({
          objectIds: [bookableVariationId],
          includeRelatedObjects: true,
        });

        console.log('Variation details:', this.safeStringify(variationResult));

        // Check if the variation is explicitly marked as bookable
        const isBookable = variationResult.objects && variationResult.objects.length > 0;
        console.log(`Is variation explicitly marked as bookable: ${isBookable}`);

        if (!isBookable) {
          console.error(`Service variation ${bookableVariationId} is not bookable. Please configure this service in the Square Dashboard.`);
          return [];
        }
      } catch (err) {
        console.error('Error checking if service variation is bookable:', err);
        // Continue anyway, as the variation might still be bookable even if we can't check
      }

      // Calculate the total duration including any addons
      let totalDuration = 0;
      try {
        totalDuration = await SquareBookingService.calculateTotalDuration(service.duration, params.addonIds);
        console.log(`Total appointment duration: ${totalDuration} minutes`);
      } catch (err) {
        console.error('Error in calculateTotalDuration:', err);
        // Fallback to just the service duration
        totalDuration = Math.ceil(service.duration / 60000);
        console.log(`Using fallback duration: ${totalDuration} minutes`);
      }

      // Get the location ID
      const locationId = await this.getLocationId();

      // Set the start and end time for the availability search (full day in UTC)
      // Square API requires at least a 24-hour time range for availability searches
      const startDateTime = `${params.date}T00:00:00`;
      const endDate = new Date(params.date);
      endDate.setDate(endDate.getDate() + 1);
      const endDateTime = `${endDate.toISOString().split('T')[0]}T23:59:59`;

      console.log(`Getting available time slots for staff ${params.staffId}, service ${serviceId}, variation ${bookableVariationId} from ${startDateTime} to ${endDateTime}`);

      // Create the availability search request
      const createSearchRequest = (variationId: string) => ({
        query: {
          filter: {
            startAtRange: {
              startAt: `${startDateTime}Z`,
              endAt: `${endDateTime}Z`
            },
            locationId,
            segmentFilters: [
              {
                serviceVariationId: variationId,
                teamMemberIdFilter: {
                  any: [params.staffId]
                }
              }
            ]
          }
        }
      });

      // Try to get availability with the specified variation ID
      let availabilities = [];
      let error = null;

      try {
        const requestBody = createSearchRequest(bookableVariationId);
        console.log(`SearchAvailability request:`, JSON.stringify(requestBody, null, 2));

        const result = await client.bookings.searchAvailability(requestBody);
        console.log('Response from bookingsApi.searchAvailability:', this.safeStringify(result));

        availabilities = result?.availabilities || [];
        console.log(`Retrieved ${availabilities.length} available slots from Square using variation ID ${bookableVariationId}`);
      } catch (err) {
        error = err;
        console.error('Error getting available time slots from Square:', err);
        console.error('Error details:', err.body || err.message);

        // If we get a "Service variation not found" error and we have a service ID,
        // try using the service's default variation ID as a fallback
        if (err.body?.errors &&
          err.body.errors.some(e => e.detail?.includes('Service variation not found')) &&
          service.variationId &&
          bookableVariationId !== service.variationId) {

          console.log(`Trying fallback with service's default variation ID: ${service.variationId}`);

          try {
            const fallbackRequestBody = createSearchRequest(service.variationId);
            const fallbackResult = await client.bookings.searchAvailability(fallbackRequestBody);
            availabilities = fallbackResult?.availabilities || [];
            console.log(`Retrieved ${availabilities.length} available slots using fallback variation ID`);
          } catch (fallbackErr) {
            console.error('Error with fallback variation ID:', fallbackErr);
          }
        }
      }

      console.log(`Retrieved ${availabilities.length} available slots from Square`);

      if (availabilities.length === 0 && error) {
        if (error.body?.errors) {
          const errors = error.body.errors;
          const serviceVariationError = errors.find(e =>
            e.field?.includes('service_variation_id') && e.detail?.includes('not bookable')
          );

          if (serviceVariationError) {
            console.error('Service variation is not configured for booking in Square. Please update the service in the Square Dashboard.');
            console.error('Error details:', serviceVariationError.detail);
            return [];
          }
        }
      }

      // Convert availabilities to time slots
      const timeSlots: TimeSlot[] = [];

      for (const availability of availabilities) {
        if (availability.startAt) {
          const startTime = new Date(availability.startAt);
          const endTime = new Date(startTime.getTime());

          // Add the duration to the start time to get the end time
          if (availability.durationMinutes) {
            endTime.setMinutes(endTime.getMinutes() + availability.durationMinutes);
          } else {
            // If no duration is provided, use the service duration
            endTime.setMinutes(endTime.getMinutes() + totalDuration);
          }

          timeSlots.push({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            available: true
          });
        }
      }

      console.log(`Returning ${timeSlots.length} available time slots`);
      return timeSlots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return [];
    }
  }

  /**
   * Convert a time string to seconds since midnight
   * @param time Time string in format HH:MM:SS
   * @returns Seconds since midnight
   */
  static timeToSeconds(time: string): number {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + (seconds || 0);
  }

  /**
   * Create an appointment
   */
  static async createAppointment(params: CreateAppointmentParams): Promise<Appointment> {
    try {
      const locationId = await this.getLocationId();

      // Get service details
      const service = await this.getServiceById(params.serviceId);
      if (!service) {
        throw new Error('Service not found');
      }

      // Get staff details
      const staff = await this.getStaffById(params.staffId);
      if (!staff) {
        throw new Error('Staff member not found');
      }

      // Create or get customer
      const customerResult = await client.customers.search({
        query: {
          filter: {
            emailAddress: {
              exact: params.clientEmail
            }
          }
        }
      });

      let customerId;

      if (customerResult.customers && customerResult.customers.length > 0) {
        customerId = customerResult.customers[0].id;
      } else {
        const newCustomerResult = await client.customers.create({
          givenName: params.clientName.split(' ')[0],
          familyName: params.clientName.split(' ').slice(1).join(' '),
          emailAddress: params.clientEmail,
          phoneNumber: params.clientPhone
        });

        customerId = newCustomerResult.customer?.id;
      }

      if (!customerId) {
        throw new Error('Failed to create or retrieve customer');
      }

      // Create booking
      const bookingResult = await client.bookings.create({
        booking: {
          locationId,
          startAt: params.startTime,
          appointmentSegments: [
            {
              serviceVariationId: service.variationId,
              teamMemberId: params.staffId,
              durationMinutes: params.totalDuration
            }
          ],
          customerId,
          sellerNote: params.notes || '',
          customerNote: this.safeStringify(params.consentFormResponses || [])
        },
        idempotencyKey: randomUUID()
      });

      if (!bookingResult.booking) {
        throw new Error('Failed to create booking in Square');
      }

      const booking = bookingResult.booking;

      // Process addons if any
      let addons = undefined;
      if (params.addons && params.addons.length > 0) {
        const addonDetails = await this.getAddonsByIds(params.addons);
        addons = addonDetails.map(addon => ({
          id: addon.id,
          name: addon.name,
          duration: addon.duration,
          price: addon.price
        }));
      }

      // Create appointment object in our format
      const appointment: Appointment = {
        id: booking.id!,
        clientName: params.clientName,
        clientEmail: params.clientEmail,
        clientPhone: params.clientPhone,
        serviceId: params.serviceId,
        serviceName: service.name,
        staffId: params.staffId,
        staffName: staff.name,
        startTime: params.startTime,
        endTime: params.endTime,
        status: this.mapFromSquareBookingStatus(booking.status!),
        totalPrice: params.totalPrice,
        totalDuration: params.totalDuration,
        addons: addons as ServiceAddon[] | undefined,
        notes: params.notes,
        consentFormResponses: params.consentFormResponses,
        userId: params.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return appointment;
    } catch (error) {
      console.error('Error creating appointment in Square:', error);
      throw error;
    }
  }

  /**
   * Get appointments for a client
   */
  static async getClientAppointments(clientEmail: string): Promise<Appointment[]> {
    try {
      // Find customer by email
      const customerResult = await client.customers.search({
        query: {
          filter: {
            emailAddress: {
              exact: clientEmail
            }
          }
        }
      });

      if (!customerResult.customers || customerResult.customers.length === 0) {
        return [];
      }

      const customerId = customerResult.customers[0].id;

      // Get bookings for this customer
      const result = await client.bookings.list({
        customerId
      });

      if (!result.bookings) {
        return [];
      }

      // Map Square bookings to our Appointment format
      const appointments: Appointment[] = await Promise.all(
        result.bookings.map(async booking => {
          const segment = booking.appointmentSegments?.[0];
          if (!segment) {
            throw new Error(`Booking ${booking.id} has no appointment segments`);
          }

          // Get service details
          const service = await this.getServiceById(segment.serviceVariationId!);

          // Get staff details
          const staff = await this.getStaffById(segment.teamMemberId!);

          return {
            id: booking.id!,
            clientEmail: customerResult.customers![0].emailAddress!,
            clientName: `${customerResult.customers![0].givenName || ''} ${customerResult.customers![0].familyName || ''}`.trim(),
            clientPhone: customerResult.customers![0].phoneNumber || '',
            serviceId: segment.serviceVariationId!,
            serviceName: service?.name || 'Unknown Service',
            staffId: segment.teamMemberId!,
            staffName: staff?.name || 'Unknown Staff',
            startTime: booking.startAt!,
            endTime: booking.endAt!,
            status: this.mapFromSquareBookingStatus(booking.status!),
            totalPrice: service?.price || 0,
            totalDuration: segment.durationMinutes ? parseInt(segment.durationMinutes) : 0,
            notes: booking.sellerNote,
            consentFormResponses: booking.customerNote ? JSON.parse(booking.customerNote) : [],
            createdAt: new Date(booking.createdAt!).toISOString(),
            updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : undefined
          };
        })
      );

      return appointments;
    } catch (error) {
      console.error('Error fetching client appointments from Square:', error);
      return [];
    }
  }

  /**
   * Get appointments for a staff member
   */
  static async getStaffAppointments(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    try {
      const locationId = await this.getLocationId();

      // Get bookings for this staff member in the date range
      const result = await client.bookings.list({
        startAt: {
          startAt: startDate,
          endAt: endDate
        },
        locationId,
        teamMemberId: staffId
      });

      if (!result.bookings) {
        return [];
      }

      // Map Square bookings to our Appointment format
      const appointments: Appointment[] = await Promise.all(
        result.bookings.map(async booking => {
          const segment = booking.appointmentSegments?.[0];
          if (!segment) {
            throw new Error(`Booking ${booking.id} has no appointment segments`);
          }

          // Get service details
          const service = await this.getServiceById(segment.serviceVariationId!);

          // Get customer details
          const customerResult = await client.customers.retrieve(booking.customerId!);
          const customer = customerResult.customer;

          return {
            id: booking.id!,
            clientEmail: customer?.emailAddress || '',
            clientName: `${customer?.givenName || ''} ${customer?.familyName || ''}`.trim(),
            clientPhone: customer?.phoneNumber || '',
            serviceId: segment.serviceVariationId!,
            serviceName: service?.name || 'Unknown Service',
            staffId: segment.teamMemberId!,
            staffName: (await this.getStaffById(segment.teamMemberId!))?.name || 'Unknown Staff',
            startTime: booking.startAt!,
            endTime: booking.endAt!,
            status: this.mapFromSquareBookingStatus(booking.status!),
            totalPrice: service?.price || 0,
            totalDuration: segment.durationMinutes ? parseInt(segment.durationMinutes) : 0,
            notes: booking.sellerNote,
            consentFormResponses: booking.customerNote ? JSON.parse(booking.customerNote) : [],
            createdAt: new Date(booking.createdAt!).toISOString(),
            updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : undefined
          };
        })
      );

      return appointments;
    } catch (error) {
      console.error('Error fetching staff appointments from Square:', error);
      return [];
    }
  }

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(appointmentId: string, status: string): Promise<Appointment> {
    try {
      // Map our status to Square's status
      const squareStatus = this.mapToSquareBookingStatus(status);

      // Update booking status
      const result = await client.bookings.update(appointmentId, {
        booking: {
          status: squareStatus
        },
        idempotencyKey: randomUUID()
      });

      if (!result.booking) {
        throw new Error('Failed to update booking status in Square');
      }

      const booking = result.booking;

      // Get the updated booking details
      const segment = booking.appointmentSegments?.[0];

      if (!segment) {
        throw new Error(`Booking ${booking.id} has no appointment segments`);
      }

      // Get service details
      const service = await this.getServiceById(segment.serviceVariationId!);

      // Get customer details
      const customerResult = await client.customers.retrieve(booking.customerId!);
      const customer = customerResult.customer;

      // Get staff details
      const staff = await this.getStaffById(segment.teamMemberId!);

      // Return the updated appointment
      return {
        id: booking.id!,
        clientEmail: customer?.emailAddress || '',
        clientName: `${customer?.givenName || ''} ${customer?.familyName || ''}`.trim(),
        clientPhone: customer?.phoneNumber || '',
        serviceId: segment.serviceVariationId!,
        serviceName: service?.name || 'Unknown Service',
        staffId: segment.teamMemberId!,
        staffName: staff?.name || 'Unknown Staff',
        startTime: booking.startAt!,
        endTime: booking.endAt!,
        status: this.mapFromSquareBookingStatus(booking.status!),
        totalPrice: service?.price || 0,
        totalDuration: segment.durationMinutes ? parseInt(segment.durationMinutes) : 0,
        notes: booking.sellerNote,
        consentFormResponses: booking.customerNote ? JSON.parse(booking.customerNote) : [],
        createdAt: new Date(booking.createdAt!).toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating appointment status in Square:', error);
      throw error;
    }
  }
}
