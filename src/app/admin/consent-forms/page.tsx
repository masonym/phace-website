'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ConsentFormForm from '@/components/admin/ConsentFormForm';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import ConsentFormRenderer from '@/components/booking/ConsentFormRenderer';

interface ConsentForm {
    id: string;
    title: string;
    content: string;
    serviceIds: string[];
    isActive: boolean;
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

export default function ConsentFormsPage() {
    const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingForm, setEditingForm] = useState<ConsentForm | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingForm, setDeletingForm] = useState<ConsentForm | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [previewForm, setPreviewForm] = useState<ConsentForm | null>(null);

    const router = useRouter();
    const { isAuthenticated, isLoading, getAccessToken } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Fetch services and consent forms
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch services
                const servicesResponse = await fetch('/api/booking/services?includeInactive=true');
                if (!servicesResponse.ok) throw new Error('Failed to fetch services');
                const servicesData = await servicesResponse.json();
                setCategories(servicesData);

                // Fetch all consent forms
                const formsResponse = await fetch('/api/booking/consent-forms');
                if (!formsResponse.ok) throw new Error('Failed to fetch consent forms');
                const formsData = await formsResponse.json();
                setConsentForms(formsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setMessage({ type: 'error', text: 'Failed to fetch data' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateForm = async (formData: Omit<ConsentForm, 'id'>) => {
        try {
            const token = await getAccessToken();
            if (!token) {
                setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' });
                return;
            }

            const response = await fetch('/api/booking/consent-forms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to create consent form');
            }

            const createdForm = await response.json();
            setConsentForms(prev => [...prev, createdForm]);
            setShowForm(false);
            setMessage({ type: 'success', text: 'Consent form created successfully' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error creating consent form:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create consent form' });
        }
    };

    const handleUpdateForm = async (formData: ConsentForm) => {
        try {
            const token = await getAccessToken();
            if (!token) {
                setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' });
                return;
            }

            const response = await fetch('/api/booking/consent-forms', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to update consent form');
            }

            const updatedForm = await response.json();
            setConsentForms(prev => prev.map(form => 
                form.id === updatedForm.id ? updatedForm : form
            ));
            setEditingForm(null);
            setMessage({ type: 'success', text: 'Consent form updated successfully' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error updating consent form:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update consent form' });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingForm) return;

        try {
            const token = await getAccessToken();
            if (!token) {
                setMessage({ type: 'error', text: 'Not authenticated. Please log in again.' });
                return;
            }

            const response = await fetch(`/api/booking/consent-forms?id=${deletingForm.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to delete consent form');
            }

            setConsentForms(prev => prev.filter(form => form.id !== deletingForm.id));
            setMessage({ type: 'success', text: 'Consent form deleted successfully' });
            setShowDeleteDialog(false);
            setDeletingForm(null);

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting consent form:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete consent form' });
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
                        <h1 className="text-3xl font-light text-gray-900">Consent Forms</h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 transition-colors"
                        >
                            Create Consent Form
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
                    {(showForm || editingForm) && (
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                                <h2 className="text-2xl font-light mb-6">
                                    {editingForm ? 'Edit Consent Form' : 'Create New Consent Form'}
                                </h2>
                                <ConsentFormForm
                                    categories={categories}
                                    onSubmit={editingForm ? handleUpdateForm : handleCreateForm}
                                    onCancel={() => {
                                        setShowForm(false);
                                        setEditingForm(null);
                                    }}
                                    initialData={editingForm || undefined}
                                />
                            </div>
                        </div>
                    )}

                    {/* Preview Modal */}
                    {previewForm && (
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-light">{previewForm.title}</h2>
                                    <button
                                        onClick={() => setPreviewForm(null)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <ConsentFormRenderer
                                    form={previewForm}
                                    onChange={() => {}}
                                    responses={{}}
                                />
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Dialog */}
                    {showDeleteDialog && deletingForm && (
                        <ConfirmDialog
                            title="Delete Consent Form"
                            message={`Are you sure you want to delete "${deletingForm.title}"? This action cannot be undone.`}
                            isOpen={showDeleteDialog}
                            onConfirm={handleDeleteConfirm}
                            onClose={() => {
                                setShowDeleteDialog(false);
                                setDeletingForm(null);
                            }}
                        />
                    )}

                    {/* Consent Forms List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        {loading ? (
                            <p className="p-4">Loading consent forms...</p>
                        ) : consentForms.length === 0 ? (
                            <p className="p-4">No consent forms found.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {consentForms.map((form) => (
                                    <li key={form.id} className="px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 mr-4">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-lg font-medium text-gray-900">{form.title}</h3>
                                                    {!form.isActive && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <h4 className="text-sm font-medium text-gray-700">Required for:</h4>
                                                    <div className="mt-1 flex flex-wrap gap-2">
                                                        {form.serviceIds.map(serviceId => (
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
                                                    onClick={() => setPreviewForm(form)}
                                                    className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Preview
                                                </button>
                                                <button
                                                    onClick={() => setEditingForm(form)}
                                                    className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setDeletingForm(form);
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
