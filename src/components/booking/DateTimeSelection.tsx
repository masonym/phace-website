'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, isAfter, isBefore } from 'date-fns';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface Props {
  serviceId: string;
  staffId: string;
  onSelect: (dateTime: string) => void;
  onBack: () => void;
}

export default function DateTimeSelection({ serviceId, staffId, onSelect, onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate the date range for the calendar
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(addMonths(currentMonth, 1)); // Show two months
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  // Fetch available time slots when a date is selected
  useEffect(() => {
    if (!selectedDate) return;

    const fetchTimeSlots = async () => {
      try {
        const response = await fetch(
          `/api/booking/availability?serviceId=${serviceId}&staffId=${staffId}&date=${format(selectedDate, 'yyyy-MM-dd')}`
        );
        if (!response.ok) throw new Error('Failed to fetch time slots');
        const data = await response.json();
        setAvailableTimeSlots(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [selectedDate, serviceId, staffId]);

  const tomorrow = addDays(new Date(), 1);
  const twoMonthsFromNow = addMonths(new Date(), 2);

  const isDateSelectable = (date: Date) => {
    return isAfter(date, tomorrow) && isBefore(date, twoMonthsFromNow);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Choose Your Date & Time</h1>
        <p className="text-center text-gray-600 mb-8">
          Select an available time slot for your appointment
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
        Back to Staff Selection
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
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
              const isSelectable = isDateSelectable(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);

              return (
                <button
                  key={i}
                  onClick={() => isSelectable && setSelectedDate(date)}
                  disabled={!isSelectable}
                  className={`
                    py-2 rounded-full text-sm
                    ${isSelected ? 'bg-accent text-white' : ''}
                    ${isSelectable ? 'hover:bg-accent/10' : 'text-gray-300 cursor-not-allowed'}
                  `}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a Date'}
          </h2>

          {selectedDate ? (
            loading ? (
              <div className="text-center py-8">Loading time slots...</div>
            ) : error ? (
              <div className="text-red-600 text-center py-8">{error}</div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No available time slots for this date
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableTimeSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => onSelect(slot.startTime)}
                    disabled={!slot.available}
                    className={`
                      py-3 px-4 rounded-lg text-center
                      ${
                        slot.available
                          ? 'bg-[#F8E7E1] text-gray-900 hover:bg-accent hover:text-white transition-colors'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {format(new Date(slot.startTime), 'h:mm a')}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              Please select a date to view available time slots
            </div>
          )}
        </div>
      </div>
    </div>
  );
}