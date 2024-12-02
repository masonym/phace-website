import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, TABLES } from "../aws-config";
import { Product } from "@/types/product";

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
            KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'ORDER#',
            },
        });

        const response = await dynamoDb.send(command);
        return response.Items as Order[];
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
}
