const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

async function createAdminUsersTable() {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });

    const params = {
        TableName: 'phace-admin-users',
        KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },   // Partition key
            { AttributeName: 'sk', KeyType: 'RANGE' }   // Sort key
        ],
        AttributeDefinitions: [
            { AttributeName: 'pk', AttributeType: 'S' },
            { AttributeName: 'sk', AttributeType: 'S' },
            { AttributeName: 'role', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'RoleIndex',
                KeySchema: [
                    { AttributeName: 'role', KeyType: 'HASH' },
                    { AttributeName: 'sk', KeyType: 'RANGE' }
                ],
                Projection: {
                    ProjectionType: 'ALL'
                }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        const command = new CreateTableCommand(params);
        const response = await client.send(command);
        console.log('Admin users table created successfully:', response);
    } catch (error) {
        console.error('Error creating admin users table:', error);
    }
}

createAdminUsersTable();
