import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
    DynamoDBDocumentClient, 
    GetCommand, 
    PutCommand, 
    QueryCommand,
    UpdateCommand,
    DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';

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

    // Addon Methods
    static async getServiceAddons(serviceId: string) {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: SERVICES_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :serviceId AND begins_with(GSI1SK, :prefix)',
            ExpressionAttributeValues: {
                ':serviceId': `SERVICE#${serviceId}`,
                ':prefix': 'ADDON#',
            },
        }));

        return result.Items || [];
    }

    static async createServiceAddon(addon: {
        serviceId: string;
        name: string;
        description: string;
        duration: number;
        price: number;
    }) {
        const id = nanoid();
        const item = {
            pk: `ADDON#${id}`,
            sk: `ADDON#${id}`,
            GSI1PK: `SERVICE#${addon.serviceId}`,
            GSI1SK: `ADDON#${id}`,
            id,
            type: 'addon',
            ...addon,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: SERVICES_TABLE,
            Item: item,
        }));

        return item;
    }

    static async getAddonsByIds(addonIds: string[]) {
        const addons = await Promise.all(
            addonIds.map((id) =>
                dynamoDb.send(new GetCommand({
                    TableName: SERVICES_TABLE,
                    Key: {
                        pk: `ADDON#${id}`,
                        sk: `ADDON#${id}`,
                    },
                }))
            )
        );

        return addons.map((result) => result.Item).filter(Boolean);
    }

    // Appointment Methods
    static async createAppointment(appointment: {
        clientEmail: string;
        clientName: string;
        clientPhone: string;
        staffId: string;
        serviceId: string;
        addons: string[];
        startTime: string;
        endTime: string;
        totalPrice: number;
        totalDuration: number;
        consentFormResponses: {
            formId: string;
            responses: Record<string, any>;
        }[];
        notes?: string;
        userId?: string;
    }) {
        const id = nanoid();
        const startDate = new Date(appointment.startTime);
        const item = {
            pk: `APPOINTMENT#${id}`,
            sk: `APPOINTMENT#${id}`,
            GSI1PK: `STAFF#${appointment.staffId}`,
            GSI1SK: `DATE#${appointment.startTime}`,
            GSI2PK: `CLIENT#${appointment.clientEmail}`,
            GSI2SK: `DATE#${appointment.startTime}`,
            id,
            type: 'appointment',
            status: 'pending',
            ...appointment,
            createdAt: new Date().toISOString(),
        };

        await dynamoDb.send(new PutCommand({
            TableName: APPOINTMENTS_TABLE,
            Item: item,
        }));

        return item;
    }

    static async getStaffAppointments(staffId: string, startDate: string, endDate: string) {
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

        return result.Items || [];
    }

    static async getClientAppointments(clientEmail: string) {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: APPOINTMENTS_TABLE,
            IndexName: 'GSI2',
            KeyConditionExpression: 'GSI2PK = :clientEmail',
            ExpressionAttributeValues: {
                ':clientEmail': `CLIENT#${clientEmail}`,
            },
        }));

        return result.Items || [];
    }

    static async checkTimeSlotAvailability(
        staffId: string,
        startTime: string,
        endTime: string
    ) {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: APPOINTMENTS_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :staffId AND GSI1SK BETWEEN :start AND :end',
            FilterExpression: 'status <> :cancelled',
            ExpressionAttributeValues: {
                ':staffId': `STAFF#${staffId}`,
                ':start': startTime,
                ':end': endTime,
                ':cancelled': 'cancelled',
            },
        }));

        return (result.Items || []).length === 0;
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
                pk: `CATEGORY#${id}`,
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