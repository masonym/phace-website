import { dynamoDb, TABLES } from '@/lib/aws-config';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Simple coupon system that works alongside Square
interface SimpleCoupon {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  isActive: boolean;
  expiresAt?: Date;
  usageLimit?: number;
  currentUsage: number;
  createdAt: Date;
}

export class SimpleCouponService {
  static async validateCoupon(code: string): Promise<SimpleCoupon | null> {
    try {
      const result = await dynamoDb.send(new GetCommand({
        TableName: TABLES.COUPONS,
        Key: { code: code.toUpperCase() }
      }));

      if (!result.Item) return null;

      const coupon = {
        ...result.Item,
        createdAt: new Date(result.Item.createdAt),
        expiresAt: result.Item.expiresAt ? new Date(result.Item.expiresAt) : undefined,
      } as SimpleCoupon;

      if (!coupon.isActive) return null;
      if (coupon.expiresAt && coupon.expiresAt < new Date()) return null;
      if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) return null;

      return coupon;
    } catch (error) {
      console.error('Error validating coupon:', error);
      return null;
    }
  }

  static async applyCoupon(code: string): Promise<boolean> {
    try {
      const result = await dynamoDb.send(new UpdateCommand({
        TableName: TABLES.COUPONS,
        Key: { code: code.toUpperCase() },
        UpdateExpression: 'SET currentUsage = currentUsage + :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        },
        ConditionExpression: 'attribute_exists(code)',
        ReturnValues: 'UPDATED_NEW'
      }));

      return !!result.Attributes;
    } catch (error) {
      console.error('Error applying coupon:', error);
      return false;
    }
  }

  static calculateDiscount(coupon: SimpleCoupon, cartTotal: number): number {
    if (coupon.type === 'PERCENTAGE') {
      return cartTotal * (coupon.value / 100);
    } else {
      return Math.min(coupon.value, cartTotal);
    }
  }

  static async createCoupon(couponData: Omit<SimpleCoupon, 'currentUsage' | 'createdAt'>): Promise<boolean> {
    try {
      await dynamoDb.send(new PutCommand({
        TableName: TABLES.COUPONS,
        Item: {
          ...couponData,
          code: couponData.code.toUpperCase(),
          currentUsage: 0,
          createdAt: new Date().toISOString(),
          expiresAt: couponData.expiresAt?.toISOString(),
        },
        ConditionExpression: 'attribute_not_exists(code)' // Prevent overwriting existing coupons
      }));
      return true;
    } catch (error) {
      console.error('Error creating coupon:', error);
      return false;
    }
  }

  static async listCoupons(): Promise<SimpleCoupon[]> {
    try {

      const result = await dynamoDb.send(new ScanCommand({
        TableName: TABLES.COUPONS
      }));

      return (result.Items || []).map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
      })) as SimpleCoupon[];
    } catch (error) {
      console.error('Error listing coupons:', error);
      return [];
    }
  }

  static async deleteCoupon(code: string): Promise<boolean> {
    try {
      await dynamoDb.send(new DeleteCommand({
        TableName: TABLES.COUPONS,
        Key: { code: code.toUpperCase() },
        ConditionExpression: 'attribute_exists(code)'
      }));
      return true;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return false;
    }
  }

  static async updateCoupon(code: string, updates: Partial<Omit<SimpleCoupon, 'code' | 'createdAt'>>): Promise<boolean> {
    try {
      const updateExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      Object.entries(updates).forEach(([key, value], index) => {
        if (key === 'expiresAt' && value instanceof Date) {
          updateExpressions.push(`#${key} = :val${index}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:val${index}`] = value.toISOString();
        } else if (value !== undefined) {
          updateExpressions.push(`#${key} = :val${index}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:val${index}`] = value;
        }
      });

      if (updateExpressions.length === 0) return false;

      await dynamoDb.send(new UpdateCommand({
        TableName: TABLES.COUPONS,
        Key: { code: code.toUpperCase() },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(code)'
      }));
      return true;
    } catch (error) {
      console.error('Error updating coupon:', error);
      return false;
    }
  }
}
