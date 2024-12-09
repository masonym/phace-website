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
import { nanoid } from 'nanoid';

interface ServiceCategory {
    id: string;
    name: string;
    description: string;
    order: number;
    image?: string;
    createdAt: string;
    updatedAt?: string;
}

interface Service {
    id: string;
    categoryId: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    image?: string;
    requiredForms?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface StaffMember {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    bio?: string;
    image?: string;
    services: string[];
    defaultAvailability: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }[];
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface ServiceAddon {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    serviceIds: string[];
    createdAt: string;
    updatedAt?: string;
}

interface ConsentFormResponse {
    formId: string;
    formTitle: string;
    responses: {
        questionId: string;
        question: string;
        answer: string;
        timestamp: string;
    }[];
}

export interface CreateAppointmentParams {
    serviceId: string;
    staffId: string;
    startTime: string;
    endTime: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    notes?: string;
    userId?: string;
    addons?: string[];
    totalPrice: number;
    totalDuration: number;
    consentFormResponses?: ConsentFormResponse[];
}

interface Appointment {
    id: string;
    clientEmail: string;
    clientName: string;
    clientPhone: string;
    staffId: string;
    staffName: string;
    serviceId: string;
    serviceName: string;
    addons?: {
        id: string;
        name: string;
        price: number;
    }[];
    startTime: string;
    endTime: string;
    totalPrice: number;
    totalDuration: number;
    consentFormResponses?: ConsentFormResponse[];
    notes?: string;
    userId?: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    createdAt: string;
    updatedAt: string;
}

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const dynamoDb = DynamoDBDocumentClient.from(ddbClient);

const SERVICES_TABLE = 'phace-services';
const APPOINTMENTS_TABLE = 'phace-appointments';
const STAFF_TABLE = 'phace-staff';
const CLIENTS_TABLE = 'phace-clients';
const WAITLIST_TABLE = 'phace-waitlist';
const FORMS_TABLE = 'phace-forms';

export class BookingService {
    // Service Category Methods
    static async createServiceCategory(category: {
        name: string;
        description: string;
        order: number;
        image?: string;
    }) {
        const id = nanoid();
        const item = {
            pk: 'CATEGORIES',
            sk: `CATEGORY#${id}`,
            id,
            type: 'category',
            ...category,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: SERVICES_TABLE,
            Item: item,
        }));

