'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface GiftCardLightboxProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GiftCardLightbox({ isOpen, onClose }: GiftCardLightboxProps) {
    const squareGiftCardUrl = 'https://squareup.com/gift/MLQZQRE5MYB56/order';
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key and backdrop click
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleBackdropClick = (e: MouseEvent) => {
            // Removed backdrop click to close - requires confirmation close
        };

        // Lock body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus trap
        const focusableElements = modalRef.current?.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;
        
        let handleTabKey: ((e: KeyboardEvent) => void) | null = null;
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
            
            handleTabKey = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            };
            
            document.addEventListener('keydown', handleTabKey);
        }

        document.addEventListener('keydown', handleEscape);
        // Note: Removed backdrop click handler to require confirmation close

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscape);
            if (handleTabKey) {
                document.removeEventListener('keydown', handleTabKey);
            }
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4" 
                    role="dialog" 
                    aria-modal="true" 
                    aria-labelledby="gift-card-title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div 
                        ref={modalRef}
                        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-green-50 to-red-50 p-6 border-b overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-200 via-green-200 to-red-300"></div>
                        <div className="absolute top-0 left-0 w-32 h-32 bg-red-400 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-green-400 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="grid grid-cols-6 gap-4">
                                {[...Array(24)].map((_, i) => (
                                    <div key={i} className="w-2 h-2 bg-red-500 rounded-full opacity-30"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative text-center z-10">
                        <div className="inline-flex items-center gap-2 mb-2">
                            {/* <span className="text-2xl" aria-hidden="true">🎄</span> */}
                            <h1 id="gift-card-title" className="text-2xl font-bold text-gray-900">Holiday Gift Card Special</h1>
                            {/* <span className="text-2xl" aria-hidden="true">🎅</span> */}
                        </div>
                        <p className="text-gray-600">Give the gift of beauty this Christmas season!</p>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-[#B09182] rounded z-20"
                        aria-label="Close gift card modal"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* $100 Gift Card Option */}
                        <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-400 transition-colors">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3" aria-hidden="true">
                                    <span className="text-2xl">🎁</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">$100 Gift Card</h3>
                                <div className="text-3xl font-bold text-green-600 mb-1">$150 Value</div>
                                <p className="text-sm text-gray-600">Plus $50 in Bonus Cards</p>
                            </div>
                            
                            <ul className="space-y-2 mb-4 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>Receive $100 gift card</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>Get 2× $25 bonus gift cards</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>Bonus cards emailed separately</span>
                                </li>
                            </ul>

                            <a
                                href={squareGiftCardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#B09182] hover:bg-[#B09182]/90 text-white font-medium py-3 px-4 rounded-md text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#B09182]/50"
                                aria-label="Purchase $100 gift card with bonus cards"
                            >
                                Purchase $100 Card
                            </a>
                        </div>

                        {/* $200 Gift Card Option */}
                        <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-red-400 transition-colors relative">
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                BEST VALUE
                            </div>
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3" aria-hidden="true">
                                    <span className="text-2xl">🎁</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">$200 Gift Card</h3>
                                <div className="text-3xl font-bold text-red-600 mb-1">$300 Value</div>
                                <p className="text-sm text-gray-600">Plus $100 in Bonus Cards</p>
                            </div>
                            
                            <ul className="space-y-2 mb-4 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>Receive $200 gift card</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>Get 4× $25 bonus gift cards</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>Bonus cards emailed separately</span>
                                </li>
                            </ul>

                            <a
                                href={squareGiftCardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#B09182] hover:bg-[#B09182]/90 text-white font-medium py-3 px-4 rounded-md text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#B09182]/50"
                                aria-label="Purchase $200 gift card with bonus cards"
                            >
                                Purchase $200 Card
                            </a>
                        </div>
                    </div>

                    {/* Important Information */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="text-lg">ℹ️</span>
                            Important Information
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>• <strong>Bonus gift cards:</strong> Will be emailed separately to the purchaser after purchase.</p>
                            <p>• <strong>Usage restrictions:</strong> Only one bonus card may be used per transaction or service.</p>
                            <p>• <strong>Exclusions:</strong> Bonus cards are not valid for use on naturopath, IV therapy, or nail services.</p>
                            <p>• <strong>Regular gift cards:</strong> The main $100 or $200 gift card has no restrictions and can be used on any service.</p>
                            {/* <p>• <strong>Expiration:</strong> Gift cards do not expire. Bonus cards issued within promotional period.</p> */}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 mb-3">
                            Questions? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a> or call during business hours.
                        </p>
                        <button
                            onClick={onClose}
                            className="text-gray-600 hover:text-gray-900 text-sm underline focus:outline-none focus:ring-2 focus:ring-[#B09182]/50 rounded px-2 py-1"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
}
