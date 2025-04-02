import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryIdsParam = searchParams.get('categoryIds');

        if (!categoryIdsParam) {
            return NextResponse.json(
                { error: 'categoryIds query parameter is required' },
                { status: 400 }
            );
        }

        // Split the comma-separated string into an array
        const categoryIds = categoryIdsParam.split(',');

        const categories = await ProductService.getCategories(categoryIds);

        const stringified = ProductService.safeStringify(categories);
        const parsedCategories = JSON.parse(stringified);
        return NextResponse.json(parsedCategories);
    } catch (error) {
        console.error('Error loading categories:', error);
        return NextResponse.json(
            { error: 'Failed to load categories' },
            { status: 500 }
        );
    }
}
