'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  services?: Service[];
  imageUrl?: string;
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [categoriesLoaded, setCategoriesLoaded] = useState<boolean>(false);

  const fetchServicesForCategory = async (catId: string) => {
    try {
      setLoading(true);
      console.log("Fetching services for category:", catId);
      const response = await fetch(`/api/booking/services?categoryId=${encodeURIComponent(catId)}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      console.log("Services data:", data);

      if (data && data.length > 0 && Array.isArray(data[0].services)) {
        console.log("Setting services:", data[0].services.length);
        console.log("Service details:", JSON.stringify(data[0].services));
        setServices(data[0].services);
      } else {
        console.error("No services data returned or empty array");

        // Create dummy services for testing if no services are returned
        if (process.env.NODE_ENV === 'development') {
          console.log("Creating dummy services for development");
          setServices([
            {
              id: 'dummy-1',
              categoryId: catId,
              name: 'Sample Service 1',
              description: 'This is a sample service for testing',
              price: 9900,
              duration: 60,
              imageUrl: undefined,
              isActive: true
            },
            {
              id: 'dummy-2',
              categoryId: catId,
              name: 'Sample Service 2',
              description: 'Another sample service for testing',
              price: 14900,
              duration: 90,
              imageUrl: undefined,
              isActive: true
            }
          ]);
        } else {
          setServices([]);
        }
      }
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log("Fetching categories");
      const response = await fetch('/api/booking/services');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      console.log("Categories data:", data);

      // Only show active categories if the isActive property exists
      const activeCategories = data.filter((category: any) =>
        category.isActive !== false // Consider undefined or true as active
      );

      console.log("Active categories:", activeCategories.length);
      console.log("Active categories data:", JSON.stringify(activeCategories));
      setCategories(activeCategories);
      setCategoriesLoaded(true);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories when in category mode
  useEffect(() => {
    if (mode === 'category' && !categoriesLoaded) {
      fetchCategories();
    }
  }, [mode, categoriesLoaded]);

  // Fetch services for a specific category
  useEffect(() => {
    // Only fetch services when in service mode and we have a categoryId
    if (mode === 'service' && categoryId) {
      console.log("Service mode with categoryId:", categoryId);
      // Find the selected category name
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedCategoryName(category.name);
      } else {
        setSelectedCategoryName("Selected Category");
      }

      fetchServicesForCategory(categoryId);
    }
  }, [mode, categoryId, categories]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        {mode === 'service' && onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <span className="mr-2">←</span> Back to Categories
          </button>
        )}
        <h2 className="text-2xl font-bold mt-2">
          {mode === 'category' ? 'Select a Service Category' : `Select a ${selectedCategoryName} Service`}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => mode === 'category' ? fetchCategories() : categoryId && fetchServicesForCategory(categoryId)}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {mode === 'category' && categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105"
                onClick={() => onSelect(category)}
              >
                {category.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  {category.description && (
                    <p className="text-gray-600">{category.description}</p>
                  )}
                </div>
              </div>
            ))
          ) : mode === 'service' && services.length > 0 ? (
            services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer flex flex-col justify-between transform transition-transform duration-200 hover:scale-105"
                onClick={() => onSelect(service)}
              >
                <div className="">
                  {service.imageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <Image
                        src={service.imageUrl}
                        alt={service.name}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-gray-600 mb-2">{service.description}</p>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-primary font-bold">
                      ${((service.price || 0) / 100).toFixed(2)}
                    </span>
                    <span className="text-gray-500">
                      {(service.duration / 60000) || 0} min
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-xl text-gray-600">
                {mode === 'category'
                  ? 'No service categories found. Please check back later.'
                  : 'No services found in this category. Please select a different category.'}
              </p>
              <pre className="mt-4 text-left bg-gray-100 p-4 rounded overflow-auto max-w-lg mx-auto text-xs">
                Debug Info:
                {JSON.stringify({
                  mode,
                  categoryId,
                  categoriesCount: categories.length,
                  servicesCount: services.length,
                  loading,
                  error
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
