import { randomUUID } from 'crypto';
import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '@/lib/aws-config';
import type { Popup, PopupFields } from '@/lib/utils/popups';

// Shares the consent forms table; popups live in their own partition, keyed by popup id
const TABLE = 'phace-forms';
const PK = 'POPUP';

function fromItem({ pk, sk, ...item }: Record<string, any>): Popup {
    return { ...item, id: sk, bullets: item.bullets ?? [] } as Popup;
}

function toItem(id: string, fields: PopupFields, createdAt: string): Record<string, unknown> {
    const item: Record<string, unknown> = {
        pk: PK,
        sk: id,
        ...fields,
        createdAt,
        updatedAt: new Date().toISOString(),
    };
    // The document client rejects undefined attributes, so drop unset optional fields
    Object.keys(item).forEach((key) => item[key] === undefined && delete item[key]);
    return item;
}

export class PopupService {
    static async list(): Promise<Popup[]> {
        const popups: Popup[] = [];
        let lastKey: Record<string, any> | undefined;
        do {
            const result = await dynamoDb.send(new QueryCommand({
                TableName: TABLE,
                KeyConditionExpression: 'pk = :pk',
                ExpressionAttributeValues: { ':pk': PK },
                ExclusiveStartKey: lastKey,
            }));
            popups.push(...(result.Items ?? []).map(fromItem));
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);

        return popups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    static async create(fields: PopupFields): Promise<Popup> {
        const now = new Date().toISOString();
        const item = toItem(randomUUID(), fields, now);
        await dynamoDb.send(new PutCommand({
            TableName: TABLE,
            Item: item,
            ConditionExpression: 'attribute_not_exists(pk)',
        }));
        return fromItem(item);
    }

    /** Replaces a popup's editable fields. Returns null if it doesn't exist. */
    static async update(id: string, fields: PopupFields): Promise<Popup | null> {
        const existing = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { pk: PK, sk: id } }));
        if (!existing.Item) return null;

        const item = toItem(id, fields, existing.Item.createdAt);
        try {
            await dynamoDb.send(new PutCommand({
                TableName: TABLE,
                Item: item,
                ConditionExpression: 'attribute_exists(pk)',
            }));
        } catch (error: any) {
            // Deleted between the read and the write
            if (error?.name === 'ConditionalCheckFailedException') return null;
            throw error;
        }
        return fromItem(item);
    }

    /** Returns false if the popup doesn't exist */
    static async remove(id: string): Promise<boolean> {
        try {
            await dynamoDb.send(new DeleteCommand({
                TableName: TABLE,
                Key: { pk: PK, sk: id },
                ConditionExpression: 'attribute_exists(pk)',
            }));
            return true;
        } catch (error: any) {
            if (error?.name === 'ConditionalCheckFailedException') return false;
            throw error;
        }
    }
}
