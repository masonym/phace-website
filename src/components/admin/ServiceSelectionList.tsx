'use client';

import { useEffect, useState } from 'react';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  categoryId: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  services: Service[];
  isActive: boolean;
}

interface ServiceSelectionListProps {
  selectedServices: string[];
  onChange: (services: string[]) => void;
}

export default function ServiceSelectionList({ selectedServices, onChange }: ServiceSelectionListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Track selected categories to handle "Select All" functionality
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/booking/services?includeInactive=true');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setCategories(data);

        // Initialize selected categories based on selectedServices
        const newSelectedCategories = new Set<string>();
        data.forEach((category: Category) => {
          const categoryServices = category.services.map(s => s.id);
          if (categoryServices.every(serviceId => selectedServices.includes(serviceId))) {
            newSelectedCategories.add(category.id);
          }
        });
        setSelectedCategories(newSelectedCategories);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedServices]);

  const handleCategoryChange = (categoryId: string, isChecked: boolean) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newSelectedServices = new Set(selectedServices);
    const categoryServiceIds = category.services.map(s => s.id);

    if (isChecked) {
      // Add all services from the category
      categoryServiceIds.forEach(id => newSelectedServices.add(id));
      setSelectedCategories(prev => new Set([...prev, categoryId]));
    } else {
      // Remove all services from the category
      categoryServiceIds.forEach(id => newSelectedServices.delete(id));
      setSelectedCategories(prev => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
    }

    onChange(Array.from(newSelectedServices));
  };

  const handleServiceChange = (serviceId: string, categoryId: string, isChecked: boolean) => {
    const newSelectedServices = new Set(selectedServices);
    
    if (isChecked) {
      newSelectedServices.add(serviceId);
    } else {
      newSelectedServices.delete(serviceId);
    }

    // Update category selection state
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      const categoryServices = category.services.map(s => s.id);
      const allCategoryServicesSelected = categoryServices.every(id => 
        isChecked ? (id === serviceId || newSelectedServices.has(id)) : newSelectedServices.has(id)
      );
      
      setSelectedCategories(prev => {
        const next = new Set(prev);
        if (allCategoryServicesSelected) {
          next.add(categoryId);
        } else {
          next.delete(categoryId);
        }
        return next;
      });
    }

    onChange(Array.from(newSelectedServices));
  };

  if (loading) {
    return <div className="text-gray-600">Loading services...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category.id} className="border rounded-lg p-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id={`category-${category.id}`}
              checked={selectedCategories.has(category.id)}
              onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
              className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
            />
            <label htmlFor={`category-${category.id}`} className="ml-2 font-medium text-gray-700">
              {category.name}
            </label>
          </div>
          
          <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {category.services.map(service => (
              <div key={service.id} className="flex items-start">
                <input
                  type="checkbox"
                  id={`service-${service.id}`}
                  checked={selectedServices.includes(service.id)}
                  onChange={(e) => handleServiceChange(service.id, category.id, e.target.checked)}
                  className="mt-1 h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                />
                <label htmlFor={`service-${service.id}`} className="ml-2">
                  <div className="text-sm font-medium text-gray-700">{service.name}</div>
                  <div className="text-xs text-gray-500">
                    {service.duration} mins - ${service.price}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
