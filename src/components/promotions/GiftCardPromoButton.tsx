'use client';

import { useState } from 'react';
import GiftCardLightbox from './GiftCardLightbox';

export default function GiftCardPromoButton() {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsLightboxOpen(true)}
                className="inline-flex items-center gap-2 bg-[#B09182] hover:bg-[#B09182]/90 text-white font-medium py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
                <span>Holiday Gift Card Special</span>
            </button>

            <GiftCardLightbox 
                isOpen={isLightboxOpen} 
                onClose={() => setIsLightboxOpen(false)} 
            />
        </>
    );
}
