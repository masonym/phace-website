'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import StaffForm from '@/components/admin/StaffForm';
import BlockTimeForm from '@/components/admin/BlockTimeForm';
import { useAuth } from '@/hooks/useAuth';

interface Staff {
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
}

interface BlockedTime {
  id: string;
  startTime: string;
  endTime: string;
  reason?: string;
  recurring?: {
    frequency: 'daily' | 'weekly';
    until: string;
  };
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showBlockTimeForm, setShowBlockTimeForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch('/api/booking/staff');
        if (!response.ok) throw new Error('Failed to fetch staff');
        const data = await response.json();
        setStaff(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  useEffect(() => {
    const fetchBlockedTimes = async () => {
      if (!selectedStaff) return;

      try {
        const startDate = new Date().toISOString();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 2);
        
        const response = await fetch(
          `/api/booking/staff/blocked-time?staffId=${selectedStaff.id}&startDate=${startDate}&endDate=${endDate.toISOString()}`
        );
        if (!response.ok) throw new Error('Failed to fetch blocked times');
        const data = await response.json();
        setBlockedTimes(data);
      } catch (err: any) {
        console.error('Error fetching blocked times:', err);
      }
    };

    fetchBlockedTimes();
  }, [selectedStaff]);

  const handleCreateStaff = () => {
    setSelectedStaff(null);
    setShowStaffForm(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowStaffForm(true);
  };

  const handleBlockTime = () => {
    if (!selectedStaff) return;
    setShowBlockTimeForm(true);
  };

  const handleDeleteBlockedTime = async (startTime: string) => {
    if (!selectedStaff) return;

    try {
      const response = await fetch('/api/booking/staff/blocked-time', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          startTime,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete blocked time');

      // Refresh blocked times
      const updatedTimes = blockedTimes.filter(time => time.startTime !== startTime);
      setBlockedTimes(updatedTimes);
    } catch (err: any) {
      console.error('Error deleting blocked time:', err);
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
          <h1 className="text-3xl font-semibold">Staff Management</h1>
          <button
            onClick={handleCreateStaff}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Add Staff Member
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Staff List */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-medium mb-4">Staff Members</h2>
              <div className="space-y-4">
                {staff.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedStaff(member)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedStaff?.id === member.id
                        ? 'bg-accent text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {member.image && (
                        <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm opacity-75">{member.email}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Staff Details and Blocked Times */}
          <div className="col-span-8">
            {selectedStaff ? (
              <div className="space-y-6">
                {/* Staff Details */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-medium">{selectedStaff.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedStaff.bio}</p>
                    </div>
                    <div className="space-x-4">
                      <button
                        onClick={() => handleEditStaff(selectedStaff)}
                        className="text-accent hover:text-accent/80 transition-colors"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={handleBlockTime}
                        className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
                      >
                        Block Time
                      </button>
                    </div>
                  </div>

                  {/* Default Availability */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Default Availability</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedStaff.defaultAvailability.map((availability) => (
                        <div
                          key={availability.dayOfWeek}
                          className="bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="font-medium">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                              availability.dayOfWeek
                            ]}
                          </div>
                          <div className="text-sm text-gray-600">
                            {availability.startTime} - {availability.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blocked Times */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Blocked Times</h3>
                    <div className="space-y-3">
                      {blockedTimes.map((blocked) => (
                        <div
                          key={blocked.id}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">
                              {new Date(blocked.startTime).toLocaleDateString()} -{' '}
                              {new Date(blocked.endTime).toLocaleDateString()}
                            </div>
                            {blocked.reason && (
                              <div className="text-sm text-gray-600">
                                {blocked.reason}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteBlockedTime(blocked.startTime)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
                Select a staff member to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Form Modal */}
      {showStaffForm && (
        <StaffForm
          staff={selectedStaff}
          onClose={() => setShowStaffForm(false)}
          onSubmit={async () => {
            setShowStaffForm(false);
            // Refresh the staff list
            const response = await fetch('/api/booking/staff');
            const data = await response.json();
            setStaff(data);
          }}
        />
      )}

      {/* Block Time Form Modal */}
      {showBlockTimeForm && selectedStaff && (
        <BlockTimeForm
          staffId={selectedStaff.id}
          onClose={() => setShowBlockTimeForm(false)}
          onSubmit={async () => {
            setShowBlockTimeForm(false);
            // Refresh blocked times
            const startDate = new Date().toISOString();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 2);
            
            const response = await fetch(
              `/api/booking/staff/blocked-time?staffId=${selectedStaff.id}&startDate=${startDate}&endDate=${endDate.toISOString()}`
            );
            const data = await response.json();
            setBlockedTimes(data);
          }}
        />
      )}
    </AdminLayout>
  );
}
