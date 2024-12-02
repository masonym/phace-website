const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Configure AWS SDK
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const dynamoDb = DynamoDBDocumentClient.from(ddbClient);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptUser(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer: string) => {
            resolve(answer);
        });
    });
}

async function createAdminUser() {
    try {
        console.log('Create a new admin user');
        
        const email = await promptUser('Enter admin email: ');
        const password = await promptUser('Enter admin password: ');
        const name = await promptUser('Enter admin name: ');
        const role = (await promptUser('Enter admin role (admin/super_admin) [default: admin]: ')) || 'admin';

        // Validate role
        const validRoles = ['admin', 'super_admin'];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Prepare DynamoDB item
        const command = new PutCommand({
            TableName: 'phace-admin-users',
            Item: {
                pk: `ADMIN#${email}`,
                sk: `ADMIN#${email}`,
                email,
                name,
                role,
                passwordHash,
                createdAt: new Date().toISOString(),
            },
            ConditionExpression: 'attribute_not_exists(pk)', // Prevent overwriting existing admin
        });

        // Save to DynamoDB
        await dynamoDb.send(command);
        
        console.log(`Admin user ${email} created successfully!`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error creating admin user:', error.message);
        } else {
            console.error('An unknown error occurred', error);
        }
    } finally {
        rl.close();
    }
}

// Run the script
createAdminUser();
