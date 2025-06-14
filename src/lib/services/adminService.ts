import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { compare, hash } from 'bcryptjs';
import { CognitoJwtVerifier } from "aws-jwt-verify";

const ddbClient = new DynamoDBClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    region: process.env.AWS_REGION!,
});

const dynamoDb = DynamoDBDocumentClient.from(ddbClient);
const ADMIN_TABLE = 'phace-admin-users';

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

        return {
            admin: {
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        };
    }

    static async verifyToken(token: string) {
        try {
            // Create a verifier that expects valid access tokens:
            const verifier = CognitoJwtVerifier.create({
                userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
                tokenUse: "id",
                clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
            });

            // Verify the token
            const payload = await verifier.verify(token);
            return payload;
        } catch (error) {
            console.error('Token verification failed:', error);
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
        })) || [];
    }

    static async getAdmin(email: string): Promise<AdminUser | null> {
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
            return null;
        }

        return {
            email: admin.email,
            name: admin.name,
            role: admin.role,
            passwordHash: admin.passwordHash,
        };
    }

    static async updateAdminRole(email: string, role: AdminUser['role']) {
        const command = new PutCommand({
            TableName: ADMIN_TABLE,
            Item: {
                pk: `ADMIN#${email}`,
                sk: `ADMIN#${email}`,
                role,
                updatedAt: new Date().toISOString(),
            },
            ConditionExpression: 'attribute_exists(pk)', // Ensure admin exists
        });

        await dynamoDb.send(command);
    }
}
