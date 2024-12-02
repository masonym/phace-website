import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';
import { AdminService } from '@/lib/services/adminService';

export async function GET() {
    try {
        const products = await ProductService.listProducts();
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
        const newProduct = await ProductService.createProduct(productData);
        
        return NextResponse.json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
