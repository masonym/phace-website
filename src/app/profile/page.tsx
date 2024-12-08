'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={signOut}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.name || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
              {/* Add appointments list here */}
              <p className="text-sm text-gray-500 mt-2">No upcoming appointments</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Past Appointments</h3>
              {/* Add past appointments list here */}
              <p className="text-sm text-gray-500 mt-2">No past appointments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
