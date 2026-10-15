'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface ProductWaitlistEntry {
    productId: string;
    productName: string;
    variationName?: string;
    name?: string;
    email: string;
    createdAt: string;
}

export default function ProductWaitlistManager() {
    const [entries, setEntries] = useState<ProductWaitlistEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingRemoval, setPendingRemoval] = useState<ProductWaitlistEntry | null>(null);

    const fetchEntries = async () => {
        try {
            const response = await fetch('/api/admin/product-waitlist');
            if (!response.ok) throw new Error('Failed to fetch product waitlist');
            setEntries(await response.json());
        } catch (error) {
            showToast({
                title: 'Error',
                description: 'Failed to fetch product waitlist',
                status: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const groups = useMemo(() => {
        const byProduct = new Map<string, { productName: string; entries: ProductWaitlistEntry[] }>();
        for (const entry of entries) {
            const group = byProduct.get(entry.productId) ?? { productName: entry.productName, entries: [] };
            group.entries.push(entry);
            byProduct.set(entry.productId, group);
        }
        return Array.from(byProduct, ([productId, group]) => ({ productId, ...group }))
            .sort((a, b) => a.productName.localeCompare(b.productName));
    }, [entries]);

    const copyEmails = async (group: { productName: string; entries: ProductWaitlistEntry[] }) => {
        const emails = group.entries.map((e) => e.email).join(', ');
        try {
            await navigator.clipboard.writeText(emails);
            showToast({
                title: 'Copied',
                description: `${group.entries.length} email(s) copied. Paste them into BCC.`,
                status: 'success',
            });
        } catch {
            showToast({ title: 'Error', description: 'Could not copy to clipboard', status: 'error' });
        }
    };

    const removeEntry = async (entry: ProductWaitlistEntry) => {
        try {
            const response = await fetch('/api/admin/product-waitlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: entry.productId, email: entry.email }),
            });
            if (!response.ok) throw new Error('Failed to remove entry');
            setEntries((prev) => prev.filter((e) => !(e.productId === entry.productId && e.email === entry.email)));
        } catch (error) {
            showToast({ title: 'Error', description: 'Failed to remove entry', status: 'error' });
        } finally {
            setPendingRemoval(null);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6">
                <h1 className="text-3xl font-semibold">Product Waitlist</h1>
                <p className="text-gray-600 mt-2">
                    People waiting on products in the &quot;Coming Soon&quot; category in Square. When a product launches,
                    copy its emails into the BCC of an announcement.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No one is on a product waitlist yet</div>
            ) : (
                <div className="space-y-8">
                    {groups.map((group) => (
                        <section key={group.productId} className="bg-white rounded-lg shadow-sm border">
                            <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-4 border-b">
                                <h2 className="text-xl font-semibold">
                                    {group.productName}
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        {group.entries.length} waiting
                                    </span>
                                </h2>
                                <button
                                    onClick={() => copyEmails(group)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90"
                                >
                                    Copy emails
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Option</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signed up</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {group.entries.map((entry) => (
                                            <tr key={entry.email} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.name || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <a href={`mailto:${entry.email}`} className="hover:text-accent">{entry.email}</a>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.variationName || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(parseISO(entry.createdAt), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => setPendingRemoval(entry)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={pendingRemoval !== null}
                onClose={() => setPendingRemoval(null)}
                onConfirm={() => pendingRemoval && removeEntry(pendingRemoval)}
                title="Remove from waitlist"
                message={pendingRemoval ? `Remove ${pendingRemoval.email} from the ${pendingRemoval.productName} waitlist?` : ''}
                confirmLabel="Remove"
            />
        </div>
    );
}
