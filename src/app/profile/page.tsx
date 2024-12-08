'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
}

export default function Profile() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.email) return;
      
      setLoadingAppointments(true);
      try {
        const response = await fetch(`/api/booking/appointments?clientEmail=${encodeURIComponent(user.email)}`);
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const data = await response.json();
        
        // Sort appointments by date, most recent first
        const sortedAppointments = data.sort((a: Appointment, b: Appointment) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setAppointments(sortedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    if (user?.email) {
      fetchAppointments();
    }
  }, [user?.email]);

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

  const upcomingAppointments = appointments.filter(apt => new Date(apt.startTime) >= new Date());
  const pastAppointments = appointments.filter(apt => new Date(apt.startTime) < new Date());

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={() => signOut()}
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Appointments</h3>
                <Link
                  href="/book"
                  className="text-accent hover:text-accent/90 text-sm font-medium"
                >
                  Book New Appointment
                </Link>
              </div>
              {loadingAppointments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto"></div>
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{apt.serviceName}</p>
                          <p className="text-sm text-gray-500">with {apt.staffName}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(apt.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(apt.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            {' - '}
                            {new Date(apt.endTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Upcoming
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No upcoming appointments</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Past Appointments</h3>
              {loadingAppointments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto"></div>
                </div>
              ) : pastAppointments.length > 0 ? (
                <div className="space-y-4">
                  {pastAppointments.map((apt) => (
                    <div key={apt.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{apt.serviceName}</p>
                          <p className="text-sm text-gray-500">with {apt.staffName}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(apt.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(apt.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            {' - '}
                            {new Date(apt.endTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No past appointments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
