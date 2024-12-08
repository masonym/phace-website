'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { showToast } from '@/components/ui/Toast';

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

export default function ResetPassword() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [meetsRequirements, setMeetsRequirements] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    const requirements = passwordRequirements.reduce((acc, req) => ({
      ...acc,
      [req.id]: req.validator(password),
    }), {});
    setMeetsRequirements(requirements);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      showToast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
      });
      return;
    }

    if (!Object.values(meetsRequirements).every(Boolean)) {
      showToast({
        title: 'Error',
        description: 'Password does not meet all requirements',
        status: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          newPassword: password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
      }

      showToast({
        title: 'Success',
        description: 'Your password has been reset. Please log in with your new password.',
        status: 'success',
      });

      router.push('/login');
    } catch (err: any) {
      console.error('Reset password error:', err);
      showToast({
        title: 'Error',
        description: err.message || 'Failed to reset password',
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please start the password reset process from the login page.
            </p>
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-accent hover:text-accent/80"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the code from your email and choose a new password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Reset Code
            </label>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              placeholder="Enter code from email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              placeholder="••••••••"
            />
            
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
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              placeholder="••••••••"
            />
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
                'Reset Password'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-accent hover:text-accent/80"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
