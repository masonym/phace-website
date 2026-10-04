'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import FirstFivePresaleLightbox from './FirstFivePresaleLightbox';

// Pre-sale runs Tue Oct 6 through Sat Oct 10 at midnight, Pacific time
const PRESALE_START = new Date('2026-10-06T00:00:00-07:00').getTime();
const PRESALE_END = new Date('2026-10-11T00:00:00-07:00').getTime();

const LAST_SHOWN_KEY = 'first-five-presale-last-shown';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Don't interrupt people who are mid-booking, mid-checkout or signing in
const SUPPRESSED_PATH_PREFIXES = [
    '/admin',
    '/book',
    '/booking-confirmed',
    '/checkout',
    '/forms',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify',
];

export default function FirstFivePresale() {
    const [showLightbox, setShowLightbox] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (pathname && SUPPRESSED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

        const now = Date.now();
        // Add ?preview=presale to any page to see the popup outside the sale window
        const isPreview = new URLSearchParams(window.location.search).get('preview') === 'presale';

        if (!isPreview) {
            if (now < PRESALE_START || now >= PRESALE_END) return;

            // Show at most once per day
            try {
                const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
                if (lastShown && now - parseInt(lastShown, 10) < ONE_DAY_MS) return;
            } catch {
                // Storage unavailable, fall through and show it
            }
        }

        // Show lightbox after a short delay to allow page to load
        const timer = setTimeout(() => {
            setShowLightbox(true);
            if (!isPreview) {
                try {
                    localStorage.setItem(LAST_SHOWN_KEY, now.toString());
                } catch {
                    // Ignore storage errors
                }
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [pathname]);

    return (
        <FirstFivePresaleLightbox
            isOpen={showLightbox}
            onClose={() => setShowLightbox(false)}
        />
    );
}
