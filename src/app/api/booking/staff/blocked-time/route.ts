import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ 
  region: process.env.AWS_REGION 
});
const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!staffId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const params = {
      TableName: process.env.STAFF_TABLE,
      KeyConditionExpression: 'pk = :pk AND sk BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':pk': `STAFF#${staffId}#BLOCKED`,
        ':startDate': startDate,
        ':endDate': endDate
      }
    };

    const command = new QueryCommand(params);
    const response = await docClient.send(command);

    return NextResponse.json(response.Items || []);
  } catch (error) {
    console.error('Error fetching blocked times:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked times' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      staffId,
      startTime,
      endTime,
      reason,
      recurring,
    } = body;

    const blockedTimeData = {
      pk: `STAFF#${staffId}#BLOCKED`,
      sk: startTime,
      id: uuidv4(),
      type: 'blocked_time',
      staffId,
      startTime,
      endTime,
      reason,
      ...(recurring && { recurring }),
      createdAt: new Date().toISOString(),
    };

    const params = {
      TableName: process.env.STAFF_TABLE,
      Item: blockedTimeData,
    };

    const command = new PutCommand(params);
    await docClient.send(command);

    // If this is a recurring block, create additional blocks
    if (recurring) {
      const { frequency, until } = recurring;
      const untilDate = new Date(until);
      let currentStart = new Date(startTime);
      let currentEnd = new Date(endTime);

      while (currentStart <= untilDate) {
        // Skip the first occurrence as it's already created
        if (currentStart > new Date(startTime)) {
          const recurringBlock = {
            pk: `STAFF#${staffId}#BLOCKED`,
            sk: currentStart.toISOString(),
            id: uuidv4(),
            type: 'blocked_time',
            staffId,
            startTime: currentStart.toISOString(),
            endTime: currentEnd.toISOString(),
            reason,
            recurring: { frequency, until },
            createdAt: new Date().toISOString(),
          };

          const recurringParams = {
            TableName: process.env.STAFF_TABLE,
            Item: recurringBlock,
          };

          const recurringCommand = new PutCommand(recurringParams);
          await docClient.send(recurringCommand);
        }

        // Increment dates based on frequency
        if (frequency === 'daily') {
          currentStart.setDate(currentStart.getDate() + 1);
          currentEnd.setDate(currentEnd.getDate() + 1);
        } else if (frequency === 'weekly') {
          currentStart.setDate(currentStart.getDate() + 7);
          currentEnd.setDate(currentEnd.getDate() + 7);
        }
      }
    }

    return NextResponse.json(blockedTimeData);
  } catch (error) {
    console.error('Error creating blocked time:', error);
    return NextResponse.json(
      { error: 'Failed to create blocked time' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const startTime = searchParams.get('startTime');

    if (!staffId || !startTime) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const params = {
      TableName: process.env.STAFF_TABLE,
      Key: {
        pk: `STAFF#${staffId}#BLOCKED`,
        sk: startTime,
      },
    };

    const command = new DeleteCommand(params);
    await docClient.send(command);
    return NextResponse.json({ message: 'Blocked time deleted successfully' });
  } catch (error) {
    console.error('Error deleting blocked time:', error);
    return NextResponse.json(
      { error: 'Failed to delete blocked time' },
      { status: 500 }
    );
  }
}
