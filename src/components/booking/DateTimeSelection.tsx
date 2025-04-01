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
  isSameMonth,
  startOfDay,
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
  variationId?: string;
  staffId: string;
  addons: string[];
  onSelect: (dateTime: string) => void;
  onBack: () => void;
}

export default function DateTimeSelection({
  serviceId,
  variationId,
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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    const lastDayOfMonth = endOfMonth(today);

    // If today is the last day of the month, show next month
    if (isSameDay(today, lastDayOfMonth)) {
      return addMonths(startOfMonth(today), 1);
    }

    return startOfMonth(today);
  });
  const [checkedMonths, setCheckedMonths] = useState<Set<string>>(new Set());

  // Calculate the date range for the calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const dates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const maxDate = addMonths(startOfDay(new Date()), 2);

  // Fetch available dates for the current month range
  useEffect(() => {
    const checkDateAvailability = async (startDate: Date, endDate: Date) => {
      const currentMonthStr = format(currentMonth, 'yyyy-MM');

      // Skip if we've already checked this month
      if (checkedMonths.has(currentMonthStr)) {
        setCheckingDates(false);
        return;
      }

      setCheckingDates(true);
      try {
        // Filter out past dates before making API calls
        const today = startOfDay(new Date());

        const datesInRange = eachDayOfInterval({ start: startDate, end: endDate })
          .filter(date => isAfter(date, today) || isSameDay(date, today));

        console.log(`Checking availability for ${datesInRange.length} dates (filtered out past dates)`);

        // Batch API calls by week to reduce number of requests
        const batchSize = 7; // One week at a time
        const batches = [];

        for (let i = 0; i < datesInRange.length; i += batchSize) {
          batches.push(datesInRange.slice(i, i + batchSize));
        }

        const newAvailableDates = new Set<string>(availableDates);
        const newFullyBookedDates = new Set<string>(fullyBookedDates);

        // Process each batch sequentially to avoid overwhelming the server
        for (const batch of batches) {
          const batchPromises = batch.map(async (date) => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const params = new URLSearchParams({
              serviceId,
              ...(variationId && { variationId }),
              staffId,
              date: formattedDate,
              ...(addons.length > 0 && { addons: addons.join(',') }),
            });

            try {
              const response = await fetch(`/api/booking/availability?${params}`);
              if (!response.ok) {
                console.error(`Failed to fetch availability for ${formattedDate}: ${response.statusText}`);
                return null;
              }

              const data: AvailabilityResponse = await response.json();
              return { date: formattedDate, data };
            } catch (error) {
              console.error(`Error fetching availability for ${formattedDate}:`, error);
              return null;
            }
          });

          const results = await Promise.all(batchPromises);

          // Update available and fully booked dates
          results.forEach(result => {
            if (!result) return;

            const { date, data } = result;

            if (data.slots.length > 0) {
              newAvailableDates.add(date);
            } else if (data.isFullyBooked) {
              newFullyBookedDates.add(date);
            }
          });

          // Small delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setAvailableDates(newAvailableDates);
        setFullyBookedDates(newFullyBookedDates);
        setCheckedMonths(prev => new Set([...prev, currentMonthStr]));
      } catch (error) {
        console.error('Error checking date availability:', error);
        setError('Failed to load availability. Please try again.');
      } finally {
        setCheckingDates(false);
      }
    };

    checkDateAvailability(monthStart, monthEnd);
  }, [currentMonth, serviceId, variationId, staffId, addons]);

  const fetchTimeSlots = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({
        serviceId,
        ...(variationId && { variationId }),
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
    const today = startOfDay(new Date());

    // Check if date is today or in the future
    const isNotPast = isAfter(date, today) || isSameDay(date, today);

    // Check if the date is in the current calendar view
    const isInCurrentView = isSameMonth(date, currentMonth);

    const isInRange = isBefore(date, maxDate); // No need to check isAfter since we already check isNotPast
    const dateStr = format(date, 'yyyy-MM-dd');

    return isNotPast && isInCurrentView && isInRange && (availableDates.has(dateStr) || fullyBookedDates.has(dateStr));
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

                  // Check if date is in the past
                  const today = startOfDay(new Date());
                  const isPast = isBefore(date, today) && !isSameDay(date, today);

                  // Check if date is in current month view
                  const isInCurrentView = isSameMonth(date, currentMonth);

                  return (
                    <button
                      key={i}
                      onClick={() => isSelectable && setSelectedDate(date)}
                      disabled={!isSelectable}
                      className={`
                        py-2 rounded-full text-sm
                        ${isSelected ? 'bg-accent text-white' : ''}
                        ${isBooked ? 'bg-orange-100 text-orange-900 hover:bg-orange-200' : ''}
                        ${!isInCurrentView
                          ? 'text-gray-300 opacity-0 cursor-default'
                          : isPast
                            ? 'text-gray-300 line-through cursor-not-allowed'
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
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-orange-100 rounded-full"></div>
                  <span>Fully Booked - Waitlist Available</span>
                </div>
                {error && (
                  <div className="mt-2 p-2 bg-red-50 text-red-600 rounded">
                    {error}
                  </div>
                )}
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
          variationId={variationId!}
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
