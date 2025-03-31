import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays, parseISO } from 'date-fns';
import { showToast } from "@/components/ui/Toast";

interface WaitlistFormProps {
    variationId: string;
    serviceId: string;
    staffId?: string;
    onBack: () => void;
    onSuccess: () => void;
}

interface WaitlistFormData {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    preferredDates: string[];
}

interface AvailabilityResponse {
    slots: any[];
    isFullyBooked: boolean;
    staffAvailable: boolean;
}

export default function WaitlistForm({ serviceId, variationId, staffId, onBack, onSuccess }: WaitlistFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { register, handleSubmit, formState: { errors } } = useForm<WaitlistFormData>();

    useEffect(() => {
        const fetchAvailableDates = async () => {
            setIsLoading(true);
            const dates: string[] = [];
            let daysChecked = 0;
            let validDatesFound = 0;
            const maxDaysToCheck = 60; // Look up to 60 days ahead
            const desiredValidDates = 14; // We want to show at least 14 valid dates

            while (daysChecked < maxDaysToCheck && validDatesFound < desiredValidDates) {
                const date = addDays(new Date(), daysChecked);
                const formattedDate = format(date, 'yyyy-MM-dd');

                try {
                    const params = new URLSearchParams({
                        serviceId,
                        staffId: staffId || '',
                        date: formattedDate,
                    });

                    const response = await fetch(`/api/booking/availability?${params}`);
                    if (!response.ok) continue;

                    const data: AvailabilityResponse = await response.json();
                    if (data.staffAvailable) {
                        dates.push(formattedDate);
                        validDatesFound++;
                    }
                } catch (error) {
                    console.error('Error checking date availability:', error);
                }

                daysChecked++;
            }

            setAvailableDates(dates);
            setIsLoading(false);
        };

        fetchAvailableDates();
    }, [serviceId, staffId]);

    const handleDateSelect = (date: string) => {
        setSelectedDates(prev => {
            if (prev.includes(date)) {
                return prev.filter(d => d !== date);
            }
            return [...prev, date].sort();
        });
    };

    const onSubmit = async (data: WaitlistFormData) => {
        if (selectedDates.length === 0) {
            showToast({
                title: "Please select at least one preferred date",
                status: "error",
                duration: 5000,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/booking/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    serviceId,
                    preferredDates: selectedDates,
                    preferredStaffIds: staffId ? [staffId] : [],
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit waitlist form');
            }

            onSuccess();
        } catch (error) {
            console.error('Error submitting waitlist form:', error);
            showToast({
                title: "Failed to join waitlist",
                description: "Please try again.",
                status: "error",
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-light text-center mb-2">Join the Waitlist</h1>
                <p className="text-center text-gray-600 mb-8">
                    Select your preferred dates and provide your contact information. We'll notify you when a slot becomes available.
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
                Back to Date & Time Selection
            </button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            type="text"
                            {...register('clientName', { required: 'Name is required' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                        />
                        {errors.clientName && (
                            <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            {...register('clientEmail', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address',
                                },
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                        />
                        {errors.clientEmail && (
                            <p className="mt-1 text-sm text-red-600">{errors.clientEmail.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <input
                            type="tel"
                            {...register('clientPhone', { required: 'Phone number is required' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent"
                        />
                        {errors.clientPhone && (
                            <p className="mt-1 text-sm text-red-600">{errors.clientPhone.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Dates
                        </label>
                        {isLoading ? (
                            <div className="text-center py-4">Loading available dates...</div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {availableDates.map(dateStr => {
                                    const isSelected = selectedDates.includes(dateStr);
                                    return (
                                        <button
                                            key={dateStr}
                                            type="button"
                                            onClick={() => handleDateSelect(dateStr)}
                                            className={`p-3 text-sm rounded-md border ${isSelected
                                                ? 'bg-accent text-white border-accent'
                                                : 'border-gray-300 hover:border-accent'
                                                }`}
                                        >
                                            {format(parseISO(dateStr), 'MMM d, yyyy')}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {selectedDates.length === 0 && (
                            <p className="mt-1 text-sm text-red-600">Please select at least one preferred date</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting || selectedDates.length === 0}
                        className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
                    </button>
                </div>
            </form>
        </div>
    );
}
