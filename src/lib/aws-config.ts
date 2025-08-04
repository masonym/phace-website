import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client } from '@aws-sdk/client-s3';

// AWS Region
const REGION = "us-west-2"; // Change this to your preferred region

// Initialize DynamoDB
const ddbClient = new DynamoDBClient({ region: REGION });
export const dynamoDb = DynamoDBDocumentClient.from(ddbClient);

// Initialize Cognito
export const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

// Initialize S3
export const s3Client = new S3Client({ region: REGION });

// AWS Cognito Pool configuration
export const COGNITO_CONFIG = {
    UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
};

// DynamoDB table names
export const TABLES = {
    PRODUCTS: 'phace-products',
    ORDERS: 'phace-orders',
    USERS: 'phace-users',
    COUPONS: 'phace-coupons',
};
