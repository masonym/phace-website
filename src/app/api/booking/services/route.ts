import { NextResponse } from 'next/server';
import { SquareBookingService } from '@/lib/services/squareBookingService';
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
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const categoryId = searchParams.get('categoryId');
        
        console.log("API Request - categoryId:", categoryId);
        
        // If categoryId is provided, only return services for that category
        if (categoryId) {
            console.log("Fetching services for category:", categoryId);
            const services = await SquareBookingService.getServicesByCategory(categoryId);
            console.log("Services returned:", services.length);
            
            // Filter out inactive services unless explicitly requested
            const filteredServices = services.filter(service => includeInactive || service.isActive);
            console.log("Filtered services:", filteredServices.length);
            
            // Create a safe-to-serialize response with a custom replacer function
            const safeResponse = [{
                id: categoryId,
                name: "Services", // This is a placeholder, the front-end already knows the category name
                services: filteredServices
            }];
            
            // Use a custom replacer function to handle BigInt values
            const safeJson = JSON.stringify(safeResponse, (key, value) => {
                if (typeof value === 'bigint') {
                    return Number(value);
                }
                return value;
            });
            
            return new NextResponse(safeJson, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        // Otherwise, get all categories but don't load services yet
        console.log("Fetching all categories");
        const categories = await SquareBookingService.getServiceCategories();
        console.log("Categories returned:", categories.length);
        
        // Return categories without services to avoid loading all services at once
        const categoriesWithoutServices = categories.map(category => ({
            ...category,
            services: [] // Empty array instead of loading all services
        }));

        // Use a custom replacer function to handle BigInt values
        const safeJson = JSON.stringify(categoriesWithoutServices, (key, value) => {
            if (typeof value === 'bigint') {
                return Number(value);
            }
            return value;
        });
        
        return new NextResponse(safeJson, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error: any) {
        console.error('Error fetching services:', error);
        const errorResponse = {
            error: error.message || 'An error occurred while fetching services'
        };
        
        const safeJson = JSON.stringify(errorResponse, (key, value) => {
            if (typeof value === 'bigint') {
                return Number(value);
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

// Note: The following PUT and POST methods would need to be implemented
// using Square's Catalog API for creating/updating services and categories.
// For now, we'll keep them as placeholders with error messages since
// these operations should be done through Square's dashboard.

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
            await verifier.verify(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        // Return message about using Square Dashboard
        return NextResponse.json(
            { 
                message: 'Service and category updates should be done through the Square Dashboard. The changes will automatically be reflected in the API.' 
            },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error updating service/category:', error);
        const errorResponse = {
            error: error.message || 'Failed to update service/category'
        };
        
        const safeJson = JSON.stringify(errorResponse, (key, value) => {
            if (typeof value === 'bigint') {
                return Number(value);
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

export async function POST(request: Request) {
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
            await verifier.verify(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        // Return message about using Square Dashboard
        return NextResponse.json(
            { 
                message: 'Services and categories should be created through the Square Dashboard. They will automatically be available in the API.' 
            },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error creating service:', error);
        const errorResponse = {
            error: error.message || 'Failed to create service'
        };
        
        const safeJson = JSON.stringify(errorResponse, (key, value) => {
            if (typeof value === 'bigint') {
                return Number(value);
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

export async function DELETE(request: Request) {
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
            await verifier.verify(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        // Return message about using Square Dashboard
        return NextResponse.json(
            { 
                message: 'Services should be deleted through the Square Dashboard. The changes will automatically be reflected in the API.' 
            },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error deleting service:', error);
        const errorResponse = {
            error: error.message || 'Failed to delete service'
        };
        
        const safeJson = JSON.stringify(errorResponse, (key, value) => {
            if (typeof value === 'bigint') {
                return Number(value);
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
