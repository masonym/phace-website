import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export function createBookingTables(scope: Construct) {
    // Services and Categories Table
    const servicesTable = new dynamodb.Table(scope, 'ServicesTable', {
        tableName: 'phace-services',
        partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
    });

    // Global Secondary Indexes for Services
    servicesTable.addGlobalSecondaryIndex({
        indexName: 'GSI1',
        partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // Appointments Table
    const appointmentsTable = new dynamodb.Table(scope, 'AppointmentsTable', {
        tableName: 'phace-appointments',
        partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
    });

    // GSIs for querying appointments by staff, date, and client
    appointmentsTable.addGlobalSecondaryIndex({
        indexName: 'GSI1',
        partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    appointmentsTable.addGlobalSecondaryIndex({
        indexName: 'GSI2',
        partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
    });

    // Staff Table
    const staffTable = new dynamodb.Table(scope, 'StaffTable', {
        tableName: 'phace-staff',
        partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
    });

    // Clients Table
    const clientsTable = new dynamodb.Table(scope, 'ClientsTable', {
        tableName: 'phace-clients',
        partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
    });

    // GSI for email lookups
    clientsTable.addGlobalSecondaryIndex({
        indexName: 'GSI1',
        partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // Waitlist Table
    const waitlistTable = new dynamodb.Table(scope, 'WaitlistTable', {
        tableName: 'phace-waitlist',
        partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
    });

    // Forms Table (for consent forms and intake forms)
    const formsTable = new dynamodb.Table(scope, 'FormsTable', {
        tableName: 'phace-forms',
        partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
    });

    return {
        servicesTable,
        appointmentsTable,
        staffTable,
        clientsTable,
        waitlistTable,
        formsTable,
    };
}
