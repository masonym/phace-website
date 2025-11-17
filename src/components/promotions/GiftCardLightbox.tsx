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
                        className="bg-[#FFFBF0] rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                {/* Header */}
                <div className="relative bg-[#DEC3C5] p-6 border-b">
                    <div className="relative text-center z-10">
                        <div className="inline-flex items-center gap-2 mb-2">
                            {/* <span className="text-2xl" aria-hidden="true">🎄</span> */}
                            <h1 id="gift-card-title" className="text-2xl font-bold text-[#59637E]">Holiday Gift Card Special</h1>
                            {/* <span className="text-2xl" aria-hidden="true">🎅</span> */}
                        </div>
                        <p className="text-[#59637E]/80">Give the gift of beauty this holiday season!</p>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-[#59637E]/60 hover:text-[#59637E] text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-[#59637E]/30 rounded z-20"
                        aria-label="Close gift card modal"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* $100 Gift Card Option */}
                        <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-[#DEC3C5] transition-colors">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#DEC3C5]/10 rounded-full mb-3" aria-hidden="true">
                                    <span className="text-2xl">💳</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Buy $100, Get $50 FREE</h3>
                                <div className="text-3xl font-bold text-[#B09182] mb-1">$150 Total Value</div>
                                <p className="text-sm text-gray-600">(2× $25 bonus gift cards)</p>
                            </div>
                            
                            <ul className="space-y-2 mb-4 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="text-[#B09182]">✓</span>
                                    <span>Get $50 in FREE bonus cards</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#B09182]">✓</span>
                                    <span>Get 2× $25 bonus gift cards</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#B09182]">✓</span>
                                    <span>Bonus cards emailed separately</span>
                                </li>
                            </ul>

                            <a
                                href={squareGiftCardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#B09182] hover:bg-[#B09182]/90 text-white font-medium py-3 px-4 rounded-md text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#B09182]/50"
                                aria-label="Buy $100 gift card with $50 in bonus cards"
                            >
                                Buy $100 Card
                            </a>
                        </div>

                        {/* $200 Gift Card Option */}
                        <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-[#B09182] transition-colors relative">
                            <div className="absolute top-2 right-2 border-2 border-[#B09182] text-[#B09182] bg-white text-xs px-2 py-1 rounded-full font-medium">
                                BEST VALUE
                            </div>
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B09182]/10 rounded-full mb-3" aria-hidden="true">
                                    <span className="text-2xl">💳</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Buy $200, Get $100 FREE</h3>
                                <div className="text-3xl font-bold text-[#B09182] mb-1">$300 Total Value</div>
                                <p className="text-sm text-gray-600">(4× $25 bonus gift cards)</p>
                            </div>
                            
                            <ul className="space-y-2 mb-4 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="text-[#B09182]">✓</span>
                                    <span>Get $100 in FREE bonus cards</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#B09182]">✓</span>
                                    <span>Get 4× $25 bonus gift cards</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#B09182]">✓</span>
                                    <span>Bonus cards emailed separately</span>
                                </li>
                            </ul>

                            <a
                                href={squareGiftCardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#B09182] hover:bg-[#B09182]/90 text-white font-medium py-3 px-4 rounded-md text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#B09182]/50"
                                aria-label="Buy $200 gift card with $100 in bonus cards"
                            >
                                Buy $200 Card
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
