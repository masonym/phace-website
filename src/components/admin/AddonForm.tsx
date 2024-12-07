'use client';

import { useState, useEffect } from 'react';

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

interface AddonFormProps {
    categories: Category[];
    onSubmit: (addon: any) => void;
    onCancel: () => void;
    initialData?: {
        id?: string;
        name: string;
        description: string;
        duration: number;
        price: number;
        serviceIds: string[];
    };
}

export default function AddonForm({ categories, onSubmit, onCancel, initialData }: AddonFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: 0,
        price: 0,
        serviceIds: [] as string[],
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                    Duration (minutes)
                </label>
                <input
                    type="number"
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                    required
                    min="0"
                />
            </div>

            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price ($)
                </label>
                <input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                    required
                    min="0"
                    step="0.01"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available for Services
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
                    {initialData?.id ? 'Update Add-on' : 'Create Add-on'}
                </button>
            </div>
        </form>
    );
}
