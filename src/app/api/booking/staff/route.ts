import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Create a verifier that expects valid ID tokens
const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    tokenUse: "id",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

const client = new DynamoDB({
  region: process.env.AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(client);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    const params = {
      TableName: process.env.STAFF_TABLE!,
      FilterExpression: 'begins_with(pk, :pk) AND attribute_exists(#n)',
      ExpressionAttributeNames: {
        '#n': 'name'
      },
      ExpressionAttributeValues: {
        ':pk': 'STAFF#',
      },
    };

    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    
    // Transform the items to match the expected format
    let transformedItems = result.Items?.filter(item => !item.pk.includes('#BLOCKED')).map(item => ({
      id: item.pk.replace('STAFF#', ''),
      name: item.name,
      email: item.email,
      bio: item.bio,
      image: item.image,
      services: item.services || [],
      defaultAvailability: item.defaultAvailability,
      isActive: item.isActive,
    })) || [];

    // Filter staff by service if serviceId is provided
    if (serviceId) {
      transformedItems = transformedItems.filter(staff => 
        staff.services.includes(serviceId) && staff.isActive
      );
    }
    
    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    try {
      const token = authHeader.split(' ')[1];
      await verifier.verify(token);
    } catch (err) {
      console.error('Token verification failed:', err);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const id = uuidv4();
    
    // Handle image upload if present
    let imageUrl;
    const imageFile = formData.get('image') as File;
    if (imageFile?.size > 0) {
      const fileExtension = imageFile.name.split('.').pop();
      const key = `staff-images/${id}.${fileExtension}`;
      
      const putObjectParams = {
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: Buffer.from(await imageFile.arrayBuffer()),
        ContentType: imageFile.type,
      };
      
      const putObjectCommand = new PutObjectCommand(putObjectParams);
      await s3Client.send(putObjectCommand);
      
      imageUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    const staffData = {
      pk: `STAFF#${id}`,
      sk: `STAFF#${id}`,
      name: formData.get('name'),
      email: formData.get('email'),
      bio: formData.get('bio') || '',
      image: imageUrl,
      services: JSON.parse(formData.get('services') as string || '[]'),
      defaultAvailability: JSON.parse(formData.get('defaultAvailability') as string || '[]'),
      isActive: formData.get('isActive') === 'true',
      type: 'STAFF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: process.env.STAFF_TABLE!,
      Item: staffData,
    };

    const putCommand = new PutCommand(params);
    await docClient.send(putCommand);

    // Return the data in the format expected by the frontend
    const responseData = {
      id,
      name: staffData.name,
      email: staffData.email,
      bio: staffData.bio,
      image: staffData.image,
      services: staffData.services,
      defaultAvailability: staffData.defaultAvailability,
      isActive: staffData.isActive,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create staff member',
      details: error
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    try {
      const token = authHeader.split(' ')[1];
      await verifier.verify(token);
    } catch (err) {
      console.error('Token verification failed:', err);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    const formData = await request.formData();
    
    // Handle image upload if present
    let imageUrl;
    const imageFile = formData.get('image') as File;
    if (imageFile?.size > 0) {
      const fileExtension = imageFile.name.split('.').pop();
      const key = `staff-images/${id}.${fileExtension}`;
      
      const putObjectParams = {
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: Buffer.from(await imageFile.arrayBuffer()),
        ContentType: imageFile.type,
      };
      
      const putObjectCommand = new PutObjectCommand(putObjectParams);
      await s3Client.send(putObjectCommand);
      
      imageUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    // First, get the existing staff data to preserve any fields not in the update
    const getParams = {
      TableName: process.env.STAFF_TABLE!,
      Key: {
        pk: `STAFF#${id}`,
        sk: `STAFF#${id}`,
      },
    };

    const getCommand = new ScanCommand({
      TableName: process.env.STAFF_TABLE!,
      FilterExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `STAFF#${id}`,
      },
    });

    const existingStaff = await docClient.send(getCommand);
    const existingData = existingStaff.Items?.[0];

    const staffData = {
      pk: `STAFF#${id}`,
      sk: `STAFF#${id}`,
      name: formData.get('name'),
      email: formData.get('email'),
      bio: formData.get('bio') || '',
      image: imageUrl || existingData?.image,
      services: JSON.parse(formData.get('services') as string || '[]'),
      defaultAvailability: JSON.parse(formData.get('defaultAvailability') as string || '[]'),
      isActive: formData.get('isActive') === 'true',
      type: 'STAFF',
      createdAt: existingData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: process.env.STAFF_TABLE!,
      Item: staffData,
    };

    const putCommand = new PutCommand(params);
    await docClient.send(putCommand);

    // Return the data in the format expected by the frontend
    const responseData = {
      id,
      name: staffData.name,
      email: staffData.email,
      bio: staffData.bio,
      image: staffData.image,
      services: staffData.services,
      defaultAvailability: staffData.defaultAvailability,
      isActive: staffData.isActive,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update staff member',
      details: error
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    try {
      await verifier.verify(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    const deleteParams = {
      TableName: process.env.STAFF_TABLE!,
      Key: {
        pk: `STAFF#${id}`,
        sk: `STAFF#${id}`,
      },
    };

    const deleteCommand = new DeleteCommand(deleteParams);
    await docClient.send(deleteCommand);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
