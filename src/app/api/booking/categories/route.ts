import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: "phace-services",
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "CATEGORY",
      },
    });

    const response = await docClient.send(command);
    const categories = response.Items?.map(item => ({
      id: item.SK,
      name: item.name,
      description: item.description,
      order: item.order,
      isActive: item.isActive,
      services: item.services || []
    })) || [];

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const categoryId = uuidv4();
    
    const command = new PutCommand({
      TableName: "phace-services",
      Item: {
        PK: "CATEGORY",
        SK: categoryId,
        name: body.name,
        description: body.description,
        order: body.order || 0,
        isActive: body.isActive ?? true,
        services: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return NextResponse.json({ 
      id: categoryId,
      ...body,
      services: []
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const command = new UpdateCommand({
      TableName: "phace-services",
      Key: {
        PK: "CATEGORY",
        SK: id
      },
      UpdateExpression: "set #name = :name, description = :description, #order = :order, isActive = :isActive, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name",
        "#order": "order"
      },
      ExpressionAttributeValues: {
        ":name": updateData.name,
        ":description": updateData.description,
        ":order": updateData.order || 0,
        ":isActive": updateData.isActive ?? true,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW"
    });

    const response = await docClient.send(command);
    
    return NextResponse.json(response.Attributes);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const command = new DeleteCommand({
      TableName: "phace-services",
      Key: {
        PK: "CATEGORY",
        SK: id
      }
    });

    await docClient.send(command);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
