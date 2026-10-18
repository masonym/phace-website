import { NextResponse } from 'next/server';
import { SquareBookingService } from "@/lib/services/squareBookingService";
import { getAllowedAddonIds } from "@/lib/config/addonConfig";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');
        
        // Get all addons first
        const allAddons = await SquareBookingService.getAllAddons();
        
        // If no serviceId is provided, return all addons
        if (!serviceId) {
            return NextResponse.json(allAddons);
        }
        
        // Get service to check its category
        const service = await SquareBookingService.getServiceById(serviceId);
        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }
        const allowedIds = getAllowedAddonIds(service, allAddons.map(addon => addon.id));
        return NextResponse.json(allAddons.filter(addon => allowedIds.includes(addon.id)));
    } catch (error: any) {
        console.error('Error fetching addons:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch addons' },
            { status: 500 }
        );
    }
}
