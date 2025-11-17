'use client';

import { useEffect, useState } from 'react';
import GiftCardLightbox from './GiftCardLightbox';

export default function FirstVisitGiftCard() {
    const [showLightbox, setShowLightbox] = useState(false);

    useEffect(() => {
        // Check if user should see the lightbox (once per day)
        const lastShown = localStorage.getItem('gift-card-lightbox-last-shown');
        const now = new Date().getTime();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        let shouldShow = false;
        
        if (!lastShown) {
            // Never shown before, show it
            shouldShow = true;
        } else {
            const lastShownTime = parseInt(lastShown, 10);
            // Check if it's been more than 24 hours since last shown
            if (now - lastShownTime > oneDayInMs) {
                shouldShow = true;
            }
        }
        
        if (shouldShow) {
            // Show lightbox after a short delay to allow page to load
            const timer = setTimeout(() => {
                setShowLightbox(true);
                // Update last shown timestamp
                localStorage.setItem('gift-card-lightbox-last-shown', now.toString());
            }, 2000); // 2 second delay

            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <GiftCardLightbox 
            isOpen={showLightbox} 
            onClose={() => setShowLightbox(false)} 
        />
    );
}
