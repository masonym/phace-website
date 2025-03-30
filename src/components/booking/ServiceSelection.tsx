'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ServiceVariation {
  id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isActive: boolean;
  variationId: string;
  variations?: ServiceVariation[];
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
  mode: 'category' | 'service' | 'variation';
  categoryId?: string;
  service?: Service;
  onSelect: (item: any) => void;
  onBack?: () => void;
}

export default function ServiceSelection({ mode, categoryId, service, onSelect, onBack }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [variations, setVariations] = useState<ServiceVariation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedServiceName, setSelectedServiceName] = useState<string>('');
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
              isActive: true,
              variationId: 'dummy-var-1',
              variations: [
                {
                  id: 'dummy-var-1',
                  name: 'Standard',
                  price: 9900,
                  duration: 60,
                  isActive: true
                },
                {
                  id: 'dummy-var-2',
                  name: 'Premium',
                  price: 14900,
                  duration: 90,
                  isActive: true
                }
              ]
            },
            {
              id: 'dummy-2',
              categoryId: catId,
              name: 'Sample Service 2',
              description: 'Another sample service for testing',
              price: 14900,
              duration: 90,
              imageUrl: undefined,
              isActive: true,
              variationId: 'dummy-var-3',
              variations: [
                {
                  id: 'dummy-var-3',
                  name: 'Basic',
                  price: 14900,
                  duration: 90,
                  isActive: true
                }
              ]
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
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setCategoriesLoaded(true);
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
      console.log("Categories:", categories);
      // Find the selected category name
      const category = categories.find(c => c.id === categoryId);
      console.log("Categories:", categories.length);
      if (category) {
        setSelectedCategoryName(category.name);
      } else {
        setSelectedCategoryName("Selasdasdected Category");
      }

      fetchServicesForCategory(categoryId);
    }
  }, [mode, categoryId, categories]);

  // Set variations when in variation mode
  useEffect(() => {
    if (mode === 'variation' && service) {
      setSelectedServiceName(service.name);
      if (service.variations && service.variations.length > 0) {
        setVariations(service.variations);
        setLoading(false);
      } else {
        // If there are no variations, create a default one based on the service
        setVariations([{
          id: service.variationId || service.id,
          name: 'Standard',
          price: service.price,
          duration: service.duration,
          isActive: true
        }]);
        setLoading(false);
      }
    }
  }, [mode, service]);

  const formatDuration = (durationMs: number) => {
    // Convert from milliseconds to minutes if needed
    const minutes = durationMs >= 1000 ? durationMs / 60000 : durationMs;
    return `${minutes} min`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        {(mode === 'service' || mode === 'variation') && onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <span className="mr-2">←</span> Back to {mode === 'service' ? 'Categories' : 'Services'}
          </button>
        )}
        <h2 className="text-2xl font-bold mt-2">
          {mode === 'category'
            ? 'Select a Service Category'
            : mode === 'service'
              ? `Select a ${selectedCategoryName} Service`
              : `Select a ${selectedServiceName} Variation`}
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
                onClick={() => {
                  // If service has multiple variations, go to variation selection
                  if (service.variations && service.variations.length > 1) {
                    onSelect({ type: 'service', service });
                  } else {
                    // Otherwise, select the service directly with its default variation
                    const defaultVariation = service.variations && service.variations.length === 1
                      ? service.variations[0]
                      : {
                        id: service.variationId || service.id,
                        name: 'Standard',
                        price: service.price,
                        duration: service.duration,
                        isActive: true
                      };

                    onSelect({
                      type: 'variation',
                      service,
                      variation: defaultVariation
                    });
                  }
                }}
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
                    {service.variations && service.variations.length > 1 && (
                      <p className="text-sm text-primary font-medium">
                        {service.variations.length} variations available
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-primary font-bold">
                      ${((service.price || 0) / 100).toFixed(2)}
                      {service.variations && service.variations.length > 1 && '+'}
                    </span>
                    <span className="text-gray-500">
                      {formatDuration(service.duration)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : mode === 'variation' && variations.length > 0 ? (
            variations.map((variation) => (
              <div
                key={variation.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer flex flex-col justify-between transform transition-transform duration-200 hover:scale-105"
                onClick={() => onSelect({
                  type: 'variation',
                  service,
                  variation
                })}
              >
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{variation.name}</h3>
                  <p className="text-gray-600 mb-2">
                    {service?.description || ''}
                  </p>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-primary font-bold">
                      ${((variation.price || 0) / 100).toFixed(2)}
                    </span>
                    <span className="text-gray-500">
                      {formatDuration(variation.duration)}
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
                  : mode === 'service'
                    ? 'No services found in this category. Please select a different category.'
                    : 'No variations found for this service. Please select a different service.'}
              </p>
              <pre className="mt-4 text-left bg-gray-100 p-4 rounded overflow-auto max-w-lg mx-auto text-xs">
                Debug Info:
                {JSON.stringify({
                  mode,
                  categoryId,
                  service: service?.id,
                  categoriesCount: categories.length,
                  servicesCount: services.length,
                  variationsCount: variations.length,
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
