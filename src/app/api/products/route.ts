import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';

// The Square SDK uses fetch, which Next caches by default; product data must always be current
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const products = await ProductService.listProducts(category || undefined);
        const stringified = ProductService.safeStringify(products); // Returns a string; necessary because of bigint
        const parsedProducts = JSON.parse(stringified); // Convert back to object/array
        return NextResponse.json(parsedProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        return NextResponse.json(
            { error: 'Failed to load products' },
            { status: 500 }
        );
    }
}
