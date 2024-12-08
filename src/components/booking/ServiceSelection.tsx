'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  image?: string;
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

interface Props {
  mode: 'category' | 'service';
  categoryId?: string;
  onSelect: (item: any) => void;
  onBack?: () => void;
}

export default function ServiceSelection({ mode, categoryId, onSelect, onBack }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/booking/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        
        // Only show categories that have active services
        const categoriesWithServices = data.filter((category: { isActive: any; services: string | any[]; }) => 
          category.isActive && category.services.length > 0
        );
        
        setCategories(categoriesWithServices);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading services...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (mode === 'category') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-light text-center mb-2">Select a Category</h1>
          <p className="text-center text-gray-600 mb-8">
            Choose the type of service you're looking for
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelect(category)}
              className="p-6 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-200 text-left"
            >
              <h3 className="text-xl font-medium mb-2">{category.name}</h3>
              <p className="text-gray-600">{category.description}</p>
              <p className="text-sm text-accent mt-2">{category.services.length} services available</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Service selection mode
  const selectedCategory = categories.find(c => c.id === categoryId);
  if (!selectedCategory) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Select a Service</h1>
        <p className="text-center text-gray-600 mb-8">
          Choose from {selectedCategory.name}
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-8 text-accent hover:text-accent/80 transition-colors flex items-center"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Categories
      </button>

      <div className="grid grid-cols-1 gap-6">
        {selectedCategory.services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="p-6 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center"
          >
            {service.image && (
              <div className="flex-shrink-0 mr-6">
                <Image
                  src={service.image}
                  alt={service.name}
                  width={80}
                  height={80}
                  className="rounded-lg"
                />
              </div>
            )}
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-medium">{service.name}</h3>
                <div className="text-accent font-medium">${service.price}</div>
              </div>
              <p className="text-gray-600 mt-2">{service.description}</p>
              <p className="text-sm text-gray-500 mt-2">{service.duration} minutes</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
