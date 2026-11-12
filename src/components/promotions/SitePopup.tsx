'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import PopupModal from './PopupModal';
import { pickPopup, type PublicPopup } from '@/lib/utils/popups';

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

const storageKey = (popup: PublicPopup) => `site-popup-${popup.id}-last-shown`;

function alreadySeen(popup: PublicPopup, now: number): boolean {
    try {
        if (popup.frequency === 'session') return !!sessionStorage.getItem(storageKey(popup));
        const lastShown = localStorage.getItem(storageKey(popup));
        if (!lastShown) return false;
        return popup.frequency === 'once' || now - parseInt(lastShown, 10) < ONE_DAY_MS;
    } catch {
        // Storage unavailable, so we can't tell; show it
        return false;
    }
}

function markSeen(popup: PublicPopup, now: number) {
    try {
        const storage = popup.frequency === 'session' ? sessionStorage : localStorage;
        storage.setItem(storageKey(popup), now.toString());
    } catch {
        // Ignore storage errors
    }
}

/** Shows whichever admin-managed popup is live, at most one per page view */
export default function SitePopup() {
    const pathname = usePathname();
    const [popups, setPopups] = useState<PublicPopup[] | null>(null);
    const [current, setCurrent] = useState<PublicPopup | null>(null);
    // If two popups are live, the second waits for the next page rather than following straight on
    const [shownOnPath, setShownOnPath] = useState<string | null>(null);
    const isSuppressed = !!pathname && SUPPRESSED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    // Only fetch once a visitor reaches a page where a popup may appear
    useEffect(() => {
        if (popups !== null || isSuppressed) return;
        fetch('/api/popups')
            .then((response) => (response.ok ? response.json() : []))
            .then((data) => setPopups(Array.isArray(data) ? data : []))
            .catch(() => setPopups([]));
    }, [popups, isSuppressed]);

    useEffect(() => {
        if (!popups?.length || isSuppressed || current || shownOnPath === pathname) return;

        const now = Date.now();
        const popup = pickPopup(popups.filter((candidate) => !alreadySeen(candidate, now)), new Date(now));
        if (!popup) return;

        const timer = setTimeout(() => {
            setCurrent(popup);
            setShownOnPath(pathname);
            markSeen(popup, Date.now());
        }, popup.delaySeconds * 1000);

        return () => clearTimeout(timer);
    }, [popups, isSuppressed, current, shownOnPath, pathname]);

    const close = useCallback(() => setCurrent(null), []);

    return <PopupModal popup={isSuppressed ? null : current} onClose={close} />;
}
