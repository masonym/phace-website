'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/auth/clientSession';
import type { CatalogSnapshot } from '@/lib/services/adminCatalogService';

/** Loads the read-only Square catalog snapshot shared by the Services, Add-ons and Staff pages */
export function useAdminCatalog() {
    const [catalog, setCatalog] = useState<CatalogSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await adminFetch('/api/admin/catalog');
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Failed to load from Square');
            setCatalog(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { catalog, isLoading, error, reload: load };
}
