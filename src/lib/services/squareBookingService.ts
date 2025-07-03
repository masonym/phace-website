import { SquareClient, SquareEnvironment } from "square";
import { Square } from "square";
import { randomUUID } from 'crypto';
import { nanoid } from 'nanoid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand,
    ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { startOfDay, addMonths } from "date-fns";

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const dynamoDb = DynamoDBDocumentClient.from(ddbClient);

const SERVICES_TABLE = 'phace-services';
const APPOINTMENTS_TABLE = 'phace-appointments';
const STAFF_TABLE = 'phace-staff';
const CLIENTS_TABLE = 'phace-clients';
const WAITLIST_TABLE = 'phace-waitlist';
const FORMS_TABLE = 'phace-forms';

// Initialize Square client

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
        process.env.SQUARE_ENVIRONMENT === "production"
            ? SquareEnvironment.Production
            : SquareEnvironment.Sandbox,
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
    version: number;
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
    variationId: string;
    version: number;
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
    orderId?: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceId: string;
    serviceName: string;
    variationVersion: number;
    staffId: string;
    staffName: string;
    startTime: string;
    //endTime: string;
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

interface AppointmentConfirmation {
    id: string;
    orderId?: string;
    serviceIds: string[];
    serviceNames: string[];
    staffId: string;
    staffName: string;
    startTime: string;
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
    serviceName: string;
    variationVersion: string;
    variationId: string;
    staffId: string;
    staffName?: string;
    startTime: string;
    //endTime: string;
    totalPrice: number;
    totalDuration: number;
    addons?: string[];
    notes?: string;
    consentFormResponses?: any[];
    userId?: string;
    paymentNonce?: string;
}

