'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatClinicTime } from '@/lib/utils/clinicTime';
import { CLINIC, CLINIC_ADDRESS_ONE_LINE } from '@/lib/config/clinicInfo';

interface AppointmentDetails {
  id: string;
  clientName: string;
  serviceNames: string[];
  staffName: string;
  startTime: string;
  endTime?: string;
  totalDuration?: number;
  totalPrice: number;
}

// Calendar formats want UTC like 20261007T170000Z
function toCalendarStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function appointmentEnd(appointment: AppointmentDetails): string {
  if (appointment.endTime) return appointment.endTime;
  const minutes = appointment.totalDuration || 60;
  return new Date(new Date(appointment.startTime).getTime() + minutes * 60000).toISOString();
}

function googleCalendarUrl(appointment: AppointmentDetails): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${appointment.serviceNames.join(', ')} at Phace`,
    dates: `${toCalendarStamp(appointment.startTime)}/${toCalendarStamp(appointmentEnd(appointment))}`,
    location: CLINIC_ADDRESS_ONE_LINE,
    details: `With ${appointment.staffName}. Need to change it? Call ${CLINIC.phoneDisplay} at least 24 hours ahead.`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs(appointment: AppointmentDetails) {
  const escape = (value: string) => value.replace(/[,;\\]/g, (m) => `\\${m}`);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Phace//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@phace.ca`,
    `DTSTAMP:${toCalendarStamp(new Date().toISOString())}`,
    `DTSTART:${toCalendarStamp(appointment.startTime)}`,
    `DTEND:${toCalendarStamp(appointmentEnd(appointment))}`,
    `SUMMARY:${escape(`${appointment.serviceNames.join(', ')} at Phace`)}`,
    `LOCATION:${escape(CLINIC_ADDRESS_ONE_LINE)}`,
    `DESCRIPTION:${escape(`With ${appointment.staffName}. Need to change it? Call ${CLINIC.phoneDisplay} at least 24 hours ahead.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'phace-appointment.ics';
  link.click();
  URL.revokeObjectURL(url);
}

export default function BookingConfirmedPage() {
  const searchParams = useSearchParams();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const appointmentId = searchParams.get('id');
    if (!appointmentId) {
      setError('No appointment ID provided');
      setLoading(false);
      return;
    }

    const fetchAppointmentDetails = async () => {
      try {
        const response = await fetch(`/api/booking/appointments/${appointmentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch appointment details');
        }
        const data = await response.json();
        setAppointment(data);
      } catch (err) {
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-[#FFFBF0] pt-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-8">{error || 'Something went wrong'}</p>
          <Link
            href="/book"
            className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
          >
            Book Another Appointment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFBF0] pt-24">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for booking with us. We've sent a confirmation email with these details.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-t border-b border-gray-200 py-4">
              <h2 className="text-xl font-semibold mb-4">Appointment Details</h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service</dt>
                  {appointment.serviceNames.map((serviceName) => (
                    <dd key={serviceName} className="mt-1 text-sm text-gray-900">
                      {serviceName}
                    </dd>
                  ))}
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Staff Member</dt>
                  <dd className="mt-1 text-sm text-gray-900">{appointment.staffName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatClinicTime(appointment.startTime, 'cccc, LLLL d, yyyy')}
                    <br />
                    {formatClinicTime(appointment.startTime, 'h:mm a')} (Pacific Time)
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${typeof appointment.totalPrice === 'number'
                      ? (appointment.totalPrice / 100).toFixed(2)
                      : Number(appointment.totalPrice / 100).toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={googleCalendarUrl(appointment)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center border border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent/10 transition-colors"
              >
                Add to Google Calendar
              </a>
              <button
                onClick={() => downloadIcs(appointment)}
                className="inline-block border border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent/10 transition-colors"
              >
                Add to Apple / Outlook Calendar
              </button>
            </div>

            <div className="rounded-lg bg-[#FFFBF0] border border-[#DEC3C5] p-4 text-sm text-gray-700 space-y-2">
              <p>
                <span className="font-medium text-gray-900">Where:</span> {CLINIC_ADDRESS_ONE_LINE}{' '}
                <a href={CLINIC.directionsUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                  Get directions
                </a>
              </p>
              <p>
                Need to cancel or reschedule? Please call{' '}
                <a href={CLINIC.phoneHref} className="text-accent underline">{CLINIC.phoneDisplay}</a> at least 24 hours
                before your appointment. Late changes are charged 50% of the service price.{' '}
                <Link href="/booking-policy" className="text-accent underline">Booking policy</Link>
              </p>
            </div>

            <div className="text-center space-y-4">
              <Link
                href="/book"
                className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
              >
                Book Another Appointment
              </Link>
              <p className="text-sm text-gray-500">
                Need to make changes?{' '}
                <a href="/contact" className="text-accent hover:underline">
                  Contact us
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
