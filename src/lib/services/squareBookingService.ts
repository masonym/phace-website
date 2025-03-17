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

/**
 * Service for interacting with Square's Booking API
 */
export class SquareBookingService {
  /**
   * Helper function to safely convert BigInt values to numbers
   * @param value The value to convert
   */
  private static safeNumber(value: any): number {
    if (typeof value === 'bigint') {
      return Number(value);
    }
    if (typeof value === 'number') {
      return value;
    }
    return 0;
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
            description: category.description || '',
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
      const cacheValid = cacheEntry && (now - cacheEntry.timestamp < 5 * 60 * 1000); // 5 minutes

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
      console.log('Raw result:', JSON.stringify(result));

      if (!result.items) {
        console.log(`No items found for category ${categoryId}, returning empty array`);
        this.servicesByCategory[categoryId] = { services: [], timestamp: now };
        return [];
      }

      // Map Square catalog items to our Service format
      const services = result.items.map(item => {
        try {
          console.log('Processing item:', JSON.stringify(item, (key, value) => 
            typeof value === 'bigint' ? Number(value) : value
          ));
          
          // Find the first variation that has appointment data
          const variations = item.itemData?.variations || [];
          console.log('Variations:', JSON.stringify(variations, (key, value) => 
            typeof value === 'bigint' ? Number(value) : value
          ));
          
          const variation = variations.find(v => 
            v.itemVariationData?.serviceDuration !== undefined
          ) || variations[0];
          
          console.log('Selected variation:', JSON.stringify(variation, (key, value) => 
            typeof value === 'bigint' ? Number(value) : value
          ));

          const price = variation?.itemVariationData?.priceMoney?.amount || 0;
          const duration = variation?.itemVariationData?.serviceDuration || 0;

          const service = {
            id: item.id!,
            categoryId,
            name: item.itemData?.name || 'Unnamed Service',
            description: item.itemData?.description,
            price: this.safeNumber(price),
            duration: this.safeNumber(duration),
            imageUrl: item.itemData?.imageUrl,
            isActive: true,
            updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined
          };
          
          console.log(`Mapped service: ${JSON.stringify(service)}`);
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
            updatedAt: undefined
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

  /**
   * Get a service by ID
   */
  static async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      // First check if the service is in our cache
      for (const categoryId in this.servicesByCategory) {
        const cacheEntry = this.servicesByCategory[categoryId];
        const cachedService = cacheEntry.services.find(service => service.id === serviceId);
        if (cachedService) {
          return cachedService;
        }
      }

      // If not in cache, fetch from Square API
      const result = await client.catalog.retrieveCatalogObject(serviceId);

      if (!result.object || result.object.type !== 'ITEM') {
        return null;
      }

      const item = result.object;

      // Find the first variation that has appointment data
      const variation = item.itemData?.variations?.find(v =>
        v.itemVariationData?.serviceDuration !== undefined
      );

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
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined
      };

      // If this service has a category ID and we have a cache for it, add to cache
      if (categoryId && this.servicesByCategory[categoryId]) {
        // Check if service already exists in cache
        const existingIndex = this.servicesByCategory[categoryId].services.findIndex(s => s.id === serviceId);
        if (existingIndex >= 0) {
          // Update existing service
          this.servicesByCategory[categoryId].services[existingIndex] = service;
        } else {
          // Add new service
          this.servicesByCategory[categoryId].services.push(service);
        }
      }

      return service;
    } catch (error) {
      console.error('Error fetching service by ID from Square:', error);
      return null;
    }
  }

  /**
   * Get staff members
   */
  static async getStaffMembers(): Promise<StaffMember[]> {
    try {
      const locationId = await this.getLocationId();

      // Get team members who can be booked
      const result = await client.bookings.listTeamMemberBookingProfiles(locationId);

      if (!result.teamMemberBookingProfiles) {
        return [];
      }

      // Get detailed team member info
      const teamMemberIds = result.teamMemberBookingProfiles.map(profile => profile.teamMemberId!);
      const teamMembersResult = await client.teamMembers.bulkRetrieve({
        teamMemberIds
      });

      if (!teamMembersResult.teamMembers) {
        return [];
      }

      // Map Square team members to our StaffMember format
      return result.teamMemberBookingProfiles.map(profile => {
        const teamMember = teamMembersResult.teamMembers?.find(
          tm => tm.id === profile.teamMemberId
        );

        // Parse availability from the booking profile
        const defaultAvailability = profile.bookableAppointmentSegments?.map(segment => ({
          dayOfWeek: this.convertDayOfWeekToNumber(segment.weekDayAvailable!),
          startTime: segment.startAt!,
          endTime: segment.endAt!
        })) || [];

        return {
          id: profile.teamMemberId!,
          name: `${teamMember?.givenName || ''} ${teamMember?.familyName || ''}`.trim(),
          email: teamMember?.emailAddress,
          phone: teamMember?.phoneNumber,
          bio: profile.description,
          imageUrl: teamMember?.profileImageUrl,
          defaultAvailability,
          isActive: teamMember?.status === 'ACTIVE',
          createdAt: new Date(teamMember?.createdAt || Date.now()).toISOString(),
          updatedAt: teamMember?.updatedAt
            ? new Date(teamMember.updatedAt).toISOString()
            : undefined
        };
      });
    } catch (error) {
      console.error('Error fetching staff members from Square:', error);
      return [];
    }
  }

  /**
   * Get a staff member by ID
   */
  static async getStaffById(staffId: string): Promise<StaffMember | null> {
    try {
      // Get team member booking profile
      const result = await client.bookings.retrieveTeamMemberBookingProfile(staffId);

      if (!result.teamMemberBookingProfile) {
        return null;
      }

      const profile = result.teamMemberBookingProfile;

      // Get detailed team member info
      const teamMemberResult = await client.teamMembers.retrieve(staffId);

      if (!teamMemberResult.teamMember) {
        return null;
      }

      const teamMember = teamMemberResult.teamMember;

      // Parse availability from the booking profile
      const defaultAvailability = profile.bookableAppointmentSegments?.map(segment => ({
        dayOfWeek: this.convertDayOfWeekToNumber(segment.weekDayAvailable!),
        startTime: segment.startAt!,
        endTime: segment.endAt!
      })) || [];

      return {
        id: profile.teamMemberId!,
        name: `${teamMember.givenName || ''} ${teamMember.familyName || ''}`.trim(),
        email: teamMember.emailAddress,
        phone: teamMember.phoneNumber,
        bio: profile.description,
        imageUrl: teamMember.profileImageUrl,
        defaultAvailability,
        isActive: teamMember.status === 'ACTIVE',
        createdAt: new Date(teamMember.createdAt || Date.now()).toISOString(),
        updatedAt: teamMember.updatedAt
          ? new Date(teamMember.updatedAt).toISOString()
          : undefined
      };
    } catch (error) {
      console.error('Error fetching staff member by ID from Square:', error);
      return null;
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
      const result = await client.catalog.batchRetrieveCatalogObjects({
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
   * Check if a time slot is available
   */
  static async checkTimeSlotAvailability(
    staffId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const locationId = await this.getLocationId();

      // Search for availability
      const result = await client.bookings.searchAvailability({
        query: {
          filter: {
            startAtRange: {
              startAt: startTime,
              endAt: endTime
            },
            locationId,
            segmentFilters: [
              {
                serviceVariationId: "ANY_SERVICE",
                teamMemberIdFilter: {
                  any: [staffId]
                }
              }
            ]
          }
        }
      });

      // If there are available time slots that match our criteria, the slot is available
      return (result.availabilities?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking time slot availability in Square:', error);
      return false;
    }
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
              serviceVariationId: params.serviceId,
              teamMemberId: params.staffId,
              durationMinutes: params.totalDuration.toString()
            }
          ],
          customerId,
          sellerNote: params.notes || '',
          customerNote: JSON.stringify(params.consentFormResponses || [])
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

      // Get the updated booking details
      const booking = result.booking;
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
