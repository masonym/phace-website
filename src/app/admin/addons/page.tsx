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
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h1 className="text-2xl font-semibold break-words max-w-full">Add-ons</h1>
                        <button
                            onClick={() => {
                                setEditingAddon(null);
                                setShowForm(true);
                            }}
                            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 w-full sm:w-auto whitespace-nowrap transition-colors"
                        >
                            Create Add-on
                        </button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {addons.map(addon => (
                                <div key={addon.id} className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="space-y-2 w-full">
                                            <h3 className="text-lg font-medium break-words">{addon.name}</h3>
                                            <p className="text-gray-600 text-sm break-words">{addon.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-sm bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
                                                    {addon.duration} min
                                                </span>
                                                <span className="text-sm bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
                                                    ${addon.price}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                <p className="font-medium mb-1">Available for:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {addon.serviceIds.map(serviceId => (
                                                        <span key={serviceId} className="bg-gray-100 px-2 py-1 rounded-lg text-gray-700 break-words">
                                                            {getServiceNameById(serviceId)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => {
                                                    setEditingAddon(addon);
                                                    setShowForm(true);
                                                }}
                                                className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 whitespace-nowrap transition-colors text-center"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeletingAddon(addon);
                                                    setShowDeleteDialog(true);
                                                }}
                                                className="flex-1 sm:flex-none bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 whitespace-nowrap transition-colors text-center"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form Modal */}
                {(showForm || editingAddon) && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-4 sm:p-6 my-8">
                            <h2 className="text-2xl font-light mb-6 break-words">
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
                        isOpen={showDeleteDialog}
                        onConfirm={handleDeleteConfirm}
                        onClose={() => {
                            setShowDeleteDialog(false);
                            setDeletingAddon(null);
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
