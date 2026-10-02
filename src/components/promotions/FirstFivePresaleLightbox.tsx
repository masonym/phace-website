'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface FirstFivePresaleLightboxProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRESALE_URL = 'https://square.link/u/irfGmEaQ';

const PRODUCTS = [
    'Lipid Cleansing Oil',
    'Mandelic Multi Acid Serum',
    'Vitamin A + Peptide Crème',
    'Advanced Multi Peptide Serum',
    'Daily Antioxidant Moisturizer',
];

export default function FirstFivePresaleLightbox({ isOpen, onClose }: FirstFivePresaleLightboxProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key, scroll lock and focus trap
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;

            const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
                'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusableElements || focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        };

        document.body.style.overflow = 'hidden';
        modalRef.current?.querySelector<HTMLElement>('a, button')?.focus();
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="first-five-title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        ref={modalRef}
                        className="relative bg-[#FFFBF0] rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto md:grid md:grid-cols-[6fr_5fr]"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 text-[#59637E] hover:bg-white text-2xl leading-none shadow-sm focus:outline-none focus:ring-2 focus:ring-[#59637E]/30"
                            aria-label="Close pre-sale announcement"
                        >
                            ×
                        </button>

                        {/* Product image: shown uncropped so all five products are visible, over a blurred copy to fill the column */}
                        <div className="relative aspect-[1290/876] md:aspect-auto md:min-h-full overflow-hidden">
                            <Image
                                src="/images/promotions/first-five.webp"
                                alt=""
                                aria-hidden="true"
                                fill
                                sizes="(min-width: 1024px) 560px, (min-width: 768px) 55vw, 100vw"
                                className="object-cover blur-2xl scale-110 opacity-70"
                            />
                            <Image
                                src="/images/promotions/first-five.webp"
                                alt="The five products in the new Phace skincare collection on a wooden shelf"
                                fill
                                sizes="(min-width: 1024px) 560px, (min-width: 768px) 55vw, 100vw"
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-8">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#B09182] mb-2">
                                Pre-sale · Now through October 10
                            </p>
                            <h2 id="first-five-title" className="text-3xl text-[#59637E] mb-3">
                                Your First Five
                            </h2>
                            <p className="text-[#59637E]/80 mb-5">
                                Be one of the first to get your hands on the new Phace skincare collection.
                                Five thoughtfully formulated products. One simple morning + evening routine,
                                created to take the guesswork out of great skincare.
                            </p>

                            <ul className="space-y-1.5 mb-6 text-sm text-[#59637E]">
                                {PRODUCTS.map((product) => (
                                    <li key={product} className="flex items-center gap-2">
                                        <span className="text-[#B09182]" aria-hidden="true">✓</span>
                                        <span>{product}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="border-y border-[#DEC3C5] py-4 mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl text-[#59637E]">$259.99</span>
                                    <span className="text-sm text-[#59637E]/70">complete collection</span>
                                </div>
                                <p className="text-[#B09182] font-medium mt-1">
                                    + a $100 Phace service credit with your preorder
                                </p>
                            </div>

                            <a
                                href={PRESALE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#B09182] hover:bg-[#B09182]/90 text-white font-medium py-3 px-4 rounded-md text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#B09182]/50"
                            >
                                Preorder Now
                            </a>

                            <p className="text-sm text-[#59637E]/80 text-center mt-3">
                                Preorders close October 10 at midnight. Pickup + delivery begins October 26.
                            </p>

                            <p className="text-xs text-[#59637E]/60 mt-5 leading-relaxed">
                                Your $100 Phace service credit can be used toward one eligible regularly priced
                                Phace service of $150+. Credit must be used by June 30th, 2027. Excludes nail and
                                naturopathic services. One credit per transaction. No cash value. Cannot be
                                combined with other promotions, discounts or credits.
                            </p>

                            <div className="mt-4 text-center">
                                <button
                                    onClick={onClose}
                                    className="text-[#59637E]/70 hover:text-[#59637E] text-sm underline focus:outline-none focus:ring-2 focus:ring-[#B09182]/50 rounded px-2 py-1"
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
