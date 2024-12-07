'use client';

import { useState, useEffect } from 'react';
import FormBuilder from './FormBuilder';
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

interface ConsentFormFormProps {
    categories: Category[];
    onSubmit: (formData: ConsentForm) => void;
    onCancel: () => void;
    initialData?: ConsentForm;
}

export default function ConsentFormForm({ categories, onSubmit, onCancel, initialData }: ConsentFormFormProps) {
    const [formData, setFormData] = useState<ConsentForm>({
        id: initialData?.id || '',
        title: '',
        serviceIds: [] as string[],
        isActive: true,
        version: 1,
        sections: [],
        ...(initialData || {}),
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.serviceIds.length === 0) {
            alert('Please select at least one service');
            return;
        }
        onSubmit(formData);
    };

    const handleServiceSelection = (serviceId: string) => {
        setFormData(prev => {
            const serviceIds = prev.serviceIds.includes(serviceId)
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId];
            return { ...prev, serviceIds };
        });
    };

    const handleCategorySelection = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        const categoryServiceIds = category.services.map(service => service.id);
        const allCategoryServicesSelected = categoryServiceIds.every(id => 
            formData.serviceIds.includes(id)
        );

        setFormData(prev => {
            const newServiceIds = allCategoryServicesSelected
                ? prev.serviceIds.filter(id => !categoryServiceIds.includes(id))
                : [...new Set([...prev.serviceIds, ...categoryServiceIds])];
            return { ...prev, serviceIds: newServiceIds };
        });
    };

    const isCategorySelected = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return false;
        return category.services.every(service => 
            formData.serviceIds.includes(service.id)
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto pb-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                </label>
                <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                    required
                />
            </div>

            <div className="flex-1 min-h-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Content
                </label>
                <div className="relative">
                    <FormBuilder
                        initialData={formData}
                        onSave={(updatedForm) => {
                            setFormData(prev => ({
                                ...prev,
                                sections: updatedForm.sections,
                            }));
                        }}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required for Services
                </label>
                <div className="space-y-4">
                    {categories.map((category) => (
                        <div key={category.id} className="border rounded-md p-4">
                            <label className="flex items-center space-x-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={isCategorySelected(category.id)}
                                    onChange={() => handleCategorySelection(category.id)}
                                    className="rounded border-gray-300 text-accent focus:ring-accent"
                                />
                                <span className="text-sm font-medium">{category.name}</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                                {category.services.map((service) => (
                                    <label
                                        key={service.id}
                                        className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.serviceIds.includes(service.id)}
                                            onChange={() => handleServiceSelection(service.id)}
                                            className="rounded border-gray-300 text-accent focus:ring-accent"
                                        />
                                        <span className="text-sm">{service.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                    Inactive consent forms will not be shown to clients.
                </p>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                >
                    {initialData?.id ? 'Update Consent Form' : 'Create Consent Form'}
                </button>
            </div>
        </form>
    );
}
