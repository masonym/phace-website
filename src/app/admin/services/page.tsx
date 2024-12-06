'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ServiceCategoryForm from '@/components/admin/ServiceCategoryForm';
import ServiceForm from '@/components/admin/ServiceForm';
import { useAuth } from '@/hooks/useAuth';

interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
  services: Service[];
  isActive: boolean;
}

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

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/booking/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setCategories(data);
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedCategory]);

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleCreateService = () => {
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">Services Management</h1>
          <button
            onClick={handleCreateCategory}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Categories List */}
          <div className="col-span-3 bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-medium mb-4">Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-accent text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{category.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
                      }}
                      className="text-sm hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Services List */}
          <div className="col-span-9">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">
                  Services in {categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <button
                  onClick={handleCreateService}
                  className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Add Service
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {selectedCategory &&
                  categories
                    .find(c => c.id === selectedCategory)
                    ?.services.map((service) => (
                      <div
                        key={service.id}
                        className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium">{service.name}</h3>
                            <p className="text-gray-600 mt-1">{service.description}</p>
                            <div className="flex space-x-4 mt-2 text-sm text-gray-500">
                              <span>{service.duration} mins</span>
                              <span>${service.price}</span>
                              <span
                                className={`${
                                  service.isActive ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {service.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditService(service)}
                            className="text-accent hover:text-accent/80 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <ServiceCategoryForm
          category={editingCategory}
          onClose={() => setShowCategoryForm(false)}
          onSubmit={async () => {
            setShowCategoryForm(false);
            // Refresh the categories list
            const response = await fetch('/api/booking/services');
            const data = await response.json();
            setCategories(data);
          }}
        />
      )}

      {/* Service Form Modal */}
      {showServiceForm && (
        <ServiceForm
          service={editingService}
          categories={categories}
          onClose={() => setShowServiceForm(false)}
          onSubmit={async () => {
            setShowServiceForm(false);
            // Refresh the services list
            const response = await fetch('/api/booking/services');
            const data = await response.json();
            setCategories(data);
          }}
        />
      )}
    </AdminLayout>
  );
}
