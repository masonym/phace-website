'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  createAccount: boolean;
  password?: string;
  notes?: string;
}

interface Props {
  onSubmit: (data: ClientFormData) => void;
  onBack: () => void;
}

export default function ClientForm({ onSubmit, onBack }: Props) {
  const [wantAccount, setWantAccount] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>();

  const onFormSubmit = (data: ClientFormData) => {
    onSubmit({
      ...data,
      createAccount: wantAccount,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Your Information</h1>
        <p className="text-center text-gray-600 mb-8">
          Please provide your contact details
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
        Back to Add-ons
      </button>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {/* Name Field */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\+?[\d\s-()]+$/,
                  message: 'Invalid phone number',
                },
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Create Account Option */}
          <div className="mb-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={wantAccount}
                onChange={(e) => setWantAccount(e.target.checked)}
                className="rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-sm text-gray-700">
                Create an account to manage your appointments
              </span>
            </label>
          </div>

          {/* Password Field (if creating account) */}
          {wantAccount && (
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                {...register('password', {
                  required: wantAccount ? 'Password is required' : false,
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* Notes Field */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Any special requests or information we should know?"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors"
          >
            Continue to Consent Forms
          </button>
        </div>
      </form>
    </div>
  );
}
