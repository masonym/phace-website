'use client';

import { useState } from 'react';
import { format } from 'date-fns';

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

      <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
        {/* Service Details */}
        <div>
          <h2 className="text-lg font-medium mb-4">Service Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="font-medium">{bookingData.serviceName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Provider</p>
              <p className="font-medium">{bookingData.staffName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">
                {bookingData.dateTime && format(new Date(bookingData.dateTime), 'PPpp')}
              </p>
            </div>
          </div>
        </div>

        {/* Client Details */}
        <div>
          <h2 className="text-lg font-medium mb-4">Client Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{bookingData.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{bookingData.clientEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{bookingData.clientPhone}</p>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-[#F8E7E1] p-4 rounded-lg">
          <h3 className="font-medium mb-2">Cancellation Policy</h3>
          <div className="text-sm space-y-2">
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
          className={`
            bg-accent text-white px-8 py-3 rounded-full
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/90'}
            transition-colors
          `}
        >
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
