import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const dynamoDb = DynamoDBDocumentClient.from(ddbClient);
const ADMIN_TABLE = 'phace-admin-users';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

interface AdminUser {
    email: string;
    name: string;
    role: 'admin' | 'super_admin';
    passwordHash: string;
}

export class AdminService {
    static async createAdmin(email: string, password: string, name: string, role: AdminUser['role'] = 'admin') {
        const passwordHash = await hash(password, 10);

        const command = new PutCommand({
            TableName: ADMIN_TABLE,
            Item: {
                pk: `ADMIN#${email}`,
                sk: `ADMIN#${email}`,
                email,
                name,
                role,
                passwordHash,
                createdAt: new Date().toISOString(),
            },
            ConditionExpression: 'attribute_not_exists(pk)', // Ensure email doesn't exist
        });

        await dynamoDb.send(command);
    }

    static async verifyAdmin(email: string, password: string) {
        const command = new GetCommand({
            TableName: ADMIN_TABLE,
            Key: {
                pk: `ADMIN#${email}`,
                sk: `ADMIN#${email}`,
            },
        });

        const response = await dynamoDb.send(command);
        const admin = response.Item;

        if (!admin) {
            throw new Error('Admin not found');
        }

        const isValid = await compare(password, admin.passwordHash);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        // Generate JWT token
        const token = sign(
            {
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            admin: {
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        };
    }

    static async verifyToken(token: string) {
        try {
            const decoded = verify(token, JWT_SECRET) as {
                email: string;
                name: string;
                role: AdminUser['role'];
            };
            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    static async getAllAdmins() {
        const command = new QueryCommand({
            TableName: ADMIN_TABLE,
            KeyConditionExpression: 'begins_with(pk, :pk)',
            ExpressionAttributeValues: {
                ':pk': 'ADMIN#',
            },
        });

        const response = await dynamoDb.send(command);
        return response.Items?.map(item => ({
            email: item.email,
            name: item.name,
            role: item.role,
        }));
    }

    static async updateAdminRole(email: string, role: AdminUser['role']) {
        const command = new PutCommand({
            TableName: ADMIN_TABLE,
            Item: {
                pk: `ADMIN#${email}`,
                sk: `ADMIN#${email}`,
                role,
            },
        });

        await dynamoDb.send(command);
    }
}
