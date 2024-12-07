'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import ServiceCategoryForm from '@/components/admin/ServiceCategoryForm';
import ServiceForm from '@/components/admin/ServiceForm';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const router = useRouter();
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Include inactive services in admin view
        const response = await fetch('/api/booking/services?includeInactive=true');
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

  const handleDeleteService = async (service: Service) => {
    setDeletingService(service);
    setShowDeleteDialog(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const token = await getAccessToken();
      if (deletingService) {
        const response = await fetch(`/api/booking/services?id=${deletingService.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to delete service');

        // Refresh the services list
        const servicesResponse = await fetch('/api/booking/services?includeInactive=true');
        const data = await servicesResponse.json();
        setCategories(data);
      } else if (deletingCategory) {
        // First check if category has any services
        const category = categories.find(c => c.id === deletingCategory.id);
        if (category && category.services.length > 0) {
          throw new Error('Cannot delete category that contains services');
        }

        const response = await fetch(`/api/booking/services/categories?id=${deletingCategory.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to delete category');

        // Refresh the categories list
        const categoriesResponse = await fetch('/api/booking/services?includeInactive=true');
        const data = await categoriesResponse.json();
        setCategories(data);
        if (selectedCategory === deletingCategory.id) {
          setSelectedCategory(data.length > 0 ? data[0].id : null);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setShowDeleteDialog(false);
      setDeletingService(null);
      setDeletingCategory(null);
    }
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
                    <div className="space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                        className="text-sm hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category);
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
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
                          <div className="space-x-4">
                            <button
                              onClick={() => handleEditService(service)}
                              className="text-accent hover:text-accent/80 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteService(service)}
                              className="text-red-600 hover:text-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
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
            const response = await fetch('/api/booking/services?includeInactive=true');
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
            const response = await fetch('/api/booking/services?includeInactive=true');
            const data = await response.json();
            setCategories(data);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeletingService(null);
            setDeletingCategory(null);
          }}
          onConfirm={confirmDelete}
          title={`Delete ${deletingService ? 'Service' : 'Category'}`}
          message={`Are you sure you want to delete ${
            deletingService ? `the service "${deletingService.name}"` : `the category "${deletingCategory?.name}"`
          }? This action cannot be undone.`}
        />
      )}
    </AdminLayout>
  );
}
