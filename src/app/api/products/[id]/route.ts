import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const product = await ProductService.getProduct(params.id);
        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(product);
    } catch (error) {
        console.error('Error getting product:', error);
        return NextResponse.json(
            { error: 'Failed to get product' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const productData = await request.json();
        const updatedProduct = await ProductService.updateProduct(params.id, productData);
        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await ProductService.deleteProduct(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}
