'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface ServiceCategoryFormProps {
  category?: {
    id: string;
    name: string;
    description?: string;
    order?: number;
    isActive: boolean;
  } | null;
  onClose: () => void;
  onSubmit: () => void;
}

interface FormData {
  name: string;
  description: string;
  order: number;
  isActive: boolean;
}

export default function ServiceCategoryForm({
  category,
  onClose,
  onSubmit,
}: ServiceCategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      order: category?.order || 0,
      isActive: category?.isActive ?? true,
    },
  });

  const onFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        '/api/booking/categories' + (category ? `/${category.id}` : ''),
        {
          method: category ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            ...(category && { id: category.id }),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save category');

      onSubmit();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6">
          {category ? 'Edit Category' : 'Add Category'}
        </h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display Order
            </label>
            <input
              type="number"
              {...register('order', {
                valueAsNumber: true,
                min: { value: 0, message: 'Order must be 0 or greater' },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
            />
            {errors.order && (
              <p className="mt-1 text-sm text-red-600">{errors.order.message}</p>
            )}
          </div>

          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="ml-2">Active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-accent border border-transparent rounded-md shadow-sm hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : category
                ? 'Save Changes'
                : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
