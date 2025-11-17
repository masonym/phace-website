'use client';

import { useState } from 'react';
import GiftCardLightbox from './GiftCardLightbox';

export default function GiftCardPromoButton() {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsLightboxOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 text-white font-medium py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
                <span className="text-xl">🎄</span>
                <span>Holiday Gift Card Special</span>
                <span className="text-xl">🎁</span>
            </button>

            <GiftCardLightbox 
                isOpen={isLightboxOpen} 
                onClose={() => setIsLightboxOpen(false)} 
            />
        </>
    );
}
