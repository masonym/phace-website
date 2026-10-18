import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
    DynamoDBDocumentClient, 
    GetCommand,
    QueryCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});
// Forms built in the admin have no legacy `content`; without this, the undefined field makes every write throw
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: { removeUndefinedValues: true },
});

// GET /api/booking/consent-forms?id={formId} — fetch single form by ID (public, no auth)
// GET /api/booking/consent-forms?serviceId={serviceId} — fetch forms for a service
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const serviceId = searchParams.get('serviceId');

        // Fetch a single form by ID
        if (id) {
            const command = new GetCommand({
                TableName: 'phace-forms',
                Key: { pk: 'CONSENT_FORM', sk: id },
            });
            const response = await docClient.send(command);
            if (!response.Item) {
                return NextResponse.json({ error: 'Form not found' }, { status: 404 });
            }
            return NextResponse.json({
                id: response.Item.sk,
                title: response.Item.title,
                content: response.Item.content,
                serviceIds: response.Item.serviceIds,
                isActive: response.Item.isActive,
                sections: response.Item.sections,
                version: response.Item.version,
            });
        }

        // Base query parameters
        let queryParams: any = {
            TableName: 'phace-forms',
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'CONSENT_FORM',
            },
            ProjectionExpression: 'sk, title, content, serviceIds, isActive, sections, version, createdAt, updatedAt',
        };

        // Add service-specific filtering only if serviceId is provided
        if (serviceId) {
            queryParams.FilterExpression = 'contains(serviceIds, :serviceId) and isActive = :isActive';
            queryParams.ExpressionAttributeValues[':serviceId'] = serviceId;
            queryParams.ExpressionAttributeValues[':isActive'] = true;
        }

        const command = new QueryCommand(queryParams);
        const response = await docClient.send(command);
        const forms = response.Items?.map(item => ({
            id: item.sk,
            title: item.title,
            content: item.content,
            serviceIds: item.serviceIds,
            isActive: item.isActive,
            sections: item.sections,
            version: item.version ?? 1,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        })) || [];

        return NextResponse.json(forms);
    } catch (error) {
        console.error('Error fetching consent forms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch consent forms' },
            { status: 500 }
        );
    }
}

// POST /api/booking/consent-forms
export async function POST(request: NextRequest) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const data = await request.json();
        const now = new Date().toISOString();
        const item = {
            id: uuidv4(),
            title: data.title,
            content: data.content,
            serviceIds: data.serviceIds || [],
            sections: data.sections || [],
            isActive: data.isActive ?? true,
            version: 1,
            createdAt: now,
            updatedAt: now,
        };

        const { id, ...fields } = item;
        await docClient.send(new PutCommand({
            TableName: 'phace-forms',
            Item: { pk: 'CONSENT_FORM', sk: id, ...fields },
        }));

        return NextResponse.json(item);
    } catch (error) {
        console.error('Error creating consent form:', error);
        return NextResponse.json(
            { error: 'Failed to create consent form' },
            { status: 500 }
        );
    }
}

// PUT /api/booking/consent-forms
export async function PUT(request: NextRequest) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const data = await request.json();
        if (!data.id) {
            return NextResponse.json(
                { error: 'Form ID is required' },
                { status: 400 }
            );
        }

        // Update in place so createdAt survives; each save bumps the version
        const result = await docClient.send(new UpdateCommand({
            TableName: 'phace-forms',
            Key: { pk: 'CONSENT_FORM', sk: data.id },
            ConditionExpression: 'attribute_exists(pk)',
            UpdateExpression: 'SET title = :title, serviceIds = :serviceIds, sections = :sections, isActive = :isActive, updatedAt = :now, version = if_not_exists(version, :zero) + :one',
            ExpressionAttributeValues: {
                ':title': data.title,
                ':serviceIds': data.serviceIds || [],
                ':sections': data.sections || [],
                ':isActive': data.isActive ?? true,
                ':now': new Date().toISOString(),
                ':zero': 0,
                ':one': 1,
            },
            ReturnValues: 'ALL_NEW',
        }));

        const item = result.Attributes!;
        return NextResponse.json({
            id: item.sk,
            title: item.title,
            content: item.content,
            serviceIds: item.serviceIds,
            sections: item.sections,
            isActive: item.isActive,
            version: item.version,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        });
    } catch (error: any) {
        if (error?.name === 'ConditionalCheckFailedException') {
            return NextResponse.json({ error: 'This form no longer exists' }, { status: 404 });
        }
        console.error('Error updating consent form:', error);
        return NextResponse.json(
            { error: 'Failed to update consent form' },
            { status: 500 }
        );
    }
}

// DELETE /api/booking/consent-forms?id={formId}
export async function DELETE(request: NextRequest) {
    try {
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const { searchParams } = new URL(request.url);
        const formId = searchParams.get('id');

        if (!formId) {
            return NextResponse.json(
                { error: 'Form ID is required' },
                { status: 400 }
            );
        }

        const command = new DeleteCommand({
            TableName: 'phace-forms',
            Key: {
                pk: 'CONSENT_FORM',
                sk: formId,
            },
        });

        await docClient.send(command);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting consent form:', error);
        return NextResponse.json(
            { error: 'Failed to delete consent form' },
            { status: 500 }
        );
    }
}
