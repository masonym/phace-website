import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
    DynamoDBDocumentClient, 
    GetCommand,
    QueryCommand,
    PutCommand,
    DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    tokenUse: 'id',
});

// GET /api/booking/consent-forms?serviceId={serviceId}
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');

        const command = new QueryCommand({
            TableName: 'phace-forms',
            KeyConditionExpression: 'pk = :pk',
            FilterExpression: 'contains(serviceIds, :serviceId) and isActive = :isActive',
            ExpressionAttributeValues: {
                ':pk': 'CONSENT_FORM',
                ':serviceId': serviceId,
                ':isActive': true
            },
            ProjectionExpression: 'sk, title, content, serviceIds, isActive, sections',
        });

        const response = await docClient.send(command);
        const forms = response.Items?.map(item => ({
            id: item.sk,
            title: item.title,
            content: item.content,
            serviceIds: item.serviceIds,
            isActive: item.isActive,
            sections: item.sections,
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
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        try {
            await verifier.verify(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        const data = await request.json();
        const formId = uuidv4();

        const command = new PutCommand({
            TableName: 'phace-forms',
            Item: {
                pk: 'CONSENT_FORM',
                sk: formId,
                title: data.title,
                content: data.content,
                serviceIds: data.serviceIds,
                sections: data.sections,
                isActive: data.isActive ?? true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        });

        await docClient.send(command);

        return NextResponse.json({
            id: formId,
            ...data,
        });
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
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        try {
            await verifier.verify(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        const data = await request.json();
        if (!data.id) {
            return NextResponse.json(
                { error: 'Form ID is required' },
                { status: 400 }
            );
        }

        const command = new PutCommand({
            TableName: 'phace-forms',
            Item: {
                pk: 'CONSENT_FORM',
                sk: data.id,
                title: data.title,
                content: data.content,
                serviceIds: data.serviceIds,
                sections: data.sections,
                isActive: data.isActive,
                updatedAt: new Date().toISOString(),
            },
        });

        await docClient.send(command);

        return NextResponse.json(data);
    } catch (error) {
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
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        try {
            await verifier.verify(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

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
