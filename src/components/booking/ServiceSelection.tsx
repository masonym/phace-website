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
  onSelect: (service: Service) => void;
}

export default function ServiceSelection({ onSelect }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Don't include inactive services in the booking page
        const response = await fetch('/api/booking/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        
        // Only show categories that have active services
        const categoriesWithServices = data.filter(category => 
          category.isActive && category.services.length > 0
        );
        
        setCategories(categoriesWithServices);
        if (categoriesWithServices.length > 0) {
          setSelectedCategory(categoriesWithServices[0].id);
        }
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

  const selectedCategoryServices = categories.find(c => c.id === selectedCategory)?.services || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Select a Service</h1>
        <p className="text-center text-gray-600 mb-8">
          Choose from our range of treatments
        </p>
      </div>

      {/* Category Selection */}
      <div className="flex justify-center space-x-4 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-6 py-3 rounded-full transition-colors ${
              selectedCategory === category.id
                ? 'bg-accent text-white'
                : 'bg-[#F8E7E1] text-gray-700 hover:bg-[#F8E7E1]/80'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selectedCategoryServices.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="bg-white rounded-lg p-6 text-left shadow-sm hover:shadow-md transition-shadow w-full"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span>{service.duration} mins</span>
                  <span>${service.price}</span>
                </div>
              </div>
              {service.image && (
                <div className="w-24 h-24 relative">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
