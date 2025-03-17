import { NextResponse } from 'next/server';
import { SquareBookingService } from '@/lib/services/squareBookingService';
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Create a verifier that expects valid ID tokens
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    // Get all staff members from Square
    const staffMembers = await SquareBookingService.getStaffMembers();

    // Filter staff by service if serviceId is provided
    let filteredStaff = staffMembers;
    if (serviceId) {
      // Since we don't have a direct service-to-staff mapping in Square,
      // we'll just return all active staff for now
      filteredStaff = staffMembers.filter(staff => staff.isActive);
    }

    // Use a custom replacer function to handle BigInt values
    const safeJson = JSON.stringify(filteredStaff, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });

    return new NextResponse(safeJson, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);

    const errorResponse = {
      error: error instanceof Error ? error.message : 'Failed to fetch staff'
    };

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
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

    // Return message about using Square Dashboard
    return NextResponse.json(
      {
        message: 'Staff members should be created through the Square Dashboard. They will automatically be available in the API.'
      },
      { status: 400 }
    );
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

    // Return message about using Square Dashboard
    return NextResponse.json(
      {
        message: 'Staff member updates should be done through the Square Dashboard. The changes will automatically be reflected in the API.'
      },
      { status: 400 }
    );
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
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    try {
      const token = authHeader.split(' ')[1];
      await verifier.verify(token);
    } catch (err) {
      console.error('Token verification failed:', err);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Return message about using Square Dashboard
    return NextResponse.json(
      {
        message: 'Staff members should be managed through the Square Dashboard. The changes will automatically be reflected in the API.'
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({
      error: error.message || 'Failed to delete staff member',
      details: error
    }, { status: 500 });
  }
}
