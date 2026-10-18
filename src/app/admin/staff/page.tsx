'use client';

import { Loader2, AlertTriangle } from 'lucide-react';
import SquareManagedHeader from '@/components/admin/SquareManagedHeader';
import { useAdminCatalog } from '@/components/admin/useAdminCatalog';
import type { CatalogSnapshot } from '@/lib/services/adminCatalogService';
import type { AdminStaffMember } from '@/lib/services/adminBookingService';

/** Services (and the specific options, when only some are assigned) this person can be booked for */
function assignedServices(member: AdminStaffMember, catalog: CatalogSnapshot): string[] {
    return catalog.services.flatMap(service => {
        const assigned = service.variations.filter(v => v.staffIds.includes(member.id));
        if (assigned.length === 0) return [];
        if (assigned.length === service.variations.length) return [service.name];
        return assigned.map(v => `${service.name} – ${v.name}`);
    });
}

export default function StaffPage() {
    const { catalog, isLoading, error, reload } = useAdminCatalog();

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SquareManagedHeader
                title="Staff"
                description="Team members with a booking profile in Square. Working hours, time off and which services each person offers are all managed in Square."
                squarePath=""
                squareLabel="Open Square Dashboard"
                onRefresh={reload}
                isLoading={isLoading}
            />

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}

            {!catalog && isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : catalog && (
                catalog.staff.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg border">No staff have a booking profile in Square</div>
                ) : (
                    <div className="space-y-4">
                        {catalog.staff.map(member => {
                            const services = assignedServices(member, catalog);
                            return (
                                <article key={member.id} className="bg-white rounded-lg shadow-sm border p-5 flex flex-col sm:flex-row gap-5">
                                    {member.imageUrl ? (
                                        // Square-hosted photo; next/image would need the Square CDN whitelisted
                                        <img
                                            src={member.imageUrl}
                                            alt=""
                                            className="h-20 w-20 rounded-full object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-accent/10 text-accent flex items-center justify-center text-2xl font-semibold shrink-0" aria-hidden>
                                            {member.name.charAt(0)}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-medium">{member.name}</h2>
                                            {!member.isBookable && (
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Not bookable online</span>
                                            )}
                                        </div>
                                        {member.bio && <p className="text-sm text-gray-600 mt-1">{member.bio}</p>}

                                        {member.isBookable && services.length === 0 && (
                                            <p className="mt-3 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-md px-3 py-2">
                                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                                Not assigned to any services in Square, so clients can&apos;t book them.
                                            </p>
                                        )}

                                        {services.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                                    Services ({services.length})
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {services.map(name => (
                                                        <span key={name} className="text-sm bg-gray-100 px-2 py-1 rounded">{name}</span>
                                                    ))}
                                                </div>
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
