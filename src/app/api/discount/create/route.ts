import { NextRequest, NextResponse } from 'next/server';
import { SquareService } from '@/lib/services/squareService';

interface CreateDiscountRequest {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  productIds?: string[];
  expiresAt?: string;
  usageLimit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body: CreateDiscountRequest = await request.json();

    // Validate required fields
    if (!body.code || !body.name || !body.type || body.value === undefined) {
      return NextResponse.json(
        { error: 'Code, name, type, and value are required' },
        { status: 400 }
      );
    }

    // Validate value is positive
    if (body.value <= 0) {
      return NextResponse.json(
        { error: 'Value must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate percentage is not greater than 100
    if (body.type === 'PERCENTAGE' && body.value > 100) {
      return NextResponse.json(
        { error: 'Percentage cannot be greater than 100' },
        { status: 400 }
      );
    }

    // Create discount code with Square
    const discountCode = await SquareService.createDiscountCode(
      body.code,
      body.name,
      body.type,
      body.value,
      body.productIds,
      body.expiresAt,
      body.usageLimit
    );

    return NextResponse.json({
      success: true,
      discountCode
    });

  } catch (error) {
    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
