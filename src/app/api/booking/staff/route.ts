import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDB({
  region: process.env.AWS_REGION,
});

const docClient = DynamoDBDocumentClient.from(client);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export async function GET() {
  try {
    const params = {
      TableName: process.env.STAFF_TABLE!,
    };

    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    return NextResponse.json(result.Items);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = uuidv4();
    
    // Handle image upload if present
    let imageUrl;
    const imageFile = formData.get('image') as File;
    if (imageFile) {
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
      id,
      name: formData.get('name'),
      email: formData.get('email'),
      bio: formData.get('bio'),
      image: imageUrl,
      services: JSON.parse(formData.get('services') as string),
      defaultAvailability: JSON.parse(formData.get('defaultAvailability') as string),
      isActive: formData.get('isActive') === 'true',
    };

    const params = {
      TableName: process.env.STAFF_TABLE!,
      Item: staffData,
    };

    const putCommand = new PutCommand(params);
    await docClient.send(putCommand);
    return NextResponse.json(staffData);
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    
    // Handle image upload if present
    let imageUrl;
    const imageFile = formData.get('image') as File;
    if (imageFile) {
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
      id,
      name: formData.get('name'),
      email: formData.get('email'),
      bio: formData.get('bio'),
      ...(imageUrl && { image: imageUrl }),
      services: JSON.parse(formData.get('services') as string),
      defaultAvailability: JSON.parse(formData.get('defaultAvailability') as string),
      isActive: formData.get('isActive') === 'true',
    };

    const params = {
      TableName: process.env.STAFF_TABLE!,
      Item: staffData,
    };

    const putCommand = new PutCommand(params);
    await docClient.send(putCommand);
    return NextResponse.json(staffData);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}