        return item;
    }

    static async getServiceCategories() {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: SERVICES_TABLE,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'CATEGORIES',
            },
        }));

        return result.Items || [];
    }

    static async deleteServiceCategory(id: string): Promise<void> {
        const deleteParams = {
          TableName: SERVICES_TABLE,
          Key: {
            pk: 'CATEGORIES',
            sk: `CATEGORY#${id}`,
          },
        };

        await dynamoDb.send(new DeleteCommand(deleteParams));
    }

    // Service Methods
    static async createService(service: {
        categoryId: string;
        name: string;
        description: string;
        duration: number;
        price: number;
        image?: string;
        requiredForms?: string[];
    }) {
        const id = nanoid();
        const item = {
            pk: 'SERVICES',
            sk: `SERVICE#${id}`,
            GSI1PK: `CATEGORY#${service.categoryId}`,
            GSI1SK: `SERVICE#${id}`,
            id,
            type: 'service',
            isActive: true,
            ...service,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: SERVICES_TABLE,
            Item: item,
        }));

        return item;
    }

    static async getServicesByCategory(categoryId: string) {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: SERVICES_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :categoryId',
            ExpressionAttributeValues: {
                ':categoryId': `CATEGORY#${categoryId}`,
            },
        }));

        return result.Items || [];
    }

    static async getServiceById(id: string) {
        const result = await dynamoDb.send(new GetCommand({
            TableName: SERVICES_TABLE,
            Key: {
                pk: 'SERVICES',
                sk: `SERVICE#${id}`,
            },
        }));

        return result.Item;
    }

    static async deleteService(id: string) {
        await dynamoDb.send(new DeleteCommand({
            TableName: SERVICES_TABLE,
            Key: {
                pk: 'SERVICES',
                sk: `SERVICE#${id}`,
            },
        }));
    }

    // Staff Methods
    static async createStaffMember(staff: {
        name: string;
        email: string;
        passwordHash: string;
        bio?: string;
        image?: string;
        services: string[];
        defaultAvailability: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }) {
        const id = nanoid();
        const item = {
            pk: `STAFF#${id}`,
            sk: `STAFF#${id}`,
            GSI1PK: `STAFF_EMAIL#${staff.email}`,
            GSI1SK: `STAFF#${id}`,
            id,
            type: 'staff',
            isActive: true,
            ...staff,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: STAFF_TABLE,
            Item: item,
        }));

        return item;
    }

    static async getAllStaffMembers() {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: STAFF_TABLE,
            KeyConditionExpression: 'begins_with(pk, :pk)',
            ExpressionAttributeValues: {
                ':pk': 'STAFF#',
            },
        }));

        return result.Items?.map(item => ({
            id: item.id,
            name: item.name,
            email: item.email,
            services: item.services,
        })) || [];
    }

    static async getStaffByService(serviceId: string) {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: STAFF_TABLE,
            FilterExpression: 'contains(services, :serviceId)',
            ExpressionAttributeValues: {
                ':serviceId': serviceId,
            },
        }));

        return result.Items || [];
    }

    static async getStaffById(id: string) {
        const result = await dynamoDb.send(new GetCommand({
            TableName: STAFF_TABLE,
            Key: {
                pk: `STAFF#${id}`,
                sk: `STAFF#${id}`,
            },
        }));

        return result.Item;
    }

    static async getStaffAvailability(staffId: string, dayOfWeek: number) {
        const staff = await this.getStaffById(staffId);
        if (!staff?.defaultAvailability) return null;

        return staff.defaultAvailability.find(
            (availability: { dayOfWeek: number; }) => availability.dayOfWeek === dayOfWeek
        );
    }

    static async getBlockedTimes(staffId: string, startTime: string, endTime: string) {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: STAFF_TABLE,
            KeyConditionExpression: 'pk = :pk AND sk BETWEEN :start AND :end',
            ExpressionAttributeValues: {
                ':pk': `STAFF#${staffId}#BLOCKED`,
                ':start': startTime,
                ':end': endTime,
            },
        }));

        return result.Items || [];
    }

    static async deleteStaffMember(id: string) {
        await dynamoDb.send(new DeleteCommand({
            TableName: STAFF_TABLE,
            Key: {
                pk: `STAFF#${id}`,
                sk: `STAFF#${id}`,
            },
        }));
    }

    // Addon Methods
    static async createServiceAddon(addon: {
        name: string;
        description: string;
        duration: number;
        price: number;
        serviceIds: string[];
    }) {
        const id = nanoid();
        const item = {
            pk: 'ADDONS',
            sk: `ADDON#${id}`,
            GSI1PK: 'ADDON',
            GSI1SK: addon.name,
            id,
            type: 'addon',
            ...addon,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: SERVICES_TABLE,
            Item: item,
        }));

        // Create entries for each service-addon relationship
        await Promise.all(addon.serviceIds.map(serviceId => 
            dynamoDb.send(new PutCommand({
                TableName: SERVICES_TABLE,
                Item: {
                    pk: `SERVICE#${serviceId}`,
                    sk: `ADDON#${id}`,
                    GSI1PK: 'SERVICE_ADDON',
                    GSI1SK: addon.name,
                    addonId: id,
                    serviceId,
                    type: 'service_addon',
                    createdAt: new Date().toISOString(),
                }
            }))
        ));

        return item;
    }

    static async getAllAddons() {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: SERVICES_TABLE,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'ADDONS',
            },
        }));

        return result.Items || [];
    }

    static async getServiceAddons(serviceId: string) {
        // Get all addon IDs associated with this service
        const serviceAddons = await dynamoDb.send(new QueryCommand({
            TableName: SERVICES_TABLE,
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
            ExpressionAttributeValues: {
                ':pk': `SERVICE#${serviceId}`,
                ':sk': 'ADDON#',
            },
        }));

        // Get the actual addon details for each ID
        const addonIds = serviceAddons.Items?.map(item => item.addonId) || [];
        if (addonIds.length === 0) return [];

        const addons = await Promise.all(addonIds.map(addonId =>
            dynamoDb.send(new GetCommand({
                TableName: SERVICES_TABLE,
                Key: {
                    pk: 'ADDONS',
                    sk: `ADDON#${addonId}`,
                },
            }))
        ));

        return addons
            .map(result => result.Item)
            .filter(item => item !== undefined);
    }

    static async getAddonsByIds(addonIds: string[]) {
        if (!addonIds.length) return [];
        
        const addons = await Promise.all(
            addonIds.map((id) =>
                dynamoDb.send(new GetCommand({
                    TableName: SERVICES_TABLE,
                    Key: {
                        pk: 'ADDONS',
                        sk: `ADDON#${id}`,
                    },
                }))
            )
        );

        return addons
            .map((result) => result.Item)
            .filter((item): item is any => item !== null && item !== undefined);
    }

    static async updateServiceAddon(addonId: string, addon: {
        name: string;
        description: string;
        duration: number;
        price: number;
        serviceIds: string[];
    }) {
        // First, get the existing addon to get its current service associations
        const existingAddon = await dynamoDb.send(new GetCommand({
            TableName: SERVICES_TABLE,
            Key: {
                pk: 'ADDONS',
                sk: `ADDON#${addonId}`,
            },
        }));

        if (!existingAddon.Item) {
            throw new Error('Addon not found');
        }

        const oldServiceIds = existingAddon.Item.serviceIds || [];
        const newServiceIds = addon.serviceIds;

        // Update the main addon record
        const item = {
            pk: 'ADDONS',
            sk: `ADDON#${addonId}`,
            GSI1PK: 'ADDON',
            GSI1SK: addon.name,
            id: addonId,
            type: 'addon',
            ...addon,
            updatedAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: SERVICES_TABLE,
            Item: item,
        }));

        // Remove service associations that are no longer needed
        const removedServiceIds = oldServiceIds.filter((id: any) => !newServiceIds.includes(id));
        await Promise.all(removedServiceIds.map((serviceId: any) =>
            dynamoDb.send(new DeleteCommand({
                TableName: SERVICES_TABLE,
                Key: {
                    pk: `SERVICE#${serviceId}`,
                    sk: `ADDON#${addonId}`,
                },
            }))
        ));

        // Add new service associations
        const addedServiceIds = newServiceIds.filter(id => !oldServiceIds.includes(id));
        await Promise.all(addedServiceIds.map(serviceId =>
            dynamoDb.send(new PutCommand({
                TableName: SERVICES_TABLE,
                Item: {
                    pk: `SERVICE#${serviceId}`,
                    sk: `ADDON#${addonId}`,
                    GSI1PK: 'SERVICE_ADDON',
                    GSI1SK: addon.name,
                    addonId,
                    serviceId,
                    type: 'service_addon',
                    createdAt: new Date().toISOString(),
                },
            }))
        ));

        return item;
    }

    static async deleteServiceAddon(addonId: string) {
        // First, get the addon to get its service associations
        const existingAddon = await dynamoDb.send(new GetCommand({
            TableName: SERVICES_TABLE,
            Key: {
                pk: 'ADDONS',
                sk: `ADDON#${addonId}`,
            },
        }));

        if (!existingAddon.Item) {
            throw new Error('Addon not found');
        }

        const serviceIds = existingAddon.Item.serviceIds || [];

        // Delete the main addon record
        await dynamoDb.send(new DeleteCommand({
            TableName: SERVICES_TABLE,
            Key: {
                pk: 'ADDONS',
                sk: `ADDON#${addonId}`,
            },
        }));

        // Delete all service associations
        await Promise.all(serviceIds.map((serviceId: any) =>
            dynamoDb.send(new DeleteCommand({
                TableName: SERVICES_TABLE,
                Key: {
                    pk: `SERVICE#${serviceId}`,
                    sk: `ADDON#${addonId}`,
                },
            }))
        ));

        return true;
    }

    // Appointment Methods
    static async createAppointment(params: CreateAppointmentParams): Promise<Appointment> {
        // Get service, staff, and addon details
        const [service, staff, addonDetails] = await Promise.all([
            this.getServiceById(params.serviceId),
            this.getStaffById(params.staffId),
            params.addons ? this.getAddonsByIds(params.addons) : Promise.resolve([])
        ]);

        if (!service || !staff) {
            throw new Error('Service or staff not found');
        }

        const id = nanoid();
        const now = new Date().toISOString();

        // Ensure consentFormResponses is properly structured
        const consentFormResponses = params.consentFormResponses?.map(form => ({
            formId: form.formId,
            formTitle: form.formTitle,
            responses: form.responses.map(response => ({
                questionId: response.questionId,
                question: response.question,
                answer: response.answer,
                timestamp: response.timestamp || now
            }))
        }));

        const item: Appointment = {
            id,
            clientEmail: params.clientEmail,
            clientName: params.clientName,
            clientPhone: params.clientPhone,
            staffId: params.staffId,
            staffName: staff.name,
            serviceId: params.serviceId,
            serviceName: service.name,
            addons: addonDetails.map(addon => ({
                id: addon.id,
                name: addon.name,
                price: addon.price
            })),
            startTime: params.startTime,
            endTime: params.endTime,
            totalPrice: params.totalPrice,
            totalDuration: params.totalDuration,
            consentFormResponses,
            notes: params.notes,
            userId: params.userId,
            status: 'confirmed' as const,
            createdAt: now,
            updatedAt: now,
        };

        const dbItem = {
            pk: `APPOINTMENT#${id}`,
            sk: `APPOINTMENT#${id}`,
            GSI1PK: `STAFF#${params.staffId}`,
            GSI1SK: `DATE#${params.startTime}`,
            GSI2PK: `CLIENT#${params.clientEmail}`,
            GSI2SK: `DATE#${params.startTime}`,
            type: 'appointment',
            ...item
        };

        await dynamoDb.send(new PutCommand({
            TableName: APPOINTMENTS_TABLE,
            Item: dbItem,
        }));

        return item;
    }

    static async getStaffAppointments(staffId: string, startDate: string, endDate: string): Promise<Appointment[]> {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: APPOINTMENTS_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :staffId AND GSI1SK BETWEEN :startDate AND :endDate',
            ExpressionAttributeValues: {
                ':staffId': `STAFF#${staffId}`,
                ':startDate': `DATE#${startDate}`,
                ':endDate': `DATE#${endDate}`,
            },
        }));

        return (result.Items || []) as Appointment[];
    }

    static async getClientAppointments(clientEmail: string): Promise<Appointment[]> {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: APPOINTMENTS_TABLE,
            IndexName: 'GSI2',
            KeyConditionExpression: 'GSI2PK = :clientEmail',
            ExpressionAttributeValues: {
                ':clientEmail': `CLIENT#${clientEmail}`,
            },
        }));

        return (result.Items || []) as Appointment[];
    }

    static async getAppointmentById(id: string) {
        const result = await dynamoDb.send(new GetCommand({
            TableName: APPOINTMENTS_TABLE,
            Key: {
                pk: `APPOINTMENT#${id}`,
                sk: `APPOINTMENT#${id}`,
            },
        }));

        if (!result.Item) {
            return null;
        }

        return {
            id: id,
            clientName: result.Item.clientName,
            serviceName: result.Item.serviceName,
            staffName: result.Item.staffName,
            startTime: result.Item.startTime,
            endTime: result.Item.endTime,
            totalPrice: Number(result.Item.totalPrice),
            status: result.Item.status,
        };
    }

    static async checkTimeSlotAvailability(
        staffId: string,
        startTime: string,
        endTime: string
    ) {
        // Get all appointments that could potentially overlap with our time slot
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const dayStart = new Date(startDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(startDate);
        dayEnd.setHours(23, 59, 59, 999);

        const result = await dynamoDb.send(new QueryCommand({
            TableName: APPOINTMENTS_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :staffId AND GSI1SK BETWEEN :start AND :end',
            FilterExpression: '#appointmentStatus <> :cancelled',
            ExpressionAttributeNames: {
                '#appointmentStatus': 'status'
            },
            ExpressionAttributeValues: {
                ':staffId': `STAFF#${staffId}`,
                ':start': `DATE#${dayStart.toISOString()}`,
                ':end': `DATE#${dayEnd.toISOString()}`,
                ':cancelled': 'cancelled',
            },
        }));

        // Check for any overlapping appointments
        const hasOverlap = (result.Items || []).some(apt => {
            const aptStartTime = new Date(apt.startTime);
            const aptEndTime = new Date(apt.endTime);
            
            return (
                // Check if our slot starts during another appointment
                (startDate >= aptStartTime && startDate < aptEndTime) ||
                // Check if our slot ends during another appointment
                (endDate > aptStartTime && endDate <= aptEndTime) ||
                // Check if our slot completely encompasses another appointment
                (startDate <= aptStartTime && endDate >= aptEndTime)
            );
        });

        // Also check for any blocked times
        const blockedTimes = await this.getBlockedTimes(
            staffId,
            dayStart.toISOString(),
            dayEnd.toISOString()
        );

        const hasBlockedOverlap = blockedTimes.some(block => {
            const blockStartTime = new Date(block.startTime);
            const blockEndTime = new Date(block.endTime);
            
            return (
                // Check if our slot starts during a blocked time
                (startDate >= blockStartTime && startDate < blockEndTime) ||
                // Check if our slot ends during a blocked time
                (endDate > blockStartTime && endDate <= blockEndTime) ||
                // Check if our slot completely encompasses a blocked time
                (startDate <= blockStartTime && endDate >= blockEndTime)
            );
        });

        return !hasOverlap && !hasBlockedOverlap;
    }

    static async updateAppointmentStatus(appointmentId: string, status: string) {
        const result = await dynamoDb.send(new UpdateCommand({
            TableName: APPOINTMENTS_TABLE,
            Key: {
                pk: `APPOINTMENT#${appointmentId}`,
                sk: `APPOINTMENT#${appointmentId}`,
            },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': status,
                ':updatedAt': new Date().toISOString(),
            },
            ReturnValues: 'ALL_NEW',
        }));

        return result.Attributes;
    }

    // Email Methods
    static async sendAppointmentConfirmation(data: {
        appointmentId: string;
        clientEmail: string;
        clientName: string;
        serviceName: string;
        startTime: string;
        endTime: string;
        staffName: string;
    }) {
        // TODO: Implement email sending using AWS SES
        console.log('Sending confirmation email:', data);
    }

    // Admin Methods
    static async updateServiceCategory(id: string, data: {
        name?: string;
        description?: string;
        order?: number;
        image?: string;
    }) {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                updateExpressions.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = value;
            }
        });

        if (updateExpressions.length === 0) return;

        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        updateExpressions.push('updatedAt = :updatedAt');

        const result = await dynamoDb.send(new UpdateCommand({
            TableName: SERVICES_TABLE,
            Key: {
                pk: 'CATEGORIES',
                sk: `CATEGORY#${id}`,
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }));

        return result.Attributes;
    }

    static async updateService(id: string, data: {
        name?: string;
        description?: string;
        duration?: number;
        price?: number;
        image?: string;
        isActive?: boolean;
        requiredForms?: string[];
        categoryId?: string;
    }) {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'categoryId') {
                    // Update the GSI1PK for category association
                    updateExpressions.push('#GSI1PK = :GSI1PK');
                    expressionAttributeNames['#GSI1PK'] = 'GSI1PK';
                    expressionAttributeValues[':GSI1PK'] = `CATEGORY#${value}`;
                } else {
                    updateExpressions.push(`#${key} = :${key}`);
                    expressionAttributeNames[`#${key}`] = key;
                    expressionAttributeValues[`:${key}`] = value;
                }
            }
        });

        if (updateExpressions.length === 0) return;

        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        updateExpressions.push('updatedAt = :updatedAt');

        const result = await dynamoDb.send(new UpdateCommand({
            TableName: SERVICES_TABLE,
            Key: {
                pk: 'SERVICES',
                sk: `SERVICE#${id}`,
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }));

        return result.Attributes;
    }

    static async updateStaffMember(id: string, data: {
        name?: string;
        email?: string;
        bio?: string;
        image?: string;
        services?: string[];
        defaultAvailability?: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
        isActive?: boolean;
    }) {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                updateExpressions.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = value;
            }
        });

        if (updateExpressions.length === 0) return;

        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        updateExpressions.push('updatedAt = :updatedAt');

        const result = await dynamoDb.send(new UpdateCommand({
            TableName: STAFF_TABLE,
            Key: {
                pk: `STAFF#${id}`,
                sk: `STAFF#${id}`,
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        }));

        return result.Attributes;
    }

    static async createBlockedTime(staffId: string, data: {
        startTime: string;
        endTime: string;
        reason?: string;
        recurring?: {
            frequency: 'daily' | 'weekly';
            until: string;
        };
    }) {
        const id = nanoid();
        const item = {
            pk: `STAFF#${staffId}#BLOCKED`,
            sk: data.startTime,
            id,
            type: 'blocked_time',
            staffId,
            ...data,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: STAFF_TABLE,
            Item: item,
        }));

        return item;
    }

    static async deleteBlockedTime(staffId: string, startTime: string) {
        await dynamoDb.send(new DeleteCommand({
            TableName: STAFF_TABLE,
            Key: {
                pk: `STAFF#${staffId}#BLOCKED`,
                sk: startTime,
            },
        }));
    }

    // Waitlist Methods
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

    static async getWaitlistEntries(status: 'active' | 'contacted' | 'booked' | 'expired' = 'active') {
        const result = await dynamoDb.send(new ScanCommand({
            TableName: WAITLIST_TABLE,
            FilterExpression: '#type = :type AND #status = :status',
            ExpressionAttributeNames: {
                '#type': 'type',
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':type': 'waitlist',
                ':status': status
            }
        }));

        return result.Items || [];
    }

    static async getWaitlistEntriesByService(serviceId: string, status: 'active' | 'contacted' | 'booked' | 'expired' = 'active') {
        const result = await dynamoDb.send(new ScanCommand({
            TableName: WAITLIST_TABLE,
            FilterExpression: '#type = :type AND #status = :status AND serviceId = :serviceId',
            ExpressionAttributeNames: {
                '#type': 'type',
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':type': 'waitlist',
                ':status': status,
                ':serviceId': serviceId
            }
        }));

        return result.Items || [];
    }

    static async updateWaitlistStatus(id: string, status: 'active' | 'contacted' | 'booked' | 'expired', notes?: string) {
        const result = await dynamoDb.send(new UpdateCommand({
            TableName: WAITLIST_TABLE,
            Key: {
                pk: `WAITLIST#${id}`,
                sk: `WAITLIST#${id}`,
            },
            UpdateExpression: notes 
                ? 'SET GSI1SK = :status, #status = :statusValue, notes = :notes, updatedAt = :updatedAt'
                : 'SET GSI1SK = :status, #status = :statusValue, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': `STATUS#${status}`,
                ':statusValue': status,
                ':updatedAt': new Date().toISOString(),
                ...(notes && { ':notes': notes }),
            },
            ReturnValues: 'ALL_NEW',
        }));

        return result.Attributes;
    }

    static async deleteWaitlistEntry(id: string) {
        await dynamoDb.send(new DeleteCommand({
            TableName: WAITLIST_TABLE,
            Key: {
                pk: `WAITLIST#${id}`,
                sk: `WAITLIST#${id}`,
            },
        }));
    }

    // Form Methods
    static async createConsentForm(form: {
        name: string;
        type: 'general' | 'service-specific' | 'photo' | 'terms';
        questions: {
            id: string;
            text: string;
            type: string;
            required: boolean;
            options?: string[];
        }[];
        serviceIds?: string[];
    }) {
        const id = nanoid();
        const item = {
            pk: `FORM#${id}`,
            sk: `FORM#${id}`,
            id,
            // type: 'form',
            ...form,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: FORMS_TABLE,
            Item: item,
        }));

        return item;
    }

    static async getServiceForms(serviceId: string) {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: FORMS_TABLE,
            FilterExpression: 'attribute_not_exists(serviceIds) OR contains(serviceIds, :serviceId)',
            ExpressionAttributeValues: {
                ':serviceId': serviceId,
            },
        }));

        return result.Items || [];
    }
}
