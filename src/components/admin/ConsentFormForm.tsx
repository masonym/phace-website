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
        title: initialData?.title || '',
        serviceIds: initialData?.serviceIds || [],
        isActive: initialData?.isActive ?? true,
        version: initialData?.version || 1,
        sections: initialData?.sections || [],
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
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Required for Services
                    </label>
                    <div className="flex space-x-2">
                        <button 
                            type="button" 
                            onClick={() => {
                                const allServiceIds = categories.flatMap(category => 
                                    category.services.map(service => service.id)
                                );
                                setFormData(prev => ({ ...prev, serviceIds: allServiceIds }));
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                            Select All
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, serviceIds: [] }))}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
                <div className="space-y-4 border rounded-md p-4 bg-gray-50">
                    {categories.map((category) => {
                        const categoryServiceIds = category.services.map(service => service.id);
                        const selectedServicesCount = categoryServiceIds.filter(id => 
                            formData.serviceIds.includes(id)
                        ).length;
                        
                        return (
                            <div key={category.id} className="border rounded-md p-4 bg-white">
                                <label className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={isCategorySelected(category.id)}
                                            onChange={() => handleCategorySelection(category.id)}
                                            className="rounded border-gray-300 text-accent focus:ring-accent"
                                        />
                                        <span className="text-sm font-medium">{category.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {selectedServicesCount} of {categoryServiceIds.length} selected
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                                    {category.services.map((service) => {
                                        const isSelected = formData.serviceIds.includes(service.id);
                                        return (
                                            <label
                                                key={service.id}
                                                className={`flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleServiceSelection(service.id)}
                                                    className="rounded border-gray-300 text-accent focus:ring-accent"
                                                />
                                                <span className="text-sm">{service.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
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
