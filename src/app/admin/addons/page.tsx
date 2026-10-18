'use client';

import { useMemo } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import SquareManagedHeader from '@/components/admin/SquareManagedHeader';
import { useAdminCatalog } from '@/components/admin/useAdminCatalog';
import { formatMoney, formatDuration } from '@/lib/utils/format';
import type { AdminAddon, CatalogSnapshot } from '@/lib/services/adminCatalogService';

interface CategoryCoverage {
    name: string;
    offered: number;
    total: number;
}

/** For each booking category, how many of its services offer this add-on */
function coverageFor(addon: AdminAddon, catalog: CatalogSnapshot): CategoryCoverage[] {
    return catalog.categories
        .filter(c => c.bookable)
        .map(category => {
            const services = catalog.services.filter(s => s.categoryIds.includes(category.id));
            return {
                name: category.name,
                offered: services.filter(s => s.addonIds.includes(addon.id)).length,
                total: services.length,
            };
        })
        .filter(c => c.offered > 0);
}

export default function AddonsPage() {
    const { catalog, isLoading, error, reload } = useAdminCatalog();

    const skippedCategories = useMemo(
        () => catalog?.categories.filter(c => c.bookable && c.addonsExcluded).map(c => c.name) ?? [],
        [catalog]
    );

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SquareManagedHeader
                title="Add-ons"
                description="Add-ons are the services in Square's add-on category. To add one or change its price or duration, edit it in the Square Dashboard, then refresh this page."
                squarePath="/items/library"
                squareLabel="Edit in Square"
                onRefresh={reload}
                isLoading={isLoading}
            />

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}

            {skippedCategories.length > 0 && (
                <p className="text-sm text-gray-600 bg-white border rounded-lg px-4 py-3 mb-6">
                    <span className="font-medium">No add-ons are offered for:</span> {skippedCategories.join(', ')}.
                    {' '}<span className="text-gray-500">This list is set in the website code (addonConfig.ts).</span>
                </p>
            )}

            {!catalog && isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : catalog && (
                catalog.addons.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg border">
                        No add-ons found in Square&apos;s add-on category
                    </div>
                ) : (
                    <div className="space-y-4">
                        {catalog.addons.map(addon => {
                            const coverage = coverageFor(addon, catalog);
                            return (
                                <article key={addon.id} className="bg-white rounded-lg shadow-sm border p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-medium">{addon.name}</h2>
                                            {addon.description && <p className="text-sm text-gray-600 mt-1">{addon.description}</p>}
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-sm">
                                            <span className="bg-gray-100 px-2 py-1 rounded">{formatDuration(addon.durationMs)}</span>
                                            <span className="bg-gray-100 px-2 py-1 rounded">{formatMoney(addon.price)}</span>
                                            {!addon.isActive && (
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Archived</span>
                                            )}
                                        </div>
                                    </div>

                                    {addon.durationMs === 0 && (
                                        <p className="mt-3 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-md px-3 py-2">
                                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                            No duration is set in Square, so this add-on won&apos;t add time to the booking.
                                        </p>
                                    )}

                                    <div className="mt-4 text-sm">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Offered with</p>
                                        {coverage.length === 0 ? (
                                            <p className="text-gray-500">No bookable services</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {coverage.map(c => (
                                                    <span key={c.name} className="bg-accent/10 text-accent px-2 py-1 rounded">
                                                        {c.name}{c.offered < c.total && ` (${c.offered} of ${c.total})`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
}
