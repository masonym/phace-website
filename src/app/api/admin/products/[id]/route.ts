import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';
import { AdminService } from '@/lib/services/adminService';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin token
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authorization header missing' },
                { status: 401 }
            );
        }
        
        const token = authHeader.replace('Bearer ', '');
        try {
            await AdminService.verifyToken(token);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

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
    if (!params?.id) {
        return NextResponse.json(
            { error: 'Product ID is required' },
            { status: 400 }
        );
    }

    try {
        // Verify admin token
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authorization header missing' },
                { status: 401 }
            );
        }
        
        const token = authHeader.replace('Bearer ', '');
        try {
            await AdminService.verifyToken(token);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        console.log('Deleting product with ID:', params.id); 
        await ProductService.deleteProduct(params.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete product' },
            { status: 500 }
        );
    }
}
