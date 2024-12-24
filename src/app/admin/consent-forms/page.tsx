'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ConsentFormForm from '@/components/admin/ConsentFormForm';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import ConsentFormRenderer from '@/components/booking/ConsentFormRenderer';
import { ConsentForm } from '@/types/consentForm';

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
                
                // Transform the data to match the ConsentForm type
                const transformedForms = formsData.map((form: any) => ({
                    id: form.id,
                    title: form.title,
                    serviceIds: form.serviceIds || [],
                    isActive: form.isActive ?? true,
                    version: form.version || 1,
                    sections: (form.sections || []).map((section: any) => ({
                        id: section.id,
                        title: section.title,
                        questions: section.questions.map((question: any) => {
                            const baseQuestion = {
                                id: question.id,
                                type: question.type,
                                required: question.required,
                                label: question.label,
                            };

                            switch (question.type) {
                                case 'text':
                                    return {
                                        ...baseQuestion,
                                        type: 'text' as const,
                                        placeholder: question.content,
                                    };
                                case 'checkbox':
                                case 'radio':
                                    return {
                                        ...baseQuestion,
                                        type: question.type as 'checkbox' | 'radio',
                                        options: question.options || [],
                                    };
                                case 'markdown':
                                    return {
                                        ...baseQuestion,
                                        type: 'markdown' as const,
                                        content: question.content || '',
                                    };
                                default:
                                    throw new Error(`Unknown question type: ${question.type}`);
                            }
                        }),
                    })),
                }));
                
                setConsentForms(transformedForms);
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

            // Ensure the form data has the required structure
            const newFormData = {
                ...formData,
                sections: formData.sections || [],
                version: formData.version || 1,
                isActive: formData.isActive ?? true,
            };

            const response = await fetch('/api/booking/consent-forms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(newFormData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to create consent form');
            }

            const createdFormData = await response.json();
            // Transform the created form data to match the ConsentForm type
            const createdForm: ConsentForm = {
                ...createdFormData,
                sections: (createdFormData.sections || []).map((section: any) => ({
                    id: section.id,
                    title: section.title,
                    questions: section.questions.map((question: any) => {
                        const baseQuestion = {
                            id: question.id,
                            type: question.type,
                            required: question.required,
                            label: question.label,
                        };

                        switch (question.type) {
                            case 'text':
                                return {
                                    ...baseQuestion,
                                    type: 'text' as const,
                                    placeholder: question.content,
                                };
                            case 'checkbox':
                            case 'radio':
                                return {
                                    ...baseQuestion,
                                    type: question.type as 'checkbox' | 'radio',
                                    options: question.options || [],
                                };
                            case 'markdown':
                                return {
                                    ...baseQuestion,
                                    type: 'markdown' as const,
                                    content: question.content || '',
                                };
                            default:
                                throw new Error(`Unknown question type: ${question.type}`);
                        }
                    }),
                })),
            };

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
            <div className="p-4 sm:p-6">
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h1 className="text-2xl font-semibold">Consent Forms</h1>
                        <button
                            onClick={() => {
                                setEditingForm(null);
                                setShowForm(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto"
                        >
                            Create Form
                        </button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-md mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {consentForms.map(form => (
                                <div key={form.id} className="bg-white p-4 rounded-lg shadow">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-2 w-full sm:w-auto">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-medium">{form.title}</h3>
                                                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                    v{form.version}
                                                </span>
                                                {!form.isActive && (
                                                    <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {form.sections.map((section, index) => (
                                                    <span key={section.id} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                        Section {index + 1}: {section.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => setPreviewForm(form)}
                                                className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                                            >
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingForm(form);
                                                    setShowForm(true);
                                                }}
                                                className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeletingForm(form);
                                                    setShowDeleteDialog(true);
                                                }}
                                                className="flex-1 sm:flex-none bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
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
            </div>
        </AdminLayout>
    );
}
