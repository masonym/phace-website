import { NextRequest, NextResponse } from 'next/server';
import { UpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient } from '@/lib/aws-config';
import { cookies } from 'next/headers';

// Function to format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // For US/Canada numbers (assuming this is the primary use case)
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If the number already includes country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it's already in E.164 format (starts with +)
  if (phone.startsWith('+')) {
    return phone;
  }
  
  throw new Error('Invalid phone number format. Please enter a valid 10-digit phone number.');
}

export async function POST(request: NextRequest) {
  try {
    // Get the access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Format the phone number to E.164 format
    let formattedPhone;
    try {
      formattedPhone = formatPhoneNumber(phone);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update the user's phone number in Cognito
    const command = new UpdateUserAttributesCommand({
      AccessToken: accessToken,
      UserAttributes: [
        {
          Name: 'phone_number',
          Value: formattedPhone,
        },
      ],
    });

    await cognitoClient.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating phone number:', error);
    return NextResponse.json(
      { error: 'Failed to update phone number' },
      { status: 500 }
    );
  }
}
