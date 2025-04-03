'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import {
  PaymentForm,
  CreditCard
} from 'react-square-web-payments-sdk';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  createAccount: boolean;
  password?: string;
  notes?: string;
  paymentNonce?: string;
}

interface Props {
  onSubmit: (data: ClientFormData) => void;
  onBack: () => void;
}

export default function ClientForm({ onSubmit, onBack }: Props) {
  const [wantAccount, setWantAccount] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm<ClientFormData>();
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
    }
  }, [isAuthenticated, user, setValue]);

  const onFormSubmit = async (data: ClientFormData) => {
    try {
      if (!data.paymentNonce) {
        throw new Error('Payment information is required');
      }
      onSubmit({
        ...data,
        createAccount: wantAccount,
      });
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Failed to process payment');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Confirm Your Information</h1>
        <p className="text-center text-gray-600 mb-8">
          Please fill out the form below to confirm your information and payment details.
        </p>
      </div>

      <button
        onClick={onBack}
        className="mb-8 text-accent hover:text-accent/80 transition-colors flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Date & Time Selection
      </button>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {/* Existing form fields */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* ... other existing fields ... */}

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
                  value: /^(\+?1)?[-. ]?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}$/,
                  message: 'Please enter a valid phone number'
                }
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="(123) 456-7890"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Create Account Option - Only show for non-authenticated users */}
          {!isAuthenticated && (
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
          )}

          {/* Password Field - Only show for non-authenticated users who want an account */}
          {!isAuthenticated && wantAccount && (
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
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
                  }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                placeholder="Enter a secure password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* Notes Field */}
          <div className="mb-4">
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

          {/* Payment Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Information
            </label>
            <PaymentForm
              applicationId={process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!}
              locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!}
              cardTokenizeResponseReceived={async (token, verifiedBuyer) => {
                if (token.status === 'OK') {
                  setValue('paymentNonce', token.token);
                } else {
                  setPaymentError('Card tokenization failed');
                }
              }}
              createVerificationDetails={() => ({
                amount: 0, // do not charge the user, just get their card 
                currencyCode: 'CAD',
                intent: 'STORE',
                billingContact: {
                  country: 'CA',
                  givenName: getValues('name').split(' ')[0],
                  familyName: getValues('name').split(' ').slice(1).join(' '),
                  email: getValues('email'),
                  phone: getValues('phone'),
                },
              })}
            >
              <CreditCard
                buttonProps={{
                  css: {
                    backgroundColor: 'transparent',
                    width: 'auto',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginLeft: 'auto',
                    '&:active': {
                      backgroundColor: 'transparent',
                    },
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                    '&:focus': {
                      backgroundColor: 'transparent',
                    },
                    '&:disabled': {
                      backgroundColor: 'transparent',
                    },
                    '&:after': {
                      backgroundColor: 'transparent',
                    },

                  }
                }}
              >

                {/*TODO: fix this; shouldnt be nested button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors"
                  >
                    Continue to Consent Forms
                  </button>
                </div>
              </CreditCard>
            </PaymentForm>
            {paymentError && <p className="mt-1 text-sm text-red-600">{paymentError}</p>}
          </div>
          {/*
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors"
            >
              Continue to Consent Forms
            </button>
          </div>
          */}
        </div>
      </form >
    </div >
  );
}
