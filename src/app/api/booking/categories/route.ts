import { NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";

// The Square SDK uses fetch, which Next caches by default; booking data must always be current
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    console.log("API Request - Fetching all categories");
    const categories = await SquareBookingService.getServiceCategories();
    console.log("Categories returned:", categories.length);

    // Use a custom replacer function to handle BigInt values
    const safeJson = JSON.stringify(categories, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value;
    });

    return new NextResponse(safeJson, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    const errorResponse = {
      error: error.message || 'An error occurred while fetching categories'
    };

    const safeJson = JSON.stringify(errorResponse, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value;
    });

    return new NextResponse(safeJson, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
