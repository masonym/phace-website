'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import ServiceSelectionList from './ServiceSelectionList';

interface StaffFormProps {
  staff?: {
    id: string;
    name: string;
    email: string;
    bio?: string;
    image?: string;
    services: string[];
    defaultAvailability: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
    isActive: boolean;
  } | null;
  onClose: () => void;
  onSubmit: () => void;
}

interface FormData {
  name: string;
  email: string;
  bio: string;
  image?: FileList;
  services: string[];
  defaultAvailability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  isActive: boolean;
}

export default function StaffForm({ staff, onClose, onSubmit }: StaffFormProps) {
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    staff?.image
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { getIdToken } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      name: staff?.name || '',
      email: staff?.email || '',
      bio: staff?.bio || '',
      services: staff?.services || [],
      defaultAvailability: staff?.defaultAvailability || [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },
      ],
      isActive: staff?.isActive ?? true,
    },
  });

  const watchImage = watch('image');

  // Update image preview when a new file is selected
  if (watchImage?.[0]) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(watchImage[0]);
  }

  const onFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      if (staff?.id) {
        formData.append('id', staff.id);
      }
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('bio', data.bio);
      formData.append('services', JSON.stringify(data.services));
      formData.append(
        'defaultAvailability',
        JSON.stringify(data.defaultAvailability.map((avail, index) => ({
          ...avail,
          dayOfWeek: index + 1
        })))
      );
      formData.append('isActive', String(data.isActive));

      if (data.image?.[0]) {
        formData.append('image', data.image[0]);
      }

      const response = await fetch('/api/booking/staff' + (staff ? `?id=${staff.id}` : ''), {
        method: staff ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save staff member');
      }

      const responseData = await response.json();
      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Error saving staff member:', error);
      setError(error.message || 'Failed to save staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-6">
          {staff ? 'Edit Staff Member' : 'Add Staff Member'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Enter name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Enter email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              {...register('bio')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
              rows={4}
              placeholder="Enter bio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Services
            </label>
            <ServiceSelectionList
              selectedServices={watch('services')}
              onChange={(services) => {
                setValue('services', services, { shouldDirty: true });
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Image
            </label>
            <input
              type="file"
              accept="image/*"
              {...register('image')}
              className="w-full"
            />
            {imagePreview && (
              <div className="mt-2 relative w-32 h-32">
                <Image
                  src={imagePreview}
                  alt="Profile preview"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Active Status
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">
                Staff member is currently active
              </span>
            </div>
          </div>

          {/* Default Availability Schedule */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Default Weekly Schedule</h3>
            <div className="grid grid-cols-1 gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-28 font-medium text-gray-700">
                    {day}
                  </div>
                  <input
                    type="time"
                    {...register(`defaultAvailability.${index}.startTime` as const)}
                    className="px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                  />
                  <span className="text-gray-600">to</span>
                  <input
                    type="time"
                    {...register(`defaultAvailability.${index}.endTime` as const)}
                    className="px-3 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Set the default working hours for each day of the week
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : staff
                ? 'Save Changes'
                : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
