'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AddonForm from '@/components/admin/AddonForm';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';

interface Addon {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    serviceIds: string[];
}

interface Service {
    id: string;
    name: string;
    categoryId: string;
}

interface Category {
    id: string;
    name: string;
    services: Service[];
}

export default function AddonsPage() {
    const [addons, setAddons] = useState<Addon[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingAddon, setDeletingAddon] = useState<Addon | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const router = useRouter();
    const { isAuthenticated, isLoading, getAccessToken } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Fetch services and addons
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch services
                const servicesResponse = await fetch('/api/booking/services?includeInactive=true');
                if (!servicesResponse.ok) throw new Error('Failed to fetch services');
                const servicesData = await servicesResponse.json();
                setCategories(servicesData);

                // Fetch all addons
                const addonsResponse = await fetch('/api/booking/addons');
                if (!addonsResponse.ok) throw new Error('Failed to fetch addons');
                const addonsData = await addonsResponse.json();
                setAddons(addonsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setMessage({ type: 'error', text: 'Failed to fetch data' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateAddon = async (addonData: Omit<Addon, 'id'>) => {
        try {
            const token = await getAccessToken();
            if (!token) {
                setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' });
                return;
            }

            const response = await fetch('/api/booking/addons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(addonData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to create addon');
            }

            const createdAddon = await response.json();
            setAddons(prev => [...prev, createdAddon]);
            setShowForm(false);
            setMessage({ type: 'success', text: 'Add-on created successfully' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error creating addon:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create add-on' });
        }
    };

    const handleUpdateAddon = async (addonData: Addon) => {
        try {
            const token = await getAccessToken();
            if (!token) {
                setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' });
                return;
            }

            const response = await fetch('/api/booking/addons', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(addonData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to update addon');
            }

            const updatedAddon = await response.json();
            setAddons(prev => prev.map(addon => 
                addon.id === updatedAddon.id ? updatedAddon : addon
            ));
            setEditingAddon(null);
            setMessage({ type: 'success', text: 'Add-on updated successfully' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error updating addon:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update add-on' });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingAddon) return;

        try {
            const token = await getAccessToken();
            if (!token) {
                setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' });
                return;
            }

            const response = await fetch(`/api/booking/addons?id=${deletingAddon.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to delete addon');
            }

            setAddons(prev => prev.filter(addon => addon.id !== deletingAddon.id));
            setMessage({ type: 'success', text: 'Add-on deleted successfully' });
            setShowDeleteDialog(false);
            setDeletingAddon(null);

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting addon:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete add-on' });
        }
    };

    const getServiceNameById = (serviceId: string) => {
        const category = categories.find(category => category.services.some(service => service.id === serviceId));
        return category?.services.find(service => service.id === serviceId)?.name || 'Unknown Service';
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-lg">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-light text-gray-900">Add-ons</h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 transition-colors"
                        >
                            Create Add-on
                        </button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-md mb-6 ${
                            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form Modal */}
                    {(showForm || editingAddon) && (
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                                <h2 className="text-2xl font-light mb-6">
                                    {editingAddon ? 'Edit Add-on' : 'Create New Add-on'}
                                </h2>
                                <AddonForm
                                    categories={categories}
                                    onSubmit={editingAddon ? handleUpdateAddon : handleCreateAddon}
                                    onCancel={() => {
                                        setShowForm(false);
                                        setEditingAddon(null);
                                    }}
                                    initialData={editingAddon || undefined}
                                />
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Dialog */}
                    {showDeleteDialog && deletingAddon && (
                        <ConfirmDialog
                            title="Delete Add-on"
                            message={`Are you sure you want to delete "${deletingAddon.name}"? This action cannot be undone.`}
                            onConfirm={handleDeleteConfirm}
                            onCancel={() => {
                                setShowDeleteDialog(false);
                                setDeletingAddon(null);
                            }}
                        />
                    )}

                    {/* Add-ons List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        {loading ? (
                            <p className="p-4">Loading add-ons...</p>
                        ) : addons.length === 0 ? (
                            <p className="p-4">No add-ons found.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {addons.map((addon) => (
                                    <li key={addon.id} className="px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">{addon.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{addon.description}</p>
                                                <div className="mt-2 space-x-4">
                                                    <span className="text-sm text-gray-600">Duration: {addon.duration} minutes</span>
                                                    <span className="text-sm text-gray-600">Price: ${addon.price}</span>
                                                </div>
                                                <div className="mt-2">
                                                    <h4 className="text-sm font-medium text-gray-700">Available for:</h4>
                                                    <div className="mt-1 flex flex-wrap gap-2">
                                                        {addon.serviceIds.map(serviceId => (
                                                            <span
                                                                key={serviceId}
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent"
                                                            >
                                                                {getServiceNameById(serviceId)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setEditingAddon(addon)}
                                                    className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDeletingAddon(addon);
                                                        setShowDeleteDialog(true);
                                                    }}
                                                    className="text-sm px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
