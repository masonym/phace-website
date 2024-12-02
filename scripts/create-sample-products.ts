import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const dynamoDb = DynamoDBDocumentClient.from(ddbClient);

const sampleProducts = [
    {
        id: uuidv4(),
        name: 'Hydrating Face Serum',
        description: 'A deeply hydrating serum with hyaluronic acid and vitamin B5.',
        price: 49.99,
        category: 'Serums',
        sku: 'SRM-001',
        inStock: true,
        quantity: 100,
        images: []
    },
    {
        id: uuidv4(),
        name: 'Vitamin C Brightening Cream',
        description: 'Brightening face cream with 15% vitamin C and ferulic acid.',
        price: 65.00,
        category: 'Creams',
        sku: 'CRM-001',
        inStock: true,
        quantity: 75,
        images: []
    },
    {
        id: uuidv4(),
        name: 'Gentle Cleansing Foam',
        description: 'A gentle, pH-balanced foaming cleanser suitable for all skin types.',
        price: 28.00,
        category: 'Cleansers',
        sku: 'CLN-001',
        inStock: true,
        quantity: 150,
        images: []
    }
];

async function createSampleProducts() {
    for (const product of sampleProducts) {
        const command = new PutCommand({
            TableName: 'phace-products',
            Item: {
                pk: `PRODUCT#${product.id}`,
                sk: `PRODUCT#${product.id}`,
                ...product,
            },
        });

        try {
            await dynamoDb.send(command);
            console.log(`Created product: ${product.name}`);
        } catch (error) {
            console.error(`Error creating product ${product.name}:`, error);
        }
    }
}

// Run the script
createSampleProducts();
