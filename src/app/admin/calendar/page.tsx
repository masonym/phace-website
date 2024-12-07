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
        `/api/booking/appointments?staffId=${selectedStaffId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
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
        consentFormResponses: apt.consentFormResponses || []
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

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Staff Calendar</h1>
          <StaffSelector
            selectedStaffId={selectedStaffId}
            onStaffSelect={setSelectedStaffId}
          />
        </div>

        {selectedStaffId ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                slotMinTime="09:00:00"
                slotMaxTime="18:00:00"
                events={appointments}
                eventClick={handleEventClick}
                height="auto"
                allDaySlot={false}
                slotDuration="00:15:00"
                slotLabelInterval="01:00"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Please select a staff member to view their calendar</p>
          </div>
        )}

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">Appointment Details</h2>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Client</label>
                    <p className="mt-1">{selectedAppointment.clientName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1">{selectedAppointment.clientEmail}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Service</label>
                    <p className="mt-1">{selectedAppointment.serviceName}</p>
                  </div>
                  {selectedAppointment.addons.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Add-ons</label>
                      <ul className="mt-1 space-y-1">
                        {selectedAppointment.addons.map((addon) => (
                          <li key={addon.id} className="text-sm flex justify-between">
                            <span>{addon.name}</span>
                            <span>${addon.price.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Total Price</label>
                    <p className="mt-1 text-lg font-semibold">${selectedAppointment.totalPrice.toFixed(2)}</p>
                  </div>
                  {selectedAppointment.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Additional Notes</label>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{selectedAppointment.notes}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Time</label>
                    <p className="mt-1">
                      {format(parseISO(selectedAppointment.start), 'PPpp')} -{' '}
                      {format(parseISO(selectedAppointment.end), 'p')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                      selectedAppointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                    </span>
                  </div>
                  {selectedAppointment.consentFormResponses && selectedAppointment.consentFormResponses.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Consent Form Responses</label>
                      <div className="space-y-4">
                        {selectedAppointment.consentFormResponses.map((form, formIndex) => (
                          <div key={form.formId} className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-2">{form.formTitle}</h4>
                            <div className="space-y-2">
                              {form.responses.map((response, responseIndex) => (
                                <div key={response.questionId} className="text-sm">
                                  <p className="text-gray-600 font-medium">{response.question}</p>
                                  <p className="text-gray-900 mt-1">{response.answer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
