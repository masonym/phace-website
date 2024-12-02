import { PutCommand, GetCommand, QueryCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, TABLES } from "../aws-config";
import { Product } from "@/types/product";

export class ProductService {
    static async createProduct(product: Product) {
        const command = new PutCommand({
            TableName: TABLES.PRODUCTS,
            Item: {
                ...product,
                pk: `PRODUCT#${product.id}`,
                sk: `PRODUCT#${product.id}`,
            },
        });

        return await dynamoDb.send(command);
    }

    static async getProduct(productId: string) {
        const command = new GetCommand({
            TableName: TABLES.PRODUCTS,
            Key: {
                pk: `PRODUCT#${productId}`,
                sk: `PRODUCT#${productId}`,
            },
        });

        const response = await dynamoDb.send(command);
        return response.Item as Product;
    }

    static async listProducts(category?: string) {
        if (category) {
            const command = new QueryCommand({
                TableName: TABLES.PRODUCTS,
                IndexName: 'CategoryIndex',
                KeyConditionExpression: 'category = :category',
                ExpressionAttributeValues: {
                    ':category': category,
                },
            });
            const response = await dynamoDb.send(command);
            return response.Items as Product[];
        }

        const command = new ScanCommand({
            TableName: TABLES.PRODUCTS,
        });
        
        const response = await dynamoDb.send(command);
        return response.Items as Product[];
    }

    static async updateProduct(productId: string, updates: Partial<Product>) {
        const command = new PutCommand({
            TableName: TABLES.PRODUCTS,
            Item: {
                ...updates,
                pk: `PRODUCT#${productId}`,
                sk: `PRODUCT#${productId}`,
            },
        });

        return await dynamoDb.send(command);
    }

    static async deleteProduct(productId: string) {
        const command = new DeleteCommand({
            TableName: TABLES.PRODUCTS,
            Key: {
                pk: `PRODUCT#${productId}`,
                sk: `PRODUCT#${productId}`,
            },
        });

        return await dynamoDb.send(command);
    }
}
