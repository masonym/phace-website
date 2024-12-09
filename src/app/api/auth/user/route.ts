import { NextRequest, NextResponse } from 'next/server';
import { GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient } from '@/lib/aws-config';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the latest user data from Cognito
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const userData = await cognitoClient.send(command);
    
    // Convert the Cognito attributes to a user object
    const user = userData.UserAttributes?.reduce((acc: any, attr) => {
      if (attr.Name && attr.Value) {
        // Map Cognito attribute names to our user object properties
        switch (attr.Name) {
          case 'phone_number':
            acc.phone = attr.Value;
            break;
          case 'email':
            acc.email = attr.Value;
            break;
          case 'name':
            acc.name = attr.Value;
            break;
          case 'sub':
            acc.sub = attr.Value;
            break;
          default:
            // Store other attributes as is
            acc[attr.Name] = attr.Value;
        }
      }
      return acc;
    }, {});

    // Update the user state with the new data
    return NextResponse.json({
      user,
      token: request.cookies.get('idToken')?.value
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}
