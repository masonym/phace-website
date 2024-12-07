'use client';

import { useState, useEffect } from 'react';

interface Staff {
  id: string;
  name: string;
}

interface StaffSelectorProps {
  selectedStaffId: string;
  onStaffSelect: (staffId: string) => void;
}

export default function StaffSelector({ selectedStaffId, onStaffSelect }: StaffSelectorProps) {
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        const response = await fetch('/api/booking/staff');
        if (!response.ok) {
          throw new Error('Failed to fetch staff members');
        }
        const data = await response.json();
        setStaffMembers(data);
      } catch (error) {
        console.error('Error fetching staff members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffMembers();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-xs animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs">
      <select
        value={selectedStaffId}
        onChange={(e) => onStaffSelect(e.target.value)}
        className="block w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
      >
        <option value="">Select Staff Member</option>
        {staffMembers.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.name}
          </option>
        ))}
      </select>
    </div>
  );
}
