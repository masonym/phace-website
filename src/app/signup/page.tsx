'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { showToast } from '@/components/ui/Toast';

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters long',
    validator: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Contains at least one uppercase letter',
    validator: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Contains at least one lowercase letter',
    validator: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Contains at least one number',
    validator: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'Contains at least one special character (@$!%*?&)',
    validator: (password) => /[@$!%*?&]/.test(password),
  },
];

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [meetsRequirements, setMeetsRequirements] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const password = watch('password', '');

  useEffect(() => {
    const requirements = passwordRequirements.reduce((acc, req) => ({
      ...acc,
      [req.id]: req.validator(password),
    }), {});
    setMeetsRequirements(requirements);
  }, [password]);

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign up');
      }

      showToast({
        title: 'Account Created',
        description: 'Please check your email for the verification code',
        status: 'success',
        duration: 10000,
      });

      // Redirect to verification page with email
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      console.error('Signup error:', err);
      showToast({
        title: 'Error',
        description: err.message || 'Failed to sign up',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => router.push('/login')}
              className="font-medium text-accent hover:text-accent/80"
            >
              sign in to your existing account
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  validate: (value) =>
                    Object.values(meetsRequirements).every(Boolean) ||
                    'Password does not meet all requirements',
                })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              
              {/* Password Requirements Checklist */}
              <div className="mt-2 space-y-2">
                {passwordRequirements.map((req) => (
                  <div key={req.id} className="flex items-center text-sm">
                    <span className={`mr-2 ${meetsRequirements[req.id] ? 'text-green-500' : 'text-gray-400'}`}>
                      {meetsRequirements[req.id] ? '✓' : '○'}
                    </span>
                    <span className={meetsRequirements[req.id] ? 'text-green-700' : 'text-gray-500'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'The passwords do not match',
                })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
