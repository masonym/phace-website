import { NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";

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
                    return value.toString()
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
        categories.sort((a, b) => a.name.localeCompare(b.name)); // Sort categories by name
        console.log("Categories returned:", categories.length);

        // Return categories without services to avoid loading all services at once
        const categoriesWithoutServices = categories.map(category => ({
            ...category,
            services: [] // Empty array instead of loading all services
        }));

        // Use a custom replacer function to handle BigInt values
        const safeJson = JSON.stringify(categoriesWithoutServices, (key, value) => {
            if (typeof value === 'bigint') {
                return value.toString()
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
                return value.toString()
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
