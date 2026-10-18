import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { ProductService } from '@/lib/services/productService';

export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const categories = await ProductService.listAllCategories();
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error listing categories:', error);
        return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
    }
}
