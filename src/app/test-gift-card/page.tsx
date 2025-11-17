'use client';

import { GiftCardPromoButton } from '@/components/promotions';

export default function TestGiftCardPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">Gift Card Lightbox Test Page</h1>
                
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Test the Gift Card Lightbox</h2>
                    <p className="text-gray-600 mb-6">
                        Click the button below to test the Christmas gift card promotion lightbox component.
                    </p>
                    
                    <div className="flex justify-center">
                        <GiftCardPromoButton />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-xl font-semibold mb-4">Test Checklist</h2>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>✅ Modal opens when button is clicked</li>
                        <li>✅ Modal closes when X button is clicked</li>
                        <li>✅ Modal closes when backdrop is clicked</li>
                        <li>✅ Modal closes when Escape key is pressed</li>
                        <li>✅ Focus is trapped within modal</li>
                        <li>✅ Background scrolling is prevented when modal is open</li>
                        <li>✅ Links open in new tabs</li>
                        <li>✅ Responsive design works on mobile</li>
                        <li>✅ Accessibility features work (screen reader, keyboard navigation)</li>
                    </ul>
                </div>

                {/* Add extra content to test scrolling */}
                <div className="mt-8 space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold mb-2">Test Content Block {i + 1}</h3>
                            <p className="text-gray-600">
                                This is test content to verify that the background page has scrolling 
                                and that the modal properly locks it when opened. Lorem ipsum dolor sit 
                                amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut 
                                labore et dolore magna aliqua.
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
