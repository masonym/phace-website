'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Staff {
  id: string;
  name: string;
  bio?: string;
  image?: string;
}

interface Props {
  variationId: string;
  onSelect: (staff: Staff) => void;
  onBack: () => void;
}

export default function StaffSelection({ variationId, onSelect, onBack }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch(`/api/booking/staff?serviceId=${variationId}`);
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
  }, [variationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading staff...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Choose Your Provider</h1>
        <p className="text-center text-gray-600 mb-8">
          Select a staff member for your treatment
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
        Back to Services
      </button>

      {/* No Staff Available Message */}
      {staff.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <h3 className="text-xl font-medium mb-3 text-amber-800">No Providers Available</h3>
          <p className="text-amber-700 mb-4">
            We don't have any providers available for this service at the moment.
            Please select a different service or contact us to inquire about availability.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
            >
              Choose Another Service
            </button>
            <a
              href="/contact"
              className="px-6 py-2 border border-accent text-accent rounded-md hover:bg-accent/10 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      )}

      {/* Staff Grid */}
      {staff.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staff.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect(member)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center space-x-4">
                {member.image && (
                  <div className="relative h-20 w-20 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">
                    {member.name}
                  </h3>
                  {member.bio && (
                    <p className="text-gray-600 line-clamp-2">{member.bio}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
