'use client';

import { useState, useEffect } from 'react';
import { 
  format, 
  parseISO, 
  addMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  isAfter,
  isBefore,
  addDays
} from 'date-fns';
import WaitlistForm from './WaitlistForm';
import { showToast } from "@/components/ui/Toast";

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface AvailabilityResponse {
  slots: TimeSlot[];
  isFullyBooked: boolean;
  staffAvailable: boolean;
}

interface DateTimeSelectionProps {
  serviceId: string;
  staffId: string;
  addons: string[];
  onSelect: (dateTime: string) => void;
  onBack: () => void;
}

export default function DateTimeSelection({
  serviceId,
  staffId,
  addons,
  onSelect,
  onBack,
}: DateTimeSelectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [checkingDates, setCheckingDates] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate the date range for the calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const dates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const maxDate = addMonths(new Date(), 2);

  // Fetch available dates for the current month range
  useEffect(() => {
    const checkDateAvailability = async (startDate: Date, endDate: Date) => {
      setCheckingDates(true);
      try {
        const datePromises = eachDayOfInterval({ start: startDate, end: endDate }).map(async (date) => {
          const formattedDate = format(date, 'yyyy-MM-dd');
          const params = new URLSearchParams({
            serviceId,
            staffId,
            date: formattedDate,
            ...(addons.length > 0 && { addons: addons.join(',') }),
          });

          const response = await fetch(`/api/booking/availability?${params}`);
          if (!response.ok) return;

          const data: AvailabilityResponse = await response.json();
          if (data.staffAvailable) {
            if (data.isFullyBooked) {
              setFullyBookedDates(prev => {
                const newSet = new Set(prev);
                newSet.add(formattedDate);
                return newSet;
              });
            } else if (data.slots.length > 0) {
              setAvailableDates(prev => {
                const newSet = new Set(prev);
                newSet.add(formattedDate);
                return newSet;
              });
            }
          }
        });

        await Promise.all(datePromises);
      } catch (err) {
        console.error('Error checking date availability:', err);
      } finally {
        setCheckingDates(false);
      }
    };

    checkDateAvailability(monthStart, monthEnd);
  }, [currentMonth, serviceId, staffId, addons]);

  const fetchTimeSlots = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({
        serviceId,
        staffId,
        date: format(date, 'yyyy-MM-dd'),
        ...(addons.length > 0 && { addons: addons.join(',') }),
      });

      const response = await fetch(`/api/booking/availability?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch time slots');
      
      const data: AvailabilityResponse = await response.json();
      setAvailableTimeSlots(data.slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const isDateSelectable = (date: Date) => {
    const isCurrentMonth = format(date, 'M') === format(currentMonth, 'M');
    const isInRange = isAfter(date, new Date()) && isBefore(date, maxDate);
    const dateStr = format(date, 'yyyy-MM-dd');
    return isCurrentMonth && isInRange && (availableDates.has(dateStr) || fullyBookedDates.has(dateStr));
  };

  const isDateFullyBooked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return fullyBookedDates.has(dateStr);
  };

  return (
    <div className="space-y-6">
      {!showWaitlist ? (
        <>
          <div>
            <h1 className="text-4xl font-light text-center mb-2">Select Date & Time</h1>
            <p className="text-center text-gray-600 mb-8">
              Choose your preferred appointment date and time.
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
            Back to Add-on Selection
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Calendar */}
            <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                {dates.map((date, i) => {
                  const isSelectable = !checkingDates && isDateSelectable(date);
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isBooked = isDateFullyBooked(date);

                  return (
                    <button
                      key={i}
                      onClick={() => isSelectable && setSelectedDate(date)}
                      disabled={!isSelectable}
                      className={`
                        py-2 rounded-full text-sm
                        ${isSelected ? 'bg-accent text-white' : ''}
                        ${isBooked ? 'bg-orange-100 text-orange-900 hover:bg-orange-200' : ''}
                        ${
                          format(date, 'M') !== format(currentMonth, 'M')
                            ? 'text-gray-300 opacity-0 cursor-default'
                            : isSelectable && !isBooked
                            ? 'hover:bg-accent/10'
                            : !isSelectable && 'text-gray-300 cursor-not-allowed'
                        }
                        ${checkingDates ? 'animate-pulse' : ''}
                      `}
                    >
                      {format(date, 'd')}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 rounded-full"></div>
                  <span>Fully Booked - Waitlist Available</span>
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
              <h2 className="text-lg font-medium mb-4">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a Date'}
              </h2>

              {selectedDate ? (
                loading ? (
                  <div className="text-center py-8">Loading time slots...</div>
                ) : error ? (
                  <div className="text-red-600 text-center py-8">{error}</div>
                ) : isDateFullyBooked(selectedDate) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">This date is fully booked.</p>
                    <button
                      onClick={() => setShowWaitlist(true)}
                      className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
                    >
                      Join the waitlist for this date
                    </button>
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No available time slots for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimeSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => onSelect(slot.startTime)}
                        className="py-3 px-4 rounded-lg text-center bg-[#F8E7E1] text-gray-900 hover:bg-accent hover:text-white transition-colors"
                      >
                        {format(parseISO(slot.startTime), 'h:mm a')}
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-center py-8 text-gray-500">
                  Please select a date to view available time slots
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <WaitlistForm
          serviceId={serviceId}
          staffId={staffId}
          onBack={() => setShowWaitlist(false)}
          onSuccess={() => {
            showToast({
              title: "Success!",
              description: "You have been added to the waitlist! We will contact you when a slot becomes available.",
              status: "success",
              duration: 5000,
            });
            // Add a 2-second delay before redirecting to allow time to read the toast
            setTimeout(() => {
              window.location.href = '/';
            }, 5000);
          }}
        />
      )}
    </div>
  );
}
