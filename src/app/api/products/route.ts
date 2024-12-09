import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        
        const products = await ProductService.listProducts(category || undefined);
        return NextResponse.json(products);
    } catch (error) {
        console.error('Error loading products:', error);
        return NextResponse.json(
            { error: 'Failed to load products' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const productData = await request.json();
        await ProductService.createProduct(productData);
        return NextResponse.json(productData);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
