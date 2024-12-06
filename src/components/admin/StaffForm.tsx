import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
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
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('bio', data.bio);
      formData.append('services', JSON.stringify(data.services));
      formData.append(
        'defaultAvailability',
        JSON.stringify(data.defaultAvailability)
      );
      formData.append('isActive', String(data.isActive));

      if (data.image?.[0]) {
        formData.append('image', data.image[0]);
      }

      const response = await fetch('/api/booking/staff' + (staff ? `/${staff.id}` : ''), {
        method: staff ? 'PUT' : 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to save staff member');

      onSubmit();
    } catch (error) {
      console.error('Error saving staff member:', error);
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

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
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
                Email
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Profile Image
              </label>
              <div className="mt-1 flex items-center space-x-4">
                {imagePreview && (
                  <div className="relative h-20 w-20 rounded-full overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  {...register('image')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="ml-2">Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Default Availability */}
          <div>
            <h3 className="text-lg font-medium mb-4">Default Availability</h3>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3, 4, 5].map((day, index) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-20 font-medium">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index]}
                  </div>
                  <input
                    type="time"
                    {...register(`defaultAvailability.${index}.startTime` as const)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    {...register(`defaultAvailability.${index}.endTime` as const)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
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
              {isSubmitting ? 'Saving...' : staff ? 'Save Changes' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
