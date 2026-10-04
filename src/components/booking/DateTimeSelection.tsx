'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  endOfDay,
  addDays,
  startOfTomorrow,
} from 'date-fns';
import WaitlistForm from './WaitlistForm';
import { showToast } from "@/components/ui/Toast";
import { BookingCache } from '@/lib/cache/bookingCache';
import { formatClinicTime, isOutsideClinicTimeZone } from '@/lib/utils/clinicTime';

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
  /** Previously chosen slot, so going back keeps the same day selected */
  initialDateTime?: string;
  onSelect: (dateTime: string) => void;
  onBack: () => void;
}

const loadingVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

export default function DateTimeSelection({
  serviceId,
  variationId,
  staffId,
  addons,
  initialDateTime,
  onSelect,
  onBack,
}: DateTimeSelectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    initialDateTime ? startOfDay(parseISO(initialDateTime)) : null
  );
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [checkingDates, setCheckingDates] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialDateTime) {
      return startOfMonth(parseISO(initialDateTime));
    }
    const today = new Date();
    const lastDayOfMonth = endOfMonth(today);

    // If today is the last day of the month, show next month
    if (isSameDay(today, lastDayOfMonth)) {
      return addMonths(startOfMonth(today), 1);
    }

    return startOfMonth(today);
  });
  const [checkedMonths, setCheckedMonths] = useState<Set<string>>(new Set());
  const WAITLIST_URL = process.env.NEXT_PUBLIC_WAITLIST_URL;

  // Calculate the date range for the calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const dates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const maxDate = addMonths(startOfDay(new Date()), 4);
  const canGoToPrevMonth = isAfter(currentMonth, startOfMonth(new Date()));
  const canGoToNextMonth = isBefore(addMonths(currentMonth, 1), maxDate);

  // Until the person picks a month themselves, open on the first day that has openings
  const autoPick = useRef(!initialDateTime);
  const autoAdvanceCount = useRef(0);
  const [noAvailabilityFound, setNoAvailabilityFound] = useState(false);

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
        const tomorrow = startOfTomorrow();

        const datesInRange = eachDayOfInterval({ start: startDate, end: endDate })
          .filter(date => isAfter(date, tomorrow) || isSameDay(date, tomorrow));

        console.log(`Checking availability for ${datesInRange.length} dates (filtered out past dates)`);

        // Batch API calls by week to reduce number of requests
        const batchSize = 7; // One week at a time
        const batches = [];

        for (let i = 0; i < datesInRange.length; i += batchSize) {
          batches.push(datesInRange.slice(i, i + batchSize));
        }

        const newAvailableDates = new Set<string>(availableDates);
        const newFullyBookedDates = new Set<string>(fullyBookedDates);

        // Process all batches concurrently
        const batchResults = await Promise.all(
          batches.map(async (batch) => {
            const batchStart = format(batch[0], 'yyyy-MM-dd');
            const batchEnd = format(batch[batch.length - 1], 'yyyy-MM-dd');

            const params = new URLSearchParams({
              start: batchStart,
              end: batchEnd,
              staffId,
              serviceId,
              ...(variationId && { variationId }),
              ...(addons.length > 0 && { addons: addons.join(',') }),
            });

            try {
              const res = await fetch(`/api/booking/availability?${params}`);
              if (!res.ok) throw new Error('Request failed');
              const json = await res.json();
              console.log(`Batch availability for ${batchStart}–${batchEnd}:`, json.slotsByDate);
              return (json.slotsByDate ?? {}) as Record<string, any[]>;
            } catch (err) {
              console.error(`Batch availability error for ${batchStart}–${batchEnd}:`, err);
              return {} as Record<string, any[]>;
            }
          })
        );

        for (const slotsByDate of batchResults) {
          for (const date in slotsByDate) {
            if (slotsByDate[date]?.length > 0) {
              newAvailableDates.add(date);
              BookingCache.set(
                `availability_${staffId}_${serviceId}_${date}`,
                { slots: slotsByDate[date] },
                2 * 60 * 1000
              );
            } else {
              newFullyBookedDates.add(date);
            }
          }
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
    const start = format(startOfDay(date), 'yyyy-MM-dd');
    const end = start;

    console.log(`Fetching time slots for ${start} to ${end} for service ${serviceId}, variation ${variationId}, staff ${staffId}`);
    try {
      // Use the BookingCache to get availability data (either from cache or fresh)
      const data: AvailabilityResponse = await BookingCache.getAvailability(
        staffId,
        serviceId,
        start,
        async () => {
          const searchParams = new URLSearchParams({
            start: start,
            end: end,
            serviceId,
            ...(variationId && { variationId }),
            staffId,
            ...(addons.length > 0 && { addons: addons.join(',') }),
          });

          const response = await fetch(`/api/booking/availability?${searchParams}`);
          if (!response.ok) throw new Error('Failed to fetch time slots');
          return await response.json();
        }
      );

      console.log('Time slots:', data.slots);
      setAvailableTimeSlots(data.slots);
      console.log(`Available time slots for ${format(date, 'yyyy-MM-dd')}:`, data.slots);
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

  useEffect(() => {
    if (!autoPick.current || checkingDates) return;
    if (!checkedMonths.has(format(currentMonth, 'yyyy-MM'))) return;

    const firstAvailable = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
      .find(date => availableDates.has(format(date, 'yyyy-MM-dd')));

    if (firstAvailable) {
      autoPick.current = false;
      setSelectedDate(firstAvailable);
    } else if (canGoToNextMonth && autoAdvanceCount.current < 4) {
      autoAdvanceCount.current += 1;
      setCurrentMonth(prev => addMonths(prev, 1));
    } else {
      autoPick.current = false;
      setNoAvailabilityFound(true);
    }
  }, [checkingDates, checkedMonths, currentMonth, availableDates, canGoToNextMonth]);

  const changeMonth = (delta: number) => {
    autoPick.current = false;
    setCurrentMonth(prev => addMonths(prev, delta));
  };

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
            Back
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Calendar */}
            <div className="bg-white rounded-xl p-6 shadow-sm h-fit relative">
              <AnimatePresence>
                {checkingDates && (
                  <motion.div
                    variants={loadingVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-gray-100/70 rounded-xl flex items-center justify-center z-10"
                  >
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mb-2"></div>
                      <p className="text-gray-600">Loading availability...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => changeMonth(-1)}
                    disabled={!canGoToPrevMonth}
                    aria-label="Previous month"
                    className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    disabled={!canGoToNextMonth}
                    aria-label="Next month"
                    className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600" aria-hidden="true">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full border border-gray-300 bg-white" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-100 border border-orange-200" /> Fully booked (join the waitlist)
                </span>
              </div>

              <div className="mt-4 text-sm text-gray-600">
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

              {!selectedDate ? (
                <div className="text-center py-8 text-gray-500">
                  {noAvailabilityFound ? (
                    <p>We don&apos;t have any openings in the next few months for this service.</p>
                  ) : checkingDates ? (
                    <p>Finding the next available date...</p>
                  ) : (
                    <p>Please select a date to view available time slots</p>
                  )}
                </div>
              ) : loading ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Loading time slots...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-3">{error}</p>
                  <button
                    onClick={() => fetchTimeSlots(selectedDate)}
                    className="text-accent underline"
                  >
                    Try again
                  </button>
                </div>
              ) : isDateFullyBooked(selectedDate) || availableTimeSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <p>{isDateFullyBooked(selectedDate) ? 'This date is fully booked.' : 'No available time slots for this date.'}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimeSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => onSelect(slot.startTime)}
                        className={`py-3 px-4 rounded-lg text-center transition-colors ${
                          initialDateTime === slot.startTime
                            ? 'bg-accent text-white'
                            : 'bg-[#F8E7E1] text-gray-900 hover:bg-accent hover:text-white'
                        }`}
                      >
                        {formatClinicTime(slot.startTime, 'h:mm a')}
                      </button>
                    ))}
                  </div>
                  {isOutsideClinicTimeZone() && (
                    <p className="mt-3 text-xs text-gray-500 text-center">Times are shown in Pacific Time.</p>
                  )}
                </>
              )}

              {/* One waitlist prompt for every state, once there's something to react to */}
              {(selectedDate || noAvailabilityFound) && !loading && (
                <div className="mt-6 text-center text-sm text-gray-700 border-t border-gray-100 pt-4">
                  <span>Don&apos;t see a date &amp; time that works for you? </span>
                  {WAITLIST_URL ? (
                    <a
                      href={WAITLIST_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent font-medium underline"
                    >
                      Join the waitlist
                    </a>
                  ) : (
                    <button
                      onClick={() => setShowWaitlist(true)}
                      className="text-accent font-medium underline"
                    >
                      Join the waitlist
                    </button>
                  )}
                </div>
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
