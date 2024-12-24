'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO } from 'date-fns';
import AdminLayout from '@/components/admin/AdminLayout';
import StaffSelector from '@/components/admin/StaffSelector';

interface Appointment {
  id: string;
  title: string;
  start: string;
  end: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  status: string;
  totalPrice: number;
  notes?: string;
  addons: {
    id: string;
    name: string;
    price: number;
  }[];
  consentFormResponses?: {
    formId: string;
    formTitle: string;
    responses: {
      questionId: string;
      question: string;
      answer: string;
    }[];
  }[];
}

export default function CalendarPage() {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedStaffId) {
      fetchAppointments();
    }
  }, [selectedStaffId]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Fetch from 1 month ago
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Fetch until 3 months ahead

      const response = await fetch(
        `/api/booking/appointments?staffId=${selectedStaffId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      const formattedAppointments = data.map((apt: any) => ({
        id: apt.id,
        title: `${apt.clientName} - ${apt.serviceName}`,
        start: apt.startTime,
        end: apt.endTime,
        clientName: apt.clientName,
        clientEmail: apt.clientEmail,
        serviceName: apt.serviceName,
        status: apt.status,
        totalPrice: apt.totalPrice,
        notes: apt.notes,
        addons: apt.addons || [],
        consentFormResponses: apt.consentFormResponses || [],
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (info: any) => {
    const appointment = appointments.find(apt => apt.id === info.event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'green';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-semibold">Calendar</h1>
            <StaffSelector
              onStaffSelect={setSelectedStaffId}
              selectedStaffId={selectedStaffId}
            />
          </div>

          {selectedStaffId ? (
            <div className="bg-white rounded-lg shadow">
              <div className="calendar-container overflow-x-auto">
                <div className="min-w-[800px]">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    events={appointments.map(apt => ({
                      id: apt.id,
                      title: apt.title,
                      start: apt.start,
                      end: apt.end,
                      backgroundColor: getStatusColor(apt.status),
                    }))}
                    eventClick={handleEventClick}
                    height="auto"
                    slotMinTime="09:00:00"
                    slotMaxTime="18:00:00"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-600">Please select a staff member to view their calendar</p>
            </div>
          )}

          {selectedAppointment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-semibold">Appointment Details</h2>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Client Information</h3>
                    <p className="text-gray-600">{selectedAppointment.clientName}</p>
                    <p className="text-gray-600">{selectedAppointment.clientEmail}</p>
                  </div>

                  <div>
                    <h3 className="font-medium">Service</h3>
                    <p className="text-gray-600">{selectedAppointment.serviceName}</p>
                  </div>

                  <div>
                    <h3 className="font-medium">Time</h3>
                    <p className="text-gray-600">
                      {format(parseISO(selectedAppointment.start), 'PPpp')} - {format(parseISO(selectedAppointment.end), 'p')}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium">Status</h3>
                    <p className="text-gray-600">{selectedAppointment.status}</p>
                  </div>

                  <div>
                    <h3 className="font-medium">Total Price</h3>
                    <p className="text-gray-600">${selectedAppointment.totalPrice}</p>
                  </div>

                  {selectedAppointment.addons.length > 0 && (
                    <div>
                      <h3 className="font-medium">Add-ons</h3>
                      <ul className="list-disc list-inside text-gray-600">
                        {selectedAppointment.addons.map(addon => (
                          <li key={addon.id}>
                            {addon.name} (${addon.price})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedAppointment.notes && (
                    <div>
                      <h3 className="font-medium">Notes</h3>
                      <p className="text-gray-600">{selectedAppointment.notes}</p>
                    </div>
                  )}

                  {selectedAppointment.consentFormResponses && selectedAppointment.consentFormResponses.length > 0 && (
                    <div>
                      <h3 className="font-medium">Consent Forms</h3>
                      {selectedAppointment.consentFormResponses.map(form => (
                        <div key={form.formId} className="mt-2">
                          <h4 className="font-medium text-sm">{form.formTitle}</h4>
                          <div className="mt-1 space-y-2">
                            {form.responses.map(response => (
                              <div key={response.questionId}>
                                <p className="text-sm font-medium">{response.question}</p>
                                <p className="text-sm text-gray-600">{response.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx global>{`
          .calendar-container {
            -webkit-overflow-scrolling: touch;
          }
          @media (max-width: 640px) {
            .fc .fc-toolbar {
              flex-direction: column;
              gap: 1rem;
            }
            .fc .fc-toolbar-title {
              font-size: 1.2rem;
            }
            .fc .fc-button {
              padding: 0.2rem 0.5rem;
              font-size: 0.875rem;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}
