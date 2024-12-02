import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });

async function createProductsTable() {
    const command = new CreateTableCommand({
        TableName: 'phace-products',
        AttributeDefinitions: [
            { AttributeName: 'pk', AttributeType: 'S' },
            { AttributeName: 'sk', AttributeType: 'S' },
            { AttributeName: 'category', AttributeType: 'S' },
        ],
        KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },
            { AttributeName: 'sk', KeyType: 'RANGE' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'CategoryIndex',
                KeySchema: [
                    { AttributeName: 'category', KeyType: 'HASH' },
                ],
                Projection: {
                    ProjectionType: 'ALL',
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    });

    try {
        const response = await ddbClient.send(command);
        console.log('Products table created successfully:', response);
    } catch (error) {
        if ((error as any).name === 'ResourceInUseException') {
            console.log('Table already exists');
        } else {
            console.error('Error creating table:', error);
            throw error;
        }
    }
}

// Run the script
createProductsTable();
