'use client';

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventClickArg, EventSourceFuncArg, EventInput } from '@fullcalendar/core';
import { Loader2, X } from 'lucide-react';
import { adminFetch } from '@/lib/auth/clientSession';
import { formatClinicTime } from '@/lib/utils/clinicTime';
import { OPENING_HOURS } from '@/lib/config/clinicInfo';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { splitSellerNote } from '@/lib/utils/bookingNotes';
import type { AdminAppointment, AdminStaffMember } from '@/lib/services/adminBookingService';

// Distinguishes staff members when everyone's appointments are shown together
const STAFF_COLOURS = ['#8A6A5B', '#59637E', '#6B8E6B', '#A86F62', '#7A6A9B', '#4F8A8B'];
const CANCELLED_COLOUR = '#9CA3AF';

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
    ACCEPTED: { text: 'Confirmed', className: 'bg-green-100 text-green-800' },
    PENDING: { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    CANCELLED_BY_CUSTOMER: { text: 'Cancelled by client', className: 'bg-gray-100 text-gray-700' },
    CANCELLED_BY_SELLER: { text: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
    NO_SHOW: { text: 'No-show', className: 'bg-red-100 text-red-800' },
};

const isCancelled = (status: string) => status.startsWith('CANCELLED');

const DAY_INDEX: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

// Shade the hours the clinic is closed, and show an hour either side of the longest day
const BUSINESS_HOURS = OPENING_HOURS
    .filter(h => h.opens && h.closes)
    .map(h => ({ daysOfWeek: [DAY_INDEX[h.day]], startTime: h.opens!, endTime: h.closes! }));

function padHour(time: string, hours: number): string {
    const hour = Math.min(24, Math.max(0, Number(time.split(':')[0]) + hours));
    return `${String(hour).padStart(2, '0')}:00:00`;
}
const SLOT_MIN = padHour(BUSINESS_HOURS.map(h => h.startTime).sort()[0] ?? '09:00', -1);
const SLOT_MAX = padHour(BUSINESS_HOURS.map(h => h.endTime).sort().reverse()[0] ?? '18:00', 1);

export default function CalendarPage() {
    const [staff, setStaff] = useState<AdminStaffMember[]>([]);
    const [staffId, setStaffId] = useState('');
    const [showCancelled, setShowCancelled] = useState(false);
    const [selected, setSelected] = useState<AdminAppointment | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const isSmallScreen = useMediaQuery('(max-width: 640px)');

    useEffect(() => {
        adminFetch('/api/admin/staff')
            .then(async response => {
                if (!response.ok) throw new Error('Failed to load staff');
                setStaff(await response.json());
            })
            .catch(err => setError(err.message));
    }, []);

    const staffColour = useCallback((id: string) => {
        const index = staff.findIndex(s => s.id === id);
        return STAFF_COLOURS[(index === -1 ? 0 : index) % STAFF_COLOURS.length];
    }, [staff]);

    // A new function identity makes FullCalendar refetch, so filters apply immediately
    const fetchEvents = useCallback(async (info: EventSourceFuncArg): Promise<EventInput[]> => {
        setError('');
        const params = new URLSearchParams({ start: info.start.toISOString(), end: info.end.toISOString() });
        if (staffId) params.set('staffId', staffId);

        const response = await adminFetch(`/api/admin/appointments?${params}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            setError(data.error || 'Failed to load appointments');
            return [];
        }

        return (data as AdminAppointment[])
            .filter(a => showCancelled || !isCancelled(a.status))
            .map(a => {
                const colour = isCancelled(a.status) ? CANCELLED_COLOUR : staffColour(a.staffId);
                return {
                    id: a.id,
                    title: `${a.customer.name ?? 'Client'} – ${a.services.join(', ') || 'Appointment'}`,
                    start: a.startAt,
                    end: a.endAt,
                    backgroundColor: colour,
                    borderColor: colour,
                    classNames: isCancelled(a.status) ? ['line-through', 'opacity-75'] : [],
                    extendedProps: { appointment: a },
                };
            });
    }, [staffId, showCancelled, staffColour]);

    const handleEventClick = (info: EventClickArg) => {
        setSelected(info.event.extendedProps.appointment as AdminAppointment);
    };

    const bookableStaff = staff.filter(s => s.isBookable);

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold">Calendar</h1>
                    {isLoading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" aria-label="Loading" />}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={showCancelled}
                            onChange={(e) => setShowCancelled(e.target.checked)}
                            className="rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        Show cancelled
                    </label>
                    <select
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                        aria-label="Staff member"
                        className="block w-full sm:w-56 px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                    >
                        <option value="">All staff</option>
                        {bookableStaff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!staffId && bookableStaff.length > 1 && (
                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    {bookableStaff.map(s => (
                        <span key={s.id} className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: staffColour(s.id) }} />
                            {s.name}
                        </span>
                    ))}
                </div>
            )}

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">{error}</div>}

            <div className="bg-white rounded-lg shadow p-2 sm:p-4 calendar-container">
                <FullCalendar
                    key={isSmallScreen ? 'small' : 'large'}
                    plugins={[dayGridPlugin, timeGridPlugin]}
                    initialView={isSmallScreen ? 'timeGridDay' : 'timeGridWeek'}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: isSmallScreen ? 'timeGridDay,dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    events={fetchEvents}
                    loading={setIsLoading}
                    eventClick={handleEventClick}
                    businessHours={BUSINESS_HOURS}
                    slotMinTime={SLOT_MIN}
                    slotMaxTime={SLOT_MAX}
                    allDaySlot={false}
                    nowIndicator
                    height="auto"
                />
            </div>

            <p className="mt-4 text-sm text-gray-500">
                Appointments come from Square. Reschedule, cancel or add bookings in the Square Dashboard or app.
            </p>

            {selected && <AppointmentDetail appointment={selected} onClose={() => setSelected(null)} />}

            <style jsx global>{`
                .calendar-container .fc-event {
                    cursor: pointer;
                }
                @media (max-width: 640px) {
                    .calendar-container .fc .fc-toolbar {
                        flex-direction: column;
                        gap: 0.75rem;
                    }
                    .calendar-container .fc .fc-toolbar-title {
                        font-size: 1.2rem;
                    }
                    .calendar-container .fc .fc-button {
                        padding: 0.2rem 0.5rem;
                        font-size: 0.875rem;
                    }
                }
            `}</style>
        </div>
    );
}

function AppointmentDetail({ appointment, onClose }: { appointment: AdminAppointment; onClose: () => void }) {
    const status = STATUS_LABELS[appointment.status] ?? { text: appointment.status, className: 'bg-gray-100 text-gray-700' };
    const { details, consent } = splitSellerNote(appointment.sellerNote);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-title"
                className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start p-6 border-b">
                    <div>
                        <h2 id="appointment-title" className="text-xl font-semibold">
                            {appointment.services.join(', ') || 'Appointment'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {formatClinicTime(appointment.startAt, 'cccc, LLLL d, yyyy')} &middot;{' '}
                            {formatClinicTime(appointment.startAt, 'h:mm a')} – {formatClinicTime(appointment.endAt, 'h:mm a')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${status.className}`}>{status.text}</span>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <section>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Client</h3>
                            <p className="text-gray-900">{appointment.customer.name || '-'}</p>
                            {appointment.customer.email && (
                                <a href={`mailto:${appointment.customer.email}`} className="block text-sm text-accent hover:underline">
                                    {appointment.customer.email}
                                </a>
                            )}
                            {appointment.customer.phone && (
                                <a href={`tel:${appointment.customer.phone}`} className="block text-sm text-accent hover:underline">
                                    {appointment.customer.phone}
                                </a>
                            )}
                        </section>
                        <section>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">With</h3>
                            <p className="text-gray-900">{appointment.staffName}</p>
                            {appointment.addons.length > 0 && (
                                <>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-4 mb-2">Add-ons</h3>
                                    <ul className="text-sm text-gray-700 list-disc list-inside">
                                        {appointment.addons.map((addon, i) => <li key={i}>{addon}</li>)}
                                    </ul>
                                </>
                            )}
                        </section>
                    </div>

                    {appointment.customerNote && (
                        <section>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Note from client</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{appointment.customerNote}</p>
                        </section>
                    )}

                    {details && (
                        <section>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Booking notes</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-md p-3">{details}</p>
                        </section>
                    )}

                    {consent && (
                        <section>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Consent form answers</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-md p-3 max-h-80 overflow-y-auto">{consent}</p>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
