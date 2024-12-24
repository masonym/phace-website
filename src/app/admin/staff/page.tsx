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
        if (Array.isArray(data)) {
          setBlockedTimes(data);
        } else {
          setBlockedTimes([]);
        }
      } catch (err: any) {
        console.error('Error fetching blocked times:', err);
        setBlockedTimes([]);
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
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-semibold">Staff</h1>
            <button
              onClick={handleCreateStaff}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto"
            >
              Add Staff Member
            </button>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {staff.map(member => (
                <div key={member.id} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                      {member.image && (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden">
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">{member.name}</h3>
                          {!member.isActive && (
                            <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm break-words">{member.email}</p>
                        {member.bio && (
                          <p className="text-gray-600 text-sm break-words">{member.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {member.services.map(serviceId => (
                            <span key={serviceId} className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {/* getServiceNameById(serviceId) */}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedStaff(member)}
                        className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                      >
                        Block Time
                      </button>
                      <button
                        onClick={() => handleEditStaff(member)}
                        className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