interface CreateAppointmentResult {
    orderId: string;
    bookingId: string;
    appointment: Appointment;
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
        return JSON.stringify(obj, (_, value) => {
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

            // Get catalog items that are categories
            const result = await client.catalog.search({
                objectTypes: ['CATEGORY']
            });

            //console.log("Result: ", result)

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
                .filter(obj => obj.type === 'CATEGORY' && obj.categoryData?.isTopLevel)
                .map(obj => {
                    const category = (obj as Square.CatalogObjectCategory).categoryData!;

                    // Look for an image in related objects that might be associated with this category
                    let imageUrl: string | undefined = undefined;
                    //if (detailedResult.relatedObjects) {
                    //    const relatedImage = detailedResult.relatedObjects.find(
                    //        related => related.type === 'IMAGE' &&
                    //            related.imageData?.url &&
                    //            obj.categoryData?.imageIds?.includes(related.id!)
                    //    );
                    //    //if (relatedImage?.imageId?.url) {
                    //    //  imageUrl = relatedImage.imageData.url;
                    //    //}
                    //}
                    console.log(category)

                    return {
                        id: obj.id!,
                        name: category.name || 'Unnamed Category',
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

            // fetching location id 

            const res = await client.locations.list();

            console.log("res: ", res)
            // Check if we have a cached version that's less than 5 minutes old
            const now = Date.now();
            const cacheEntry = this.servicesByCategory[categoryId];
            const cacheValid = cacheEntry && (now - cacheEntry.timestamp < this.SERVICES_CACHE_EXPIRATION); // 5 minutes

            if (!forceRefresh && cacheValid) {
                console.log(`Returning ${cacheEntry.services.length} services from cache for category ${categoryId}`);
                return cacheEntry.services;
            }

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
            const services = result.items!.flatMap(item => {
                try {
                    console.log('Processing item:', this.safeStringify(item));
                    if (item.type !== 'ITEM') {
                        console.log(`Item ${item.id} is not an ITEM, skipping`);
                        return [];
                    }
                    // Find the first variation that has appointment data
                    const variations = item.itemData!.variations;
                    const validVariations = variations!.filter(v => v.type === 'ITEM_VARIATION');
                    console.log('Variations:', this.safeStringify(variations));
                    const variation = validVariations!.find(v => {
                        return v.type === 'ITEM_VARIATION' &&
                            v.itemVariationData?.serviceDuration !== undefined;
                    });

                    console.log('Selected variation:', this.safeStringify(variation));

                    const price = variation?.itemVariationData?.priceMoney?.amount || 0;
                    const duration = variation?.itemVariationData?.serviceDuration || 0;
                    const categoryId = item.itemData?.categoryId || '';

                    const service = {
                        id: item.id!,
                        categoryId,
                        name: item.itemData?.name || 'Unnamed Service',
                        description: item.itemData?.description || '',
                        price: this.safeNumber(price),
                        duration: this.safeNumber(duration),
                        //imageUrl: item.itemData?.imageUrl,
                        isActive: true,
                        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
                        variationId: variation?.id || '',
                        variations: validVariations.map(v => ({
                            id: v.id,
                            version: this.safeNumber(v.version!),
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

            // First try to get the object to determine if it's an ITEM or ITEM_VARIATION
            const result = await client.catalog.object.get({
                objectId: serviceId
            });

            //console.log(`Square API response for ID ${serviceId}: ${this.safeStringify(result)}`);

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
                const variations = item.itemData!.variations;
                const validVariations = variations!.filter(v => v.type === 'ITEM_VARIATION');
                const variation = validVariations!.find(v => {
                    return v.type === 'ITEM_VARIATION' &&
                        v.itemVariationData?.serviceDuration !== undefined;
                });

                const price = variation?.itemVariationData?.priceMoney?.amount || 0;
                const duration = variation?.itemVariationData?.serviceDuration || 0;
                const categoryId = item.itemData?.categoryId || '';

                service = {
                    id: item.id!,
                    categoryId,
                    name: item.itemData?.name || 'Unnamed Service',
                    description: item.itemData?.description || '',
                    price: this.safeNumber(price),
                    duration: this.safeNumber(duration),
                    //imageUrl: item.itemData?.imageIds || '',
                    isActive: true,
                    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
                    variationId: variation?.id || '',
                    variations: validVariations.map(v => ({
                        id: v.id,
                        version: this.safeNumber(v.version!),
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

                const variations = item.itemData!.variations;
                const validVariations = variations!.filter(v => v.type === 'ITEM_VARIATION');
                console.log('Variations:', this.safeStringify(variations));

                service = {
                    id: item.id!,
                    categoryId,
                    name: item.itemData?.name || 'Unnamed Service',
                    description: item.itemData?.description || '',
                    price: this.safeNumber(price),
                    duration: this.safeNumber(duration),
                    //imageUrl: item.itemData?.imageIds, TODO: fix
                    isActive: true,
                    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
                    variationId: variation.id!,
                    variations: validVariations.map(v => ({
                        id: v.id,
                        version: this.safeNumber(v.version!),
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
    static async getStaffMembers(variationId: string): Promise<StaffMember[]> {
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

            const today = startOfDay(new Date());
            const endQuery = addMonths(today, 1);

            const availabilityResponse = await client.bookings.searchAvailability({
                query: {
                    filter: {
                        segmentFilters: [
                            {
                                serviceVariationId: variationId,
                            },
                        ],
                        startAtRange: {
                            startAt: today.toISOString(),
                            endAt: endQuery.toISOString(),
                        },
                        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
                    },
                },
            });

            // Create a map to count available slots per staff member
            // This helps us determine if a staff member has actual availability for this service
            const staffAvailabilityCount = new Map<string, number>();
            availabilityResponse.availabilities?.forEach(slot => {
                slot.appointmentSegments?.forEach(seg => {
                    const staffId = seg.teamMemberId;
                    staffAvailabilityCount.set(staffId, (staffAvailabilityCount.get(staffId) || 0) + 1);
                });
            });

            console.log(`Found availability for ${staffAvailabilityCount.size} staff members`);
            
            // Only include staff with at least one available slot
            const availableStaffIds = Array.from(staffAvailabilityCount.keys());
            if (availableStaffIds.length === 0) {
                console.log('No staff members have availability for this service');
                return [];
            }

            // Get team members who can be booked
            const bookingProfilesResponse = await client.bookings.bulkRetrieveTeamMemberBookingProfiles({ teamMemberIds: availableStaffIds });

            const bookingProfilesObj = bookingProfilesResponse.teamMemberBookingProfiles!;
            const bookingProfiles = Object.entries(bookingProfilesObj)
                .map(([id, entry]) => entry.teamMemberBookingProfile)
                .filter(Boolean);

            if (bookingProfiles.length === 0) {
                console.log('No team member IDs found in booking profiles');
                return [];
            }
            
            // Get detailed team member info for all team members
            const teamMemberIds = bookingProfiles.map(profile => profile!.teamMemberId!);

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
            // Only include staff members who are bookable, active, and have at least one available slot
            const staffMembers = bookingProfiles
                .filter(profile => {
                    const staffId = profile!.teamMemberId!;
                    // Check if this staff member has any available slots for this service
                    // Use nullish coalescing to handle undefined result from Map.get()
                    const availabilityCount = staffAvailabilityCount.get(staffId) ?? 0;
                    const hasAvailability = availabilityCount > 0;
                    return hasAvailability && profile!.isBookable;
                })
                .map(profile => {
                    const teamMember = teamMembersResult.teamMembers?.find(
                        tm => tm.id === profile!.teamMemberId
                    );

                    if (!teamMember) {
                        console.log(`No team member found for profile ${profile!.teamMemberId}`);
                        return null;
                    }

                    return {
                        id: profile!.teamMemberId!,
                        name: profile!.displayName || `${teamMember.givenName || ''} ${teamMember.familyName || ''}`.trim(),
                        email: teamMember.emailAddress || undefined,
                        phone: teamMember.phoneNumber || undefined,
                        bio: profile!.description || undefined,
                        isActive: profile!.isBookable && teamMember.status === 'ACTIVE',
                        createdAt: new Date(teamMember.createdAt || Date.now()).toISOString(),
                        updatedAt: teamMember.updatedAt
                            ? new Date(teamMember.updatedAt).toISOString()
                            : undefined
                    };
                }).filter(Boolean) as StaffMember[];
                
                console.log(`Returning ${staffMembers.length} bookable staff members with availability`);

            // Update the cache
            this.staffCache = {
                data: staffMembers,
                timestamp: Date.now()
            };

            return staffMembers;
        } catch (error: unknown) {
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
                email: teamMember.emailAddress!,
                phone: teamMember.phoneNumber!,
                bio: profile.description,
                //imageUrl: teamMember.profileImageUrl || '',
                defaultAvailability,
                isActive: profile.isBookable! && teamMember.status === 'ACTIVE',
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

    /**
     * Get all service add-ons, typically fetched from a specific category.
     */
    static async getAllAddons(): Promise<ServiceAddon[]> {
        try {
            const addonCategoryId = process.env.SQUARE_ADDON_CATEGORY_ID;

            if (!addonCategoryId) {
                console.warn('SQUARE_ADDON_CATEGORY_ID environment variable not set. Cannot reliably fetch addons by category. Returning empty array.');
                return [];
            }

            console.log(`Fetching add-on items from category ID: ${addonCategoryId}`);

            const result = await client.catalog.search({
                query: {
                    exactQuery: {
                        attributeName: 'category_id',
                        attributeValue: addonCategoryId
                    }
                },
                objectTypes: ['ITEM']
            });

            // console.log("Raw Add-on search result: ", this.safeStringify(result));

            if (!result?.objects || result.objects.length === 0) {
                console.log(`No items found in the add-on category (${addonCategoryId}).`);
                return [];
            }

            // Map results, potentially creating nulls for invalid items
            const mappedItems: (ServiceAddon | null)[] = result.objects.map(item => {
                // Assert itemData exists as we filtered by objectTypes: ['ITEM']
                // Using 'as any' for simplicity, ensure 'item' is indeed a CatalogObject of type ITEM
                const itemData = (item as any).itemData;

                if (!itemData) {
                    console.warn(`CatalogObject ${item.id} unexpectedly missing itemData, skipping.`);
                    return null;
                }

                const variation = itemData.variations?.[0];

                if (!variation || variation.type !== 'ITEM_VARIATION' || !variation.itemVariationData) {
                    console.warn(`Item ${item.id} (${itemData.name || 'Unnamed'}) has no valid first variation. Skipping.`);
                    return null;
                }

                const variationData = variation.itemVariationData;
                const price = variationData.priceMoney?.amount || 0;
                let durationMs = variationData.serviceDuration || 0;

                if (durationMs === 0) {
                    const customAttributes = variationData.customAttributeValues || {};
                    // *** FIX 1: Type 'attr' explicitly ***
                    // Define a minimal type for the custom attribute value
                    type CustomAttributeValue = {
                        name?: string;
                        numberValue?: string | number | bigint; // Square SDK might use string, number, or bigint
                        stringValue?: string;
                        // Add other potential properties if needed
                    };

                    const durationAttribute = Object.values(customAttributes).find(
                        // Cast attr to the defined type
                        (attr): attr is CustomAttributeValue & { name: string } =>
                            typeof attr === 'object' && attr !== null &&
                            typeof (attr as CustomAttributeValue).name === 'string' &&
                            (attr as CustomAttributeValue).name!.toLowerCase() === 'duration'
                    );

                    // *** FIX 2: Check attribute and numberValue safely ***
                    if (durationAttribute?.numberValue) {
                        // Convert safely, handling string, number, or bigint
                        const numValue = typeof durationAttribute.numberValue === 'string'
                            ? parseFloat(durationAttribute.numberValue)
                            : Number(durationAttribute.numberValue); // Handles number/bigint

                        if (!isNaN(numValue)) {
                            // Assuming the value represents milliseconds
                            durationMs = numValue / 60000;
                        }
                    }
                    // Optional: Add check for stringValue if needed
                    // else if (durationAttribute?.stringValue) { /* parse string value */ }
                }

                // *** FIX 3: Ensure mapped object matches ServiceAddon ***
                const addonObject: ServiceAddon = {
                    id: item.id!,
                    name: itemData.name || 'Unnamed Addon',
                    description: itemData.description ?? undefined,
                    variationId: variation.id,
                    version: this.safeNumber(variation.version),
                    price: this.safeNumber(price),
                    duration: this.safeNumber(durationMs),
                    isActive: !itemData.isArchived
                };
                return addonObject;

            }); // End of .map()

            // *** FIX 4: Type predicate and filtering ***
            // The filter function itself is correct. The issue was the objects inside mappedItems.
            const addons: ServiceAddon[] = mappedItems.filter(
                (addon): addon is ServiceAddon => addon !== null
            );
            // If the above still gives errors, try letting TS infer the type first:
            // const filteredAddons = mappedItems.filter((addon): addon is ServiceAddon => addon !== null);
            // const addons: ServiceAddon[] = filteredAddons; // Then assign

            console.log(`Successfully mapped ${addons.length} add-ons.`);
            return addons;

        } catch (error) {
            console.error('Error fetching addons from Square:', error);
            if (error instanceof Error && 'body' in error) {
                console.error('Square API Error Body:', this.safeStringify((error as any).body));
            } else {
                console.error('Error details:', error);
            }
            return [];
        }
    }


    /**
     * Get addons by IDs
     */
    static async getAddonsByIds(addonIds: string[]): Promise<ServiceAddon[]> {
        try {
            if (!addonIds || addonIds.length === 0) {
                return [];
            }

            console.log(`Fetching addon details for IDs: ${addonIds.join(', ')}`);

            // Get catalog objects by IDs
            const result = await client.catalog.batchGet({
                objectIds: addonIds
            });

            // console.log("Raw batchGet result for addons: ", this.safeStringify(result));

            if (!result.objects || result.objects.length === 0) {
                console.log(`No objects found for addon IDs: ${addonIds.join(', ')}`);
                return [];
            }

            // --- Define CustomAttributeValue type helper here or globally ---
            type CustomAttributeValue = {
                name?: string;
                numberValue?: string | number | bigint;
                stringValue?: string;
            };
            // --- End type helper ---


            // Map Square catalog items to our ServiceAddon format
            const mappedAddons: (ServiceAddon | null)[] = result.objects
                // Ensure we only process objects that are of type ITEM
                .filter(obj => obj.type === 'ITEM')
                .map(obj => {
                    // Assert itemData exists as we filtered by type: 'ITEM'
                    const itemData = (obj as any).itemData;

                    if (!itemData) {
                        console.warn(`CatalogObject ${obj.id} is ITEM type but missing itemData, skipping.`);
                        return null;
                    }

                    // Assume the first variation is the relevant one for the addon
                    const variation = itemData.variations?.[0];

                    if (!variation || variation.type !== 'ITEM_VARIATION' || !variation.itemVariationData) {
                        console.warn(`Addon Item ${obj.id} (${itemData.name || 'Unnamed'}) has no valid first variation. Skipping.`);
                        return null;
                    }

                    const variationData = variation.itemVariationData;

                    // Extract price
                    const price = variationData.priceMoney?.amount || 0;

                    // --- Corrected Duration Logic ---
                    let durationMs: number | bigint = variationData.serviceDuration || 0; // Default to 0 if null/undefined

                    // If serviceDuration is not present or zero, check custom attributes
                    if (!durationMs || durationMs === 0) {
                        const customAttributes = variationData.customAttributeValues || {};

                        const durationAttribute = Object.values(customAttributes).find(
                            // Use type guard for safer access
                            (attr): attr is CustomAttributeValue & { name: string } =>
                                typeof attr === 'object' && attr !== null &&
                                typeof (attr as CustomAttributeValue).name === 'string' &&
                                (attr as CustomAttributeValue).name!.toLowerCase() === 'duration'
                        );

                        if (durationAttribute?.numberValue) {
                            // Convert safely (string/number/bigint) -> number (assuming minutes)
                            const numValue = typeof durationAttribute.numberValue === 'string'
                                ? parseFloat(durationAttribute.numberValue)
                                : Number(durationAttribute.numberValue); // Handles number/bigint

                            if (!isNaN(numValue)) {
                                durationMs = numValue / 60000;
                                console.log(`Addon ${obj.id}: Used custom attribute 'duration' (${numValue} min -> ${durationMs} ms)`);
                            } else {
                                console.warn(`Addon ${obj.id}: Custom attribute 'duration' has non-numeric value '${durationAttribute.numberValue}'. Using 0 duration.`);
                                durationMs = 0;
                            }
                        } else {
                            // console.log(`Addon ${obj.id}: No serviceDuration or valid custom 'duration' attribute found. Using 0 duration.`);
                            durationMs = 0; // Ensure it's explicitly 0 if nothing found
                        }
                        // Optional: Add check for stringValue if needed
                        // else if (durationAttribute?.stringValue) { /* parse string value */ }
                    }
                    // --- End Duration Logic ---

                    // Create the ServiceAddon object, ensuring structure matches interface
                    const addonObject: ServiceAddon = {
                        id: obj.id!,
                        name: itemData.name || 'Unnamed Addon',
                        variationId: variation.id || '', // Ensure variation ID is string
                        version: this.safeNumber(variation.version), // Ensure version is number
                        description: itemData.description ?? undefined, // Handle optional description
                        price: this.safeNumber(price),
                        duration: this.safeNumber(durationMs), // Ensure duration is number
                        isActive: !itemData.isArchived // Or use variation.presentAtAllLocations etc.
                    };
                    return addonObject;
                }); // End of .map()

            // Filter out any nulls that resulted from mapping errors
            const addons: ServiceAddon[] = mappedAddons.filter(
                (addon): addon is ServiceAddon => addon !== null
            );

            console.log(`Successfully mapped ${addons.length} addons out of ${addonIds.length} requested IDs.`);
            return addons;

        } catch (error) {
            console.error('Error fetching addons by IDs from Square:', error);
            if (error instanceof Error && 'body' in error) {
                console.error('Square API Error Body:', this.safeStringify((error as any).body));
            } else {
                console.error('Error details:', error);
            }
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
            const variationVersion = service.variations?.find(v => v.id === variationId)?.version || 0;
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
                                serviceVariationVersion: variationVersion,
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
                const hasAvailability = (result.availabilities?.length || 0) > 0;
                console.log(`Full day availability check result: ${hasAvailability ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
                return hasAvailability;
            }

            // For specific time slot checks, we need to see if there's an availability that matches our exact time slot
            const exactSlotAvailable = result.availabilities?.some(availability => {
                const availStart = new Date(availability.startAt!);

                // Check if the availability start time matches exactly
                return availStart.toISOString() === startTime;

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
            const service = await this.getServiceById(serviceId!);
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
            //try {
            //    // Get the catalog item variation to verify it's bookable
            //    const variationResult = await client.catalog.batchGet({
            //        objectIds: [bookableVariationId],
            //        includeRelatedObjects: true,
            //    });
            //
            //    console.log('Variation details:', this.safeStringify(variationResult));
            //
            //    // Check if the variation is explicitly marked as bookable
            //    const isBookable = variationResult.objects && variationResult.objects.length > 0;
            //    console.log(`Is variation explicitly marked as bookable: ${isBookable}`);
            //
            //    if (!isBookable) {
            //        console.error(`Service variation ${bookableVariationId} is not bookable. Please configure this service in the Square Dashboard.`);
            //        return [];
            //    }
            //} catch (err) {
            //    console.error('Error checking if service variation is bookable:', err);
            //    // Continue anyway, as the variation might still be bookable even if we can't check
            //}

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
            let availabilities: any = [];
            let error = null;

            try {
                const requestBody = createSearchRequest(bookableVariationId);
                console.log(`SearchAvailability request:`, JSON.stringify(requestBody, null, 2));

                const result = await client.bookings.searchAvailability(requestBody);
                console.log('Response from bookingsApi.searchAvailability:', this.safeStringify(result));

                availabilities = result?.availabilities! || [];
                console.log(`Retrieved ${availabilities.length} available slots from Square using variation ID ${bookableVariationId}`);
            } catch (err) {
                error = err;
                console.error('Error getting available time slots from Square:', err);
                console.error('Error details:', err.body || err.message);

                // If we get a "Service variation not found" error and we have a service ID,
                // try using the service's default variation ID as a fallback
                if (err.body?.errors &&
                    err.body.errors.some((e: { detail: string | string[]; }) => e.detail?.includes('Service variation not found')) &&
                    service.variationId &&
                    bookableVariationId !== service.variationId) {

                    console.log(`Trying fallback with service's default variation ID: ${service.variationId}`);

                    try {
                        const fallbackRequestBody = createSearchRequest(service.variationId);
                        const fallbackResult = await client.bookings.searchAvailability(fallbackRequestBody);
                        availabilities = fallbackResult?.availabilities! || [];
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
                    const serviceVariationError = errors.find((e: { field: string | string[]; detail: string | string[]; }) =>
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


    static async getAvailableTimeSlotsInRange(params: {
        staffId: string;
        serviceId?: string;
        id?: string;
        variationId?: string;
        startDate: string; // yyyy-MM-dd
        endDate: string;   // yyyy-MM-dd
        addonIds?: string[];
    }): Promise<TimeSlot[]> {
        const { staffId, serviceId, id, variationId, startDate, endDate, addonIds } = params;
        
        const vid = variationId || id || serviceId;
        if (!vid) {
            console.error('No service variation ID provided for availability search');
            return [];
        }

        // Log more detailed info to help with debugging
        console.log(`Getting availability for staff ${staffId} and service variation ${vid} from ${startDate} to ${endDate}`);

        // First check if this staff member can perform this service variation
        try {
            // Get the team member's booking profile to check assigned service variations
            const profileResponse = await client.bookings.teamMemberProfiles.get({ teamMemberId: staffId });
            
            if (!profileResponse.teamMemberBookingProfile) {
                console.error(`No booking profile found for staff member ${staffId}`);
                return [];
            }
            
            // Check if the service variation is in the staff member's assigned services
            const profile = profileResponse.teamMemberBookingProfile;
            // Add type assertion since the Square types might be incomplete
            type BookableService = {
                serviceVariationId?: string;
                teamMemberBookableServices?: Array<{
                    serviceVariationId?: string;
                }>;
            };
            
            // Use type assertion to work with potentially missing properties
            const extendedProfile = profile as unknown as {
                bookableServices?: BookableService[];
            };
            
            const canPerformService = extendedProfile.bookableServices?.some((service: BookableService) => 
                service.serviceVariationId === vid || 
                service.teamMemberBookableServices?.some((s: { serviceVariationId?: string }) => s.serviceVariationId === vid)
            );
            
            if (!canPerformService) {
                console.warn(`Staff member ${staffId} cannot perform service variation ${vid}. ` +
                           `Make sure they are assigned to this service variation in Square Dashboard.`);
                return [];
            }
            
            console.log(`Verified staff member ${staffId} can perform service variation ${vid}`);
        } catch (error) {
            console.error(`Error checking if staff member ${staffId} can perform service variation ${vid}:`, error);
            // Continue with the availability search even if this check fails, Square API will validate anyway
        }

        const sid = id || serviceId;
        if (!sid) throw new Error("No service ID provided");

        const service = await this.getServiceById(sid);
        if (!service) return [];

        // Already defined vid above, don't redefine it
        // const vid = variationId || service.variationId; 
        const duration = await SquareBookingService.calculateTotalDuration(service.duration, addonIds);

        const locationId = await this.getLocationId();

        // NOTE: We assume no bookable appointments occur between 11pm–1am PT.
        // This lets us safely hardcode the UTC day boundaries without handling DST.
        // 07:00Z = 00:00 PT during daylight time, 23:00 PT during standard time

        // Always ensure we include the full day in search window to avoid missing availability
        // Using 23:59:59Z ensures we catch all availability for that day
        // This fixes both the single-day search issue and the batching gap issue
        const endAtTime = "23:59:59Z";

        const searchRequest = {
            query: {
                filter: {
                    startAtRange: {
                        startAt: `${startDate}T07:00:00Z`,
                        endAt: `${endDate}T${endAtTime}`
                    },
                    locationId,
                    segmentFilters: [
                        {
                            serviceVariationId: vid,
                            teamMemberIdFilter: { any: [staffId] }
                        }
                    ]
                }
            }
        };
        
        console.log(`Search request for availability from ${startDate} to ${endDate} with time range: ${startDate}T07:00:00Z to ${endDate}T${endAtTime}`);

        try {
            const result = await client.bookings.searchAvailability(searchRequest);
            const availabilities = result?.availabilities || [];
            
            // Enhanced logging for debugging staff availability issues
            console.log(`Staff ${staffId} availability search for ${vid}: Found ${availabilities.length} slots`);
            
            if (availabilities.length === 0) {
                console.log(`DEBUGGING: No availability found for staff ${staffId} from ${startDate} to ${endDate}`);
                console.log(`Request details: ${this.safeStringify(searchRequest)}`);
                
                // Check if there are any errors or warnings in the response
                if (result.errors?.length) {
                    console.error(`Availability errors for staff ${staffId}:`, this.safeStringify(result.errors));
                }
            }

            return availabilities.map(a => {
                const start = new Date(a.startAt!);
                const end = new Date(start);

                const segment = a.appointmentSegments?.[0];
                const segDuration = segment?.durationMinutes ?? duration;

                end.setMinutes(end.getMinutes() + segDuration);

                return {
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    available: true
                };
            });
        } catch (err) {
            console.error('Availability fetch failed:', err);
            
            // Add more detailed error logging to help diagnose the issue
            if (err.errors) {
                console.error('Availability search error details:', this.safeStringify(err.errors));
                
                // Check specifically for the team member service variation error
                const teamMemberServiceError = err.errors.find((e: { detail?: string }) => 
                    e.detail?.includes('team member who performs the selected service variation'));
                    
                if (teamMemberServiceError) {
                    console.error(`Staff ${staffId} is not assigned to perform service variation ${vid} ` +
                                 `in Square Dashboard. Please assign this service to the staff member.`);
                }
            }
            
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
     * Truncate consent form responses to fit within Square's character limit
     * @param responses The consent form responses to truncate
     * @param maxLength The maximum length allowed (default: 4000 characters to stay safely under Square's 4096 limit)
     * @returns A simplified string representation of consent form responses
     */
    static truncateConsentFormResponses(responses: any[], maxLength: number = 4000): string {
        if (!responses || !responses.length) return '';

        // Create a more compact representation of the consent forms
        let formattedText = '';
        let currentLength = 0;
        const maxQuestionLength = 50;
        const maxAnswerLength = 200;
        const maxFormTitleLength = 60;

        // Process each form
        for (const form of responses) {
            // Check if we're approaching the limit
            if (currentLength > maxLength - 200) {
                formattedText += '\n\n[Additional consent forms truncated due to size limits]';
                break;
            }

            // Add form title as a header (truncate if too long)
            let formTitle = form.formTitle || 'Consent Form';
            if (formTitle.length > maxFormTitleLength) {
                formTitle = formTitle.substring(0, maxFormTitleLength - 3) + '...';
            }

            const formTitleText = `\n${formTitle}\n`;
            formattedText += formTitleText;
            currentLength += formTitleText.length;

            // Process responses for this form
            if (form.responses && Array.isArray(form.responses)) {
                // Sort responses by importance (put required fields first)
                const sortedResponses = [...form.responses].sort((a, b) => {
                    // Put fields with answers first
                    if (a.answer && !b.answer) return -1;
                    if (!a.answer && b.answer) return 1;
                    return 0;
                });

                for (const response of sortedResponses) {
                    // Skip empty answers or markdown content with no answer
                    if (!response.answer && response.question !== 'This form is strictly confidential.') {
                        continue;
                    }

                    // Add question and answer
                    let question = response.question || '';
                    let answer = response.answer || '';

                    // Truncate long questions
                    if (question.length > maxQuestionLength) {
                        question = question.substring(0, maxQuestionLength - 3) + '...';
                    }

                    // Truncate long answers
                    if (answer.length > maxAnswerLength) {
                        answer = answer.substring(0, maxAnswerLength - 3) + '...';
                    }

                    // Only add non-empty questions and answers
                    if (question || answer) {
                        const responseText = `${question}: ${answer}\n\n`;

                        // Check if adding this would exceed our limit
                        if (currentLength + responseText.length > maxLength - 100) {
                            formattedText += '[Additional responses truncated...]\n';
                            break;
                        }

                        formattedText += responseText;
                        currentLength += responseText.length;
                    }
                }
            }

            formattedText += '\n'; // Add spacing between forms
            currentLength += 1;
        }

        // Final safety check - if still too long, truncate it
        if (formattedText.length > maxLength) {
            formattedText = formattedText.substring(0, maxLength - 60) +
                '\n\n[Note: Some consent form responses were truncated due to size limits]';
        }

        console.log("Truncated consent form responses length:", formattedText.length);
        console.log("Truncated consent form sample:", formattedText.substring(0, 100) + '...');
        return formattedText;
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

            // Truncate consent form responses to fit within Square's character limit
            const truncatedResponses = this.truncateConsentFormResponses(params.consentFormResponses || []);
            console.log("Truncated consent form responses length:", truncatedResponses.length);
            console.log("Truncated consent form sample:", truncatedResponses.substring(0, 100) + '...');

            // Create booking
            const bookingResult = await client.bookings.create({
                booking: {
                    locationId,
                    startAt: params.startTime,
                    appointmentSegments: [
                        {
                            serviceVariationId: service.variationId,
                            serviceVariationVersion: BigInt(service.variations!.find(v => v.id === service.variationId)!.version),
                            teamMemberId: params.staffId,
                            durationMinutes: params.totalDuration
                        }
                    ],
                    customerId,
                    // Move consent form responses to sellerNote instead of customerNote
                    sellerNote: (params.notes ? params.notes + '\n\n' : '') + truncatedResponses,
                    customerNote: '', // Leave customerNote empty
                    creatorDetails: {
                        customerId: customerId
                    }
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
                variationVersion: service.variations!.find(v => v.id === service.variationId)!.version,
                staffId: params.staffId,
                staffName: staff.name,
                startTime: params.startTime,
                //endTime: params.endTime,
                status: this.mapFromSquareBookingStatus(booking.status!),
                totalPrice: params.totalPrice,
                totalDuration: params.totalDuration,
                addons: addons as ServiceAddon[] | undefined,
                notes: params.notes,
                // Store a simplified version of the consent form responses
                consentFormResponses: [{
                    formId: 'simplified',
                    formTitle: 'Consent Forms Summary',
                    responses: [{
                        questionId: 'summary',
                        question: 'Consent Form Responses',
                        answer: truncatedResponses,
                        timestamp: new Date().toISOString()
                    }]
                }],
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
     * Get the price of a service by id
     * @param serviceId The ID of the service
     * @returns The price of the service
     */
    static async getServicePrice(serviceId: string): Promise<number> {
        try {
            const service = await this.getServiceById(serviceId);
            if (!service) {
                throw new Error('Service not found');
            }

            return service.price;
        } catch (error) {
            console.error('Error fetching service price from Square:', error);
            return 0;
        }
    }

    /**
     * Get the name of a service by id
     * @param serviceId The ID of the service
     * @returns The name of the service
     */
    static async getServiceName(serviceId: string): Promise<string> {
        try {
            const service = await this.getServiceById(serviceId);
            if (!service) {
                throw new Error('Service not found');
            }

            return service.name;
        } catch (error) {
            console.error('Error fetching service name from Square:', error);
            return 'Unknown Service';
        }
    }

    /**
     * Get an appointment by ID
     * @param appointmentId The ID of the appointment
     * @returns The appointment details
     */
    static async getAppointmentById(appointmentId: string): Promise<AppointmentConfirmation | null> {
        try {
            // Get booking details
            const bookingResult = await client.bookings.get({ bookingId: appointmentId });

            if (!bookingResult.booking) {
                console.error(`Booking not found: ${appointmentId}`);
                return null;
            }

            const booking = bookingResult.booking;

            const serviceIds = booking.appointmentSegments!.map(segment => segment.serviceVariationId!);

            // write a function that appends service naems to an array
            let serviceNames = [];

            for (const serviceId of serviceIds) {
                const service = await this.getServiceById(serviceId);
                serviceNames.push(service!.name);
            }


            console.log(serviceIds);

            let totalPrice = 0;
            for (const serviceId of serviceIds) {
                const price = await this.getServicePrice(serviceId);
                totalPrice += price;
            }

            // Get staff details
            const staff = await this.getStaffById(booking.appointmentSegments![0].teamMemberId!);

            return {
                id: booking.id!,
                serviceIds: serviceIds,
                serviceNames: serviceNames,
                staffId: booking.appointmentSegments![0].teamMemberId!,
                staffName: staff?.name || 'Unknown Staff',
                startTime: booking.startAt!,
                status: this.mapFromSquareBookingStatus(booking.status!),
                totalPrice: totalPrice,
                totalDuration: booking.appointmentSegments!.reduce((total, segment) => total + segment.durationMinutes!, 0),
                notes: booking.sellerNote || '',
                consentFormResponses: booking.customerNote ? JSON.parse(booking.customerNote) : [],
                createdAt: new Date(booking.createdAt!).toISOString(),
                updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : undefined
            };
        } catch (error) {
            console.error('Error fetching appointment by ID from Square:', error);
            return null;
        }
    }

    /**
     * This adds a waitlist to our DynamoDb...
     */

    static async addToWaitlist(entry: {
        serviceId: string;
        clientEmail: string;
        clientName: string;
        clientPhone: string;
        preferredDates: string[];
        preferredStaffIds: string[];
    }) {
        const id = nanoid();
        const item = {
            pk: `WAITLIST#${id}`,
            sk: `WAITLIST#${id}`,
            GSI1PK: `SERVICE#${entry.serviceId}`,
            GSI1SK: `STATUS#active`,
            id,
            type: 'waitlist',
            status: 'active',
            ...entry,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: WAITLIST_TABLE,
            Item: item,
        }));

        return item;
    }
    /**
     * List all bookings
     */
    static async listBookings(): Promise<any[]> {
        try {
            const result = await client.bookings.list({
                startAtMin: "2025-03-21T00:00:00Z",
                startAtMax: "2025-04-11T00:59:59Z",
                locationId: await this.getLocationId(),
            });

            if (!result.data) {
                console.error('No bookings found');
                return [];
            }

            //console.log(`Found ${result.data.length} bookings`);

            return result.data.map((booking: any) => ({
                id: booking.id,
                startAt: booking.startAt,
                endAt: booking.endAt,
                status: booking.status,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                appointmentSegments: booking.appointmentSegments,
            }));
        } catch (error) {
            console.error('Error listing bookings:', error);
            return [];
        }
    }

    static async createAppointmentWithMultipleSegments(params: CreateAppointmentParams): Promise<Appointment> {
        try {
            console.log("Starting createAppointmentWithMultipleSegments:", params);
            const locationId = await this.getLocationId();

            // --- 1. Get Prerequisites ---
            // Get main service details (including the specific variation)
            const mainService = await this.getServiceById(params.serviceId);
            if (!mainService || !mainService.variations) {
                throw new Error(`Service or its variations not found: ${params.serviceId}`);
            }
            const mainVariation = mainService.variations.find(v => v.id === params.variationId);
            if (!mainVariation) {
                throw new Error(`Specified variation ${params.variationId} not found for service ${params.serviceId}`);
            }
            // Validate passed version matches fetched version (optional but good practice)
            const mainVariationVersion = mainVariation.version; // Use fetched version
            const mainVariationDurationMins = Math.ceil(mainVariation.duration / 60000);
            const mainVariationPrice = mainVariation.price;

            // Get Addon details (as ServiceAddon including variationId, version, duration, price)
            let addonDetails: ServiceAddon[] = [];
            if (params.addons && params.addons.length > 0) {
                // Assuming getAddonsByIds returns enhanced ServiceAddon[]
                addonDetails = await this.getAddonsByIds(params.addons);
                if (addonDetails.length !== params.addons.length) {
                    throw new Error("Failed to fetch details for all requested addons.");
                }
                console.log("Fetched addon details:", addonDetails);
            }

            // Get Staff details
            const staff = await this.getStaffById(params.staffId);
            if (!staff) throw new Error(`Staff member not found: ${params.staffId}`);
            const staffName = params.staffName || staff.name;

            // Get or Create Customer
            // (Keep existing customer lookup/creation logic - requires 'client' instance)
            console.log(`Searching for customer: ${params.clientEmail}`);
            const customerResult = await client.customers.search({
                query: { filter: { emailAddress: { exact: params.clientEmail } } }
            });
            let customerId = customerResult.customers?.[0]?.id;
            if (!customerId) {
                console.log(`Customer not found, creating new customer: ${params.clientEmail}`);
                const newCustomerResult = await client.customers.create({
                    givenName: params.clientName.split(' ')[0],
                    familyName: params.clientName.split(' ').slice(1).join(' '),
                    emailAddress: params.clientEmail,
                    phoneNumber: params.clientPhone,

                });
                customerId = newCustomerResult.customer?.id;
                console.log("Payment nonce:", params.paymentNonce);
                try {
                    if (params.paymentNonce && customerId) {
                        console.log('Saving card on file using nonce:', params.paymentNonce);
                        try {
                            const cardResult = await client.cards.create({
                                idempotencyKey: randomUUID(),
                                sourceId: params.paymentNonce,
                                card: {
                                    customerId,
                                    cardholderName: params.clientName,
                                    referenceId: params.userId, // for user system
                                    billingAddress: {
                                        country: 'CA',
                                    }
                                }
                            });

                            if (!cardResult.card?.id) {
                                console.warn('Card creation did not return a card ID');
                            } else {
                                console.log('Saved card on file with ID:', cardResult.card.id);
                            }
                        } catch (err) {
                            console.error('Failed to store card on file:', err);
                            throw new Error('Failed to store payment method');
                        }
                    }

                }
                catch (err) {
                    console.error('Failed to save card on file:', err);
                    throw new Error('Failed to store payment method');
                }
                if (!customerId) throw new Error('Failed to create/retrieve customer');
                console.log(`Created/found customer ID: ${customerId}`);
            }


            // --- 2. Construct Appointment Segments ---
            const appointmentSegments: any[] = []; // Use 'any' or define segment type

            // Add main service segment
            appointmentSegments.push({
                durationMinutes: mainVariationDurationMins,
                teamMemberId: params.staffId,
                serviceVariationId: params.variationId,
                serviceVariationVersion: BigInt(mainVariationVersion) // Use fetched version
            });

            // Add addon segments
            addonDetails.forEach(addon => {
                const addonDurationMins = Math.ceil(addon.duration / 60000);
                if (addonDurationMins > 0) { // Only add segment if addon has duration
                    appointmentSegments.push({
                        durationMinutes: addonDurationMins,
                        teamMemberId: params.staffId, // Assuming same staff for addons
                        serviceVariationId: addon.variationId, // Use addon's variation ID
                        serviceVariationVersion: BigInt(addon.version) // Use addon's variation version
                    });
                } else {
                    console.warn(`Addon ${addon.name} (${addon.id}) has zero duration, not adding as a separate segment.`);
                }
            });

            console.log("Constructed appointment segments:", appointmentSegments);


            // --- 3. Process Consent Forms ---
            // Truncate consent form responses to fit within Square's character limit
            const truncatedResponses = this.truncateConsentFormResponses(params.consentFormResponses || []);
            console.log("Truncated consent form responses length:", truncatedResponses.length);
            console.log("Truncated consent form sample:", truncatedResponses.substring(0, 100) + '...');

            // --- 4. Calculate Totals (for *your* system) ---
            let calculatedTotalPrice = mainVariationPrice;
            let calculatedTotalDurationMins = mainVariationDurationMins;
            let detailedNotesForStaff = `- ${params.serviceName} (${mainVariationDurationMins} min)`;

            if (addonDetails.length > 0) {
                detailedNotesForStaff += "\nAdd-ons:"
                addonDetails.forEach(addon => {
                    calculatedTotalPrice += addon.price;
                    const addonDurationMins = Math.ceil(addon.duration / 60000);
                    calculatedTotalDurationMins += addonDurationMins;
                    detailedNotesForStaff += `\n- ${addon.name} (${addonDurationMins} min) - $${(addon.price / 100).toFixed(2)}`;
                });
            }
            detailedNotesForStaff += `\n\nEst. Total Price: $${(calculatedTotalPrice / 100).toFixed(2)}`;
            detailedNotesForStaff += `\nEst. Total Duration: ${calculatedTotalDurationMins} min`;

            // Prepend client notes if they exist
            const finalSellerNote = params.notes
                ? `${params.notes}\n\n---\n${detailedNotesForStaff}`
                : detailedNotesForStaff;

            console.log("Calculated Total Price (cents):", calculatedTotalPrice);
            console.log("Calculated Total Duration (mins):", calculatedTotalDurationMins);


            // --- 4. Create the Square Booking ---
            const bookingRequest = {
                idempotencyKey: randomUUID(),
                booking: {
                    locationId,
                    startAt: params.startTime, // Start time of the first segment
                    customerId,
                    appointmentSegments, // The array of segments
                    // Combine detailed notes with consent form responses in sellerNote
                    sellerNote: finalSellerNote + '\n\n---\n\nCONSENT FORMS:\n' + truncatedResponses,
                    customerNote: '', // Leave customerNote empty
                    //creatorDetails: {
                    //    customerId: customerId
                    //}
                }
            };

            console.log("Creating Square Booking with request:", this.safeStringify(bookingRequest));
            const bookingResult = await client.bookings.create(bookingRequest);

            if (!bookingResult.booking || !bookingResult.booking.id) {
                console.error("Failed Booking Response Body:", this.safeStringify(bookingResult));
                throw new Error('Failed to create Square booking');
            }

            const bookingId = bookingResult.booking.id;
            const booking = bookingResult.booking;
            console.log(`Successfully created Square Booking with ID: ${bookingId}`);
            // Log the actual duration Square calculated (if available) vs expected
            const squareTotalDuration = booking.appointmentSegments?.reduce((sum, seg) => sum + (seg.durationMinutes ?? 0), 0);
            console.log(`Square Booking total duration (from segments): ${squareTotalDuration} min`);
            if (squareTotalDuration !== calculatedTotalDurationMins) {
                console.warn(`Calculated duration (${calculatedTotalDurationMins} min) differs from sum of Square segment durations (${squareTotalDuration} min).`);
            }


            // --- 5. Construct Local Appointment Object ---
            const startTimeDate = new Date(params.startTime);
            const endTimeDate = new Date(startTimeDate.getTime() + calculatedTotalDurationMins * 60000);
            const endTimeISO = endTimeDate.toISOString();

            const appointment: Appointment = {
                id: bookingId,
                clientName: params.clientName,
                clientEmail: params.clientEmail,
                clientPhone: params.clientPhone,
                serviceId: params.serviceId,
                serviceName: params.serviceName,
                variationVersion: mainVariationVersion,
                staffId: params.staffId,
                staffName: staffName,
                startTime: params.startTime,
                //endTime: endTimeISO, // Use calculated end time
                status: this.mapFromSquareBookingStatus(booking.status!),
                totalPrice: calculatedTotalPrice, // Store calculated total price
                totalDuration: calculatedTotalDurationMins, // Store calculated total duration
                addons: addonDetails, // Store full addon details
                notes: params.notes, // Original client notes only
                // Store a simplified version of the consent form responses
                consentFormResponses: [{
                    formId: 'simplified',
                    formTitle: 'Consent Forms Summary',
                    responses: [{
                        questionId: 'summary',
                        question: 'Consent Form Responses',
                        answer: truncatedResponses,
                        timestamp: new Date().toISOString()
                    }]
                }],
                userId: params.userId,
                createdAt: new Date(booking.createdAt!).toISOString(),
                updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : new Date(booking.createdAt!).toISOString()
            };

            console.log("Constructed final Appointment object:", appointment);

            // --- 6. Return Result ---
            return appointment; // Return the constructed appointment object

        } catch (error: any) {
            console.error('Error in createAppointmentWithMultipleSegments:', error);
            if (error?.body) {
                console.error('Square API Error Body:', this.safeStringify(error.body));
            } else if (error instanceof Error) {
                console.error('Error stack:', error.stack);
            }
            throw error; // Re-throw
        }
    }
}
