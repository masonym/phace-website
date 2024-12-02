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

export async function PUT(request: Request) {
    try {
        const productId = request.url.split('/').pop(); // Extract product ID from URL
        const productData = await request.json();

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        const updatedProduct = await ProductService.updateProduct(productId, productData);
        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        );
    }
}
