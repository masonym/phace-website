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
    <div style={{ margin: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '300', textAlign: 'center', marginBottom: '10px' }}>Review Your Booking</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Please review your appointment details
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          marginBottom: '20px',
          color: '#3498db',
          cursor: 'pointer',
          textDecoration: 'none',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          backgroundColor: '#f1f1f1'
        }}
      >
        <svg
          style={{ width: '20px', height: '20px', marginRight: '10px' }}
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

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
        {/* Service Details */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '10px' }}>Service Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#666' }}>Service</p>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>{bookingData.serviceName}</p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#666' }}>Provider</p>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>{bookingData.staffName}</p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#666' }}>Date & Time</p>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>
                {bookingData.dateTime && format(new Date(bookingData.dateTime), 'PPpp')}
              </p>
            </div>
          </div>
        </div>

        {/* Add-ons */}
        {addons.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '10px' }}>Additional Services</h2>
            <div style={{ marginBottom: '20px' }}>
              {addons.map((addon) => (
                <div key={addon.id} style={{ backgroundColor: '#f7f7f7', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '500' }}>{addon.name}</p>
                      <p style={{ fontSize: '14px', color: '#666' }}>{addon.description}</p>
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>{addon.duration} minutes</p>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '500' }}>${addon.price}</p>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>Additional Time</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>{calculateTotalDuration()} minutes</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>Additional Cost</p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>${calculateTotalPrice()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client Details */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '10px' }}>Client Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#666' }}>Name</p>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>{bookingData.clientName}</p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#666' }}>Email</p>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>{bookingData.clientEmail}</p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#666' }}>Phone</p>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>{bookingData.clientPhone}</p>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div style={{ backgroundColor: '#f8e7e1', padding: '20px', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '10px' }}>Cancellation Policy</h3>
          <div style={{ fontSize: '14px', color: '#666' }}>
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
          <div style={{ backgroundColor: '#ffe6e6', color: '#ff3737', padding: '20px', borderRadius: '10px' }}>
            {error}
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            backgroundColor: '#3498db',
            color: '#fff',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            ...loading ? { opacity: 0.5, cursor: 'not-allowed' } : { hover: { backgroundColor: '#2e6da4' } }
          }}
        >
          {loading ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
