'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatClinicTime } from '@/lib/utils/clinicTime';
import { showToast } from '@/components/ui/Toast';
import { BookingData } from '@/app/book/page';

interface ServiceVariation {
  id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isActive: boolean;
  variationId: string;
  variations?: ServiceVariation[];
}

interface Props {
  bookingData: BookingData;
  onConfirm: () => Promise<void>;
  onBack: () => void;
}

export default function BookingSummary({ bookingData, onConfirm, onBack }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      showToast({
        title: "Booking Error",
        description: error.message || "There was an error creating your booking. Please try again.",
        status: "error",
        duration: 5000,
      });
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formattedDate = bookingData.dateTime
    ? formatClinicTime(bookingData.dateTime, 'cccc, LLLL d, yyyy')
    : 'Not selected';

  // Format time for display
  const formattedTime = bookingData.dateTime
    ? `${formatClinicTime(bookingData.dateTime, 'h:mm a')} (Pacific Time)`
    : 'Not selected';

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <span className="mr-2">←</span> Back
        </button>
        <h2 className="text-2xl font-bold mt-2">Review Your Booking</h2>
        <p className="text-gray-600">Please review your booking details before confirming.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">Service</h4>
                <p className="text-gray-900">{bookingData.serviceName || 'Not selected'}</p>
                {bookingData.variationName && (
                  <p className="text-sm text-gray-600">
                    Variation: {bookingData.variationName}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Staff</h4>
                <p className="text-gray-900">{bookingData.staffName || 'Not selected'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">Date</h4>
                <p className="text-gray-900">{formattedDate}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Time</h4>
                <p className="text-gray-900">{formattedTime}</p>
              </div>
            </div>

            {bookingData.addons && bookingData.addons.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700">Add-ons</h4>
                <ul className="text-gray-900 space-y-1">
                  {bookingData.addons.map((addon) => (
                    <li key={addon.id} className="flex justify-between gap-4">
                      <span>{addon.name}</span>
                      <span className="text-gray-600">+${(addon.price / 100).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">Client Name</h4>
                <p className="text-gray-900">{bookingData.clientName || 'Not provided'}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Contact Information</h4>
                <p className="text-gray-900">{bookingData.clientEmail || 'No email provided'}</p>
                <p className="text-gray-900">{bookingData.clientPhone || 'No phone provided'}</p>
              </div>
            </div>

            {bookingData.notes && (
              <div>
                <h4 className="font-medium text-gray-700">Notes</h4>
                <p className="text-gray-900">{bookingData.notes}</p>
              </div>
            )}

            {/* Price information */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center font-medium">
                <span>Service Price:</span>
                <span>
                  ${bookingData.variation
                    ? ((bookingData.variation.price || 0) / 100).toFixed(2)
                    : ((bookingData.service?.price || 0) / 100).toFixed(2)}
                </span>
              </div>
              {/* Add add-on prices here if available */}
              <div className="flex justify-between items-center font-medium">
                <span>Add-ons Price:</span>
                <span>
                  ${bookingData.addons
                    ? (bookingData.addons.reduce((total, addon) => total + addon.price, 0) / 100).toFixed(2)
                    : 0}
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg mt-2">
                <span>Total:</span>
                <span>
                  ${((
                    (bookingData.variation
                      ? (bookingData.variation.price || 0)
                      : (bookingData.service?.price || 0)) +
                    (bookingData.addons
                      ? bookingData.addons.reduce((total, addon) => total + addon.price, 0)
                      : 0)
                  ) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-[#FFFBF0] border border-[#DEC3C5] p-4 text-sm text-gray-700">
            <p>
              Your card won&apos;t be charged today. Please give us at least 24 hours&apos; notice to cancel or
              reschedule. Late changes are charged 50% of the service price, and missed appointments are
              charged in full.{' '}
              <Link href="/booking-policy" target="_blank" className="text-accent underline">
                Booking policy
              </Link>
            </p>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`px-6 py-3 bg-accent text-white font-semibold rounded-md hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent flex-1 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
