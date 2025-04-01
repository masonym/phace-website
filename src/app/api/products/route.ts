import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/productService';
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Create a verifier that expects valid ID tokens
const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    tokenUse: "id",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

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
