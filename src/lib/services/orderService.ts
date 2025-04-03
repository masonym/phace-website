import { PutCommand, QueryCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, TABLES } from "../aws-config";

interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
    name: string;
}

interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    shippingAddress: {
        name: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    createdAt: string;
    updatedAt: string;
    tracking?: {
        trackingNumber: string;
        carrier: string;
    };
}

export class OrderService {
    static async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
        const timestamp = new Date().toISOString();
        const orderId = `ORDER_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

        const command = new PutCommand({
            TableName: TABLES.ORDERS,
            Item: {
                ...order,
                id: orderId,
                pk: `USER#${order.userId}`,
                sk: `ORDER#${orderId}`,
                createdAt: timestamp,
                updatedAt: timestamp,
            },
        });

        return await dynamoDb.send(command);
    }

    static async getUserOrders(userId: string) {
        const command = new QueryCommand({
            TableName: TABLES.ORDERS,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
            },
        });

        const result = await dynamoDb.send(command);
        return result.Items as Order[];
    }

    static async updateOrderStatus(orderId: string, userId: string, status: Order['status']) {
        const command = new PutCommand({
            TableName: TABLES.ORDERS,
            Item: {
                pk: `USER#${userId}`,
                sk: `ORDER#${orderId}`,
                status,
                updatedAt: new Date().toISOString(),
            },
        });

        return await dynamoDb.send(command);
    }

    static async adminUpdateOrderStatus(orderId: string, status: Order['status']) {
        // First, get the existing order to preserve all fields
        const getCommand = new QueryCommand({
            TableName: TABLES.ORDERS,
            IndexName: 'OrderIdIndex', // You'll need to create this GSI
            KeyConditionExpression: 'sk = :sk',
            ExpressionAttributeValues: {
                ':sk': `ORDER#${orderId}`,
            },
        });

        const response = await dynamoDb.send(getCommand);
        const existingOrder = response.Items?.[0];

        if (!existingOrder) {
            throw new Error('Order not found');
        }

        // Update the order with new status while preserving other fields
        const updateCommand = new PutCommand({
            TableName: TABLES.ORDERS,
            Item: {
                ...existingOrder,
                status,
                updatedAt: new Date().toISOString(),
            },
        });

        return await dynamoDb.send(updateCommand);
    }

    static async addTrackingInfo(orderId: string, trackingNumber: string, carrier: string) {
        const command = new UpdateCommand({
            TableName: TABLES.ORDERS,
            Key: {
                pk: `ORDER#${orderId}`,
                sk: `ORDER#${orderId}`,
            },
            UpdateExpression: 'SET tracking = :tracking, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':tracking': { trackingNumber, carrier },
                ':updatedAt': new Date().toISOString(),
            },
        });

        return await dynamoDb.send(command);
    }

    static async getAllOrders() {
        const command = new ScanCommand({
            TableName: TABLES.ORDERS,
            // Removed ScanIndexForward as it's not a valid property for ScanCommand
        });

        const result = await dynamoDb.send(command);
        return result.Items as Order[];
    }
}
