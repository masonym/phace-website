import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    tokenUse: 'id',
});

// POST /api/booking/consent-forms/responses — public, no auth required
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { formId, formTitle, clientName, clientEmail, clientPhone, responses } = data;

        if (!formId || !clientName || !clientEmail) {
            return NextResponse.json(
                { error: 'formId, clientName, and clientEmail are required' },
                { status: 400 }
            );
        }

        const responseId = uuidv4();
        const submittedAt = new Date().toISOString();

        await docClient.send(new PutCommand({
            TableName: 'phace-forms',
            Item: {
                pk: 'ADHOC_CONSENT_RESPONSE',
                sk: responseId,
                formId,
                formTitle: formTitle || '',
                clientName,
                clientEmail,
                clientPhone: clientPhone || '',
                responses: responses || [],
                submittedAt,
            },
        }));

        return NextResponse.json({ id: responseId, submittedAt }, { status: 201 });
    } catch (error) {
        console.error('Error saving ad-hoc consent form response:', error);
        return NextResponse.json(
            { error: 'Failed to save response' },
            { status: 500 }
        );
    }
}

// GET /api/booking/consent-forms/responses — admin auth required
// Query params: ?formId={formId} (optional filter)
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        try {
            await verifier.verify(token);
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const formId = searchParams.get('formId');

        const queryParams: any = {
            TableName: 'phace-forms',
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'ADHOC_CONSENT_RESPONSE',
            },
        };

        if (formId) {
            queryParams.FilterExpression = 'formId = :formId';
            queryParams.ExpressionAttributeValues[':formId'] = formId;
        }

        const response = await docClient.send(new QueryCommand(queryParams));
        const items = response.Items?.map(item => ({
            id: item.sk,
            formId: item.formId,
            formTitle: item.formTitle,
            clientName: item.clientName,
            clientEmail: item.clientEmail,
            clientPhone: item.clientPhone,
            responses: item.responses,
            submittedAt: item.submittedAt,
        })) || [];

        return NextResponse.json(items);
    } catch (error) {
        console.error('Error fetching ad-hoc consent form responses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch responses' },
            { status: 500 }
        );
    }
}
