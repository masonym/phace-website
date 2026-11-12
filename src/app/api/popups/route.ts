import { NextResponse } from 'next/server';
import { PopupService } from '@/lib/services/popupService';
import { popupStatus, toPublicPopup } from '@/lib/utils/popups';

export const dynamic = 'force-dynamic';

/**
 * Popups the site may show: switched on and not yet ended. Scheduled ones are included
 * so the browser can start showing them on time even from a cached response.
 */
export async function GET() {
    try {
        const popups = (await PopupService.list())
            .filter((popup) => popup.isActive && popupStatus(popup) !== 'ended')
            .map(toPublicPopup);

        return NextResponse.json(popups, {
            headers: {
                // Every page view asks for this, so let the CDN answer; admin edits show up within a minute
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Error loading public popups:', error);
        return NextResponse.json([], { status: 500 });
    }
}
