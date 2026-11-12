'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PopupCard from './PopupCard';
import type { PopupContent } from '@/lib/utils/popups';

interface PopupModalProps {
    popup: PopupContent | null;
    onClose: () => void;
}

const TITLE_ID = 'site-popup-title';

/** Full-screen overlay around a PopupCard, with escape-to-close, scroll lock and a focus trap */
export default function PopupModal({ popup, onClose }: PopupModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const isOpen = !!popup;

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

        const previouslyFocused = document.activeElement as HTMLElement | null;
        document.body.style.overflow = 'hidden';
        // Focus the close button (first in the card) without scrolling, so on phones the card opens at the top
        modalRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {popup && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={TITLE_ID}
                    onClick={(e) => {
                        // Close when the dimmed backdrop itself is clicked
                        if (e.target === e.currentTarget) onClose();
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        ref={modalRef}
                        className="w-full flex justify-center pointer-events-none [&>*]:pointer-events-auto"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <PopupCard popup={popup} onClose={onClose} titleId={TITLE_ID} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
