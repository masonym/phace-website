import { App, Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class PhaceStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create S3 bucket for product images
        const productImagesBucket = new s3.Bucket(this, 'ProductImagesBucket', {
            bucketName: 'phace-product-images',
            publicReadAccess: true,
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false
            }),
            cors: [
                {
                    allowedHeaders: ['*'],
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD,
                    ],
                    allowedOrigins: [
                        'http://localhost:3001',
                        'https://phace.ca',
                        'https://www.phace.ca'
                    ],
                    exposedHeaders: ['ETag'],
                },
            ],
            removalPolicy: RemovalPolicy.RETAIN,
        });

        // Output the bucket name
        new CfnOutput(this, 'ProductImagesBucketName', {
            value: productImagesBucket.bucketName,
            description: 'Name of the S3 bucket for product images',
        });

        // Create DynamoDB Tables
        const productsTable = new dynamodb.Table(this, 'ProductsTable', {
            tableName: 'phace-products',
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.RETAIN,
        });

        productsTable.addGlobalSecondaryIndex({
            indexName: 'CategoryIndex',
            partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
        });

        const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
            tableName: 'phace-orders',
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.RETAIN,
        });

        // Add admin users table
        const adminUsersTable = new dynamodb.Table(this, 'AdminUsersTable', {
            tableName: 'phace-admin-users',
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.RETAIN,
        });

        // Add GSI for role-based queries
        adminUsersTable.addGlobalSecondaryIndex({
            indexName: 'RoleIndex',
            partitionKey: { name: 'role', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'email', type: dynamodb.AttributeType.STRING },
        });

        // Create Cognito User Pool
        const userPool = new cognito.UserPool(this, 'PhaceUserPool', {
            userPoolName: 'phace-user-pool',
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
                fullname: {
                    required: true,
                    mutable: true,
                },
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: RemovalPolicy.RETAIN,
        });

        const userPoolClient = new cognito.UserPoolClient(this, 'PhaceUserPoolClient', {
            userPool,
            generateSecret: false,
            authFlows: {
                adminUserPassword: true,
                userPassword: true,
                custom: true,
                userSrp: true,
            },
        });

        // Output values
        new CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId,
        });

        new CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.userPoolClientId,
        });
    }
}
