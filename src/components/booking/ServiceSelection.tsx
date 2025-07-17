'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookingCache } from '@/lib/cache/bookingCache';

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
  description?: string;
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
  preloadStaffForServices?: (services: Service[]) => void;
}

export default function ServiceSelection({ mode, categoryId, service, onSelect, onBack, preloadStaffForServices }: Props) {
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

      // Use the BookingCache to get services (either from cache or fresh)
      const services = await BookingCache.getServicesByCategory(catId, async () => {
        const response = await fetch(`/api/booking/services?categoryId=${encodeURIComponent(catId)}`);
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();

        if (data && data.length > 0 && Array.isArray(data[0].services)) {
          return data[0].services;
        }
        return [];
      });

      console.log("Services returned:", services.length);
      setServices(services);
      
      // If preloadStaffForServices is provided, call it with the loaded services
      // This allows the parent to start pre-loading staff data for these services
      if (preloadStaffForServices && services.length > 0) {
        preloadStaffForServices(services);
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

      // Use the BookingCache to get categories (either from cache or fresh)
      const allCategories = await BookingCache.getCategories(async () => {
        const response = await fetch('/api/booking/services');
        if (!response.ok) throw new Error('Failed to fetch categories');
        return await response.json();
      });

      // Only show active categories if the isActive property exists
      const activeCategories = allCategories.filter((category: any) =>
        category.isActive !== false // Consider undefined or true as active
      ).filter((category: any) => {
        // filter out categories like "Add-ons", "Gift Cards", and "Retail"
        const excludedCategories = ['add-ons', 'add-ons', 'gift cards', 'retail', 'nails'];
        const categoryNameLower = category.name.toLowerCase().trim();
        const isExcluded = excludedCategories.includes(categoryNameLower);

        return !isExcluded;
      });

      console.log("Active categories:", activeCategories.length);
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
    if (mode === 'category' || mode === 'service' && !categoriesLoaded) {
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
        setSelectedCategoryName("");
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

            Back to {mode === 'service' ? 'Categories' : 'Services'}
          </button>
        )}
        <h2 className="text-2xl font-bold mt-2">
          {mode === 'category'
            ? 'Select a Service Category'
            : mode === 'service'
              ? `Select a Service from ${selectedCategoryName}`
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
