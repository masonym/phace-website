'use client';

import { useState } from 'react';
import GiftCardLightbox from './GiftCardLightbox';

export default function GiftCardBanner() {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const squareGiftCardUrl = 'https://squareup.com/gift/MLQZQRE5MYB56/order';

    return (
        <>
            {/* Persistent Banner */}
            <div className="bg-[#B09182] text-white py-3 px-4 shadow-lg mt-20">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                        {/* <span className="text-2xl" aria-hidden="true">🎄</span> */}
                        <div>
                            <p className="font-semibold text-sm sm:text-base">
                                Holiday Gift Card Special! Buy $100, Get $50 FREE • Buy $200, Get $100 FREE
                            </p>
                            <p className="text-xs sm:text-sm opacity-90">
                                Limited time offer - Bonus gift cards emailed separately
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsLightboxOpen(true)}
                            className="bg-white text-[#59637E] hover:bg-gray-100 font-medium py-2 px-4 rounded-md text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                            Learn More
                        </button>
                        <a
                            href={squareGiftCardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#B09182] hover:bg-[#B09182]/90 text-white font-medium py-2 px-4 rounded-md text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#B09182]/50"
                        >
                            Buy Now
                        </a>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            <GiftCardLightbox 
                isOpen={isLightboxOpen} 
                onClose={() => setIsLightboxOpen(false)} 
            />
        </>
    );
}
