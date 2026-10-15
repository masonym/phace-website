import { DeleteCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '@/lib/aws-config';

// Shares the booking waitlist table; product entries are keyed PRODUCT_WAITLIST#<productId>
const WAITLIST_TABLE = 'phace-waitlist';
const ENTRY_TYPE = 'product_waitlist';

export interface ProductWaitlistEntry {
    productId: string;
    productName: string;
    variationId?: string;
    variationName?: string;
    name?: string;
    email: string;
    createdAt: string;
}

const keyFor = (productId: string, email: string) => ({
    pk: `PRODUCT_WAITLIST#${productId}`,
    sk: `EMAIL#${email.toLowerCase()}`,
});

export class ProductWaitlistService {
    /**
     * Adds a signup. Returns false if this email is already on the waitlist for the product.
     */
    static async add(entry: Omit<ProductWaitlistEntry, 'createdAt'>): Promise<boolean> {
        try {
            await dynamoDb.send(new PutCommand({
                TableName: WAITLIST_TABLE,
                Item: {
                    ...keyFor(entry.productId, entry.email),
                    type: ENTRY_TYPE,
                    ...entry,
                    createdAt: new Date().toISOString(),
                },
                ConditionExpression: 'attribute_not_exists(pk)',
            }));
            return true;
        } catch (error: any) {
            if (error?.name === 'ConditionalCheckFailedException') return false;
            throw error;
        }
    }

    static async list(): Promise<ProductWaitlistEntry[]> {
        const entries: ProductWaitlistEntry[] = [];
        let lastKey: Record<string, any> | undefined;
        do {
            const result = await dynamoDb.send(new ScanCommand({
                TableName: WAITLIST_TABLE,
                FilterExpression: '#type = :type',
                ExpressionAttributeNames: { '#type': 'type' },
                ExpressionAttributeValues: { ':type': ENTRY_TYPE },
                ExclusiveStartKey: lastKey,
            }));
            for (const item of result.Items ?? []) {
                entries.push({
                    productId: item.productId,
                    productName: item.productName,
                    variationId: item.variationId,
                    variationName: item.variationName,
                    name: item.name,
                    email: item.email,
                    createdAt: item.createdAt,
                });
            }
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);

        return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    static async remove(productId: string, email: string): Promise<void> {
        await dynamoDb.send(new DeleteCommand({
            TableName: WAITLIST_TABLE,
            Key: keyFor(productId, email),
        }));
    }
}
