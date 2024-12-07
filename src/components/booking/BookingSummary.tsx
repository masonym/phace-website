'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Addon {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface BookingData {
  serviceId?: string;
  serviceName?: string;
  categoryId?: string;
  staffId?: string;
  staffName?: string;
  dateTime?: string;
  addons?: string[];
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  consentForms?: Record<string, any>;
}

interface Props {
  bookingData: BookingData;
  onConfirm: () => Promise<void>;
  onBack: () => void;
}

export default function BookingSummary({ bookingData, onConfirm, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addons, setAddons] = useState<Addon[]>([]);

  useEffect(() => {
    const fetchAddons = async () => {
      if (!bookingData.addons?.length) return;
      try {
        const response = await fetch(`/api/booking/addons/selected?ids=${bookingData.addons.join(',')}`);
        if (!response.ok) throw new Error('Failed to fetch selected add-ons');
        const data = await response.json();
        setAddons(data);
      } catch (err: any) {
        console.error('Error fetching add-ons:', err);
      }
    };

    fetchAddons();
  }, [bookingData.addons]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError('');
      await onConfirm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDuration = () => {
    return addons.reduce((total, addon) => total + addon.duration, 0);
  };

  const calculateTotalPrice = () => {
    return addons.reduce((total, addon) => total + addon.price, 0);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Review Your Booking</h1>
        <p className="text-center text-gray-600 mb-8">
          Please review your appointment details
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
        Back to Consent Forms
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm space-y-8">
        {/* Service Details */}
        <div>
          <h2 className="text-2xl font-light mb-4">Service Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Service</p>
              <p className="text-base font-medium">{bookingData.serviceName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Provider</p>
              <p className="text-base font-medium">{bookingData.staffName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="text-base font-medium">
                {bookingData.dateTime && format(new Date(bookingData.dateTime), 'PPpp')}
              </p>
            </div>
          </div>
        </div>

        {/* Add-ons */}
        {addons.length > 0 && (
          <div>
            <h2 className="text-2xl font-light mb-4">Additional Services</h2>
            <div className="space-y-4">
              {addons.map((addon) => (
                <div key={addon.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-base font-medium">{addon.name}</p>
                      <p className="text-sm text-gray-600">{addon.description}</p>
                      <p className="text-sm text-gray-600 mt-2">{addon.duration} minutes</p>
                    </div>
                    <p className="text-base font-medium">${addon.price}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <p className="text-base font-medium">Additional Time</p>
                  <p className="text-base font-medium">{calculateTotalDuration()} minutes</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-base font-medium">Additional Cost</p>
                  <p className="text-base font-medium">${calculateTotalPrice()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client Details */}
        <div>
          <h2 className="text-2xl font-light mb-4">Client Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-base font-medium">{bookingData.clientName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-base font-medium">{bookingData.clientEmail || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="text-base font-medium">{bookingData.clientPhone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-[#F8E7E1] p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Cancellation Policy</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              • We have a 15-minute grace period but cannot guarantee completion of your full service
              in the remaining time. No refunds will be offered for missed time or shortened service.
            </p>
            <p>
              • After 15 minutes, we will have to cancel and/or reschedule your appointment with a
              late cancel fee of 50% of your service price.
            </p>
            <p>
              • We require at least 24 hours notice to cancel or rebook your appointment.
            </p>
            <p>
              • Appointments cancelled or rescheduled with less than 24 hours notice will result
              in a charge of 50% of your service fee.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <div className="flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`bg-accent text-white px-6 py-2 rounded-lg transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/90'
          }`}
        >
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
