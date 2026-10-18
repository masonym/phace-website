'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import SquareManagedHeader from '@/components/admin/SquareManagedHeader';
import { useAdminCatalog } from '@/components/admin/useAdminCatalog';
import { formatMoney, formatDuration } from '@/lib/utils/format';
import type { AdminService, AdminServiceVariation, CatalogSnapshot } from '@/lib/services/adminCatalogService';

const NOT_ONLINE_ID = '__not-online';

interface ConsentFormSummary {
    id: string;
    title: string;
    serviceIds: string[];
    isActive: boolean;
}

export default function ServicesPage() {
    const { catalog, isLoading, error, reload } = useAdminCatalog();
    const [consentForms, setConsentForms] = useState<ConsentFormSummary[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/booking/consent-forms')
            .then(r => (r.ok ? r.json() : []))
            .then(setConsentForms)
            .catch(() => setConsentForms([]));
    }, []);

    const bookableCategories = useMemo(() => catalog?.categories.filter(c => c.bookable) ?? [], [catalog]);

    // Services the booking flow never shows, because none of their categories is bookable
    const notOnline = useMemo(() => {
        if (!catalog) return [];
        const bookableIds = new Set(bookableCategories.map(c => c.id));
        return catalog.services.filter(s => !s.categoryIds.some(id => bookableIds.has(id)));
    }, [catalog, bookableCategories]);

    useEffect(() => {
        if (!selectedCategory && bookableCategories.length > 0) setSelectedCategory(bookableCategories[0].id);
    }, [bookableCategories, selectedCategory]);

    const visibleServices = useMemo(() => {
        if (!catalog) return [];
        const term = search.trim().toLowerCase();
        if (term) return catalog.services.filter(s => s.name.toLowerCase().includes(term));
        if (selectedCategory === NOT_ONLINE_ID) return notOnline;
        return catalog.services.filter(s => selectedCategory && s.categoryIds.includes(selectedCategory));
    }, [catalog, search, selectedCategory, notOnline]);

    const heading = search.trim()
        ? `Results for "${search.trim()}"`
        : selectedCategory === NOT_ONLINE_ID
            ? 'Not in online booking'
            : bookableCategories.find(c => c.id === selectedCategory)?.name ?? 'Services';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SquareManagedHeader
                title="Services"
                description="Bookable services as they are set up in Square. To add a service or change its price, duration or staff, edit it in the Square Dashboard, then refresh this page."
                squarePath="/items/library"
                squareLabel="Edit in Square"
                onRefresh={reload}
                isLoading={isLoading}
            />

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}

            {!catalog && isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : catalog && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <aside className="lg:col-span-3 bg-white rounded-lg shadow-sm border p-4 h-fit">
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search all services"
                            aria-label="Search all services"
                            className="w-full mb-4 px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-accent focus:ring-accent"
                        />
                        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Booking categories</h2>
                        <nav className="space-y-1">
                            {bookableCategories.map(category => (
                                <CategoryButton
                                    key={category.id}
                                    label={category.name}
                                    count={catalog.services.filter(s => s.categoryIds.includes(category.id)).length}
                                    active={!search && selectedCategory === category.id}
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedCategory(category.id);
                                    }}
                                />
                            ))}
                            {notOnline.length > 0 && (
                                <CategoryButton
                                    label="Not in online booking"
                                    count={notOnline.length}
                                    active={!search && selectedCategory === NOT_ONLINE_ID}
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedCategory(NOT_ONLINE_ID);
                                    }}
                                    muted
                                />
                            )}
                        </nav>
                    </aside>

                    <section className="lg:col-span-9">
                        <h2 className="text-xl font-medium mb-1">{heading}</h2>
                        {selectedCategory === NOT_ONLINE_ID && !search && (
                            <p className="text-sm text-gray-500 mb-4">
                                These services are only in categories the booking page hides (like Retail or Gift Cards), so clients can&apos;t book them online.
                            </p>
                        )}
                        {selectedCategory && selectedCategory !== NOT_ONLINE_ID && !search &&
                            catalog.categories.find(c => c.id === selectedCategory)?.addonsExcluded && (
                                <p className="text-sm text-gray-500 mb-4">Clients booking in this category skip the add-on step.</p>
                            )}

                        <div className="space-y-4 mt-4">
                            {visibleServices.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 bg-white rounded-lg border">No services here</div>
                            ) : (
                                visibleServices.map(service => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        catalog={catalog}
                                        consentForms={consentForms.filter(f => f.isActive !== false && f.serviceIds?.includes(service.id))}
                                    />
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function CategoryButton({ label, count, active, onClick, muted }: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
    muted?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex justify-between items-center px-3 py-2 rounded-md text-sm text-left ${active
                ? 'bg-accent text-white'
                : muted ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-700 hover:bg-gray-100'
                }`}
        >
            <span>{label}</span>
            <span className={active ? 'text-white/80' : 'text-gray-400'}>{count}</span>
        </button>
    );
}

function priceLabel(variation: AdminServiceVariation) {
    return variation.variablePrice ? 'Variable' : formatMoney(variation.price);
}

function ServiceCard({ service, catalog, consentForms }: {
    service: AdminService;
    catalog: CatalogSnapshot;
    consentForms: ConsentFormSummary[];
}) {
    const staffName = (id: string) => catalog.staff.find(s => s.id === id)?.name ?? 'Unknown';
    const warnings: string[] = [];
    if (service.variations.every(v => v.staffIds.length === 0)) {
        warnings.push('No staff are assigned in Square, so this service has no times to book.');
    }
    if (service.variations.length > 0 && service.variations.every(v => !v.availableForBooking)) {
        warnings.push('Turned off for online booking in Square.');
    }

    const addonNames = service.addonIds
        .map(id => catalog.addons.find(a => a.id === id)?.name)
        .filter(Boolean);
    const offersAllAddons = catalog.addons.length > 0 && service.addonIds.length === catalog.addons.length;

    return (
        <article className="bg-white rounded-lg shadow-sm border p-5">
            <h3 className="text-lg font-medium">{service.name}</h3>
            {service.description && <p className="text-sm text-gray-600 mt-1 line-clamp-3">{service.description}</p>}

            {warnings.map(w => (
                <p key={w} className="mt-3 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-md px-3 py-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    {w}
                </p>
            ))}

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                            {service.variations.length > 1 && <th className="py-2 pr-4 font-medium">Option</th>}
                            <th className="py-2 pr-4 font-medium">Duration</th>
                            <th className="py-2 pr-4 font-medium">Price</th>
                            <th className="py-2 font-medium">Staff</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {service.variations.map(variation => (
                            <tr key={variation.id}>
                                {service.variations.length > 1 && <td className="py-2 pr-4">{variation.name}</td>}
                                <td className="py-2 pr-4 whitespace-nowrap">{formatDuration(variation.durationMs)}</td>
                                <td className="py-2 pr-4 whitespace-nowrap">{priceLabel(variation)}</td>
                                <td className="py-2 text-gray-600">
                                    {variation.staffIds.length > 0 ? variation.staffIds.map(staffName).join(', ') : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">Add-ons offered</dt>
                    <dd className="text-gray-700">
                        {addonNames.length === 0 ? 'None' : offersAllAddons ? `All add-ons (${addonNames.length})` : addonNames.join(', ')}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider mb-1">Consent forms</dt>
                    <dd className="text-gray-700">
                        {consentForms.length === 0 ? 'None' : consentForms.map(f => f.title).join(', ')}
                    </dd>
                </div>
            </dl>
        </article>
    );
}
