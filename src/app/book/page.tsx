'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceSelection from '@/components/booking/ServiceSelection';
import StaffSelection from '@/components/booking/StaffSelection';
import DateTimeSelection from '@/components/booking/DateTimeSelection';
import AddonSelection from '@/components/booking/AddonSelection';
import ClientForm from '@/components/booking/ClientForm';
import ConsentForms from '@/components/booking/ConsentForms';
import BookingSummary from '@/components/booking/BookingSummary';
import { showToast } from '@/components/ui/Toast';
import { BookingCacheProvider } from '@/lib/cache/BookingCacheContext';
import CacheControls from '@/components/booking/CacheControls';
import { BookingPreloader } from '@/lib/preload/BookingPreloader';

type BookingStep =
  | 'category'
  | 'service'
  | 'variation'
  | 'staff'
  | 'datetime'
  | 'addons'
  | 'client'
  | 'consent'
  | 'summary';

const ALL_STEPS: BookingStep[] = ['category', 'service', 'variation', 'staff', 'addons', 'datetime', 'client', 'consent', 'summary'];

// Progress is kept for the browser tab so a refresh or a trip to the policy page doesn't lose it
const STORAGE_KEY = 'phace-booking-progress';

interface Addon {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

interface ServiceVariation {
  id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  imageUrl?: string;
  isActive: boolean;
  updatedAt?: string;
  variationId: string;
  variations?: ServiceVariation[];
}

export interface BookingData {
  categoryId?: string;
  serviceId?: string;
  serviceName?: string;
  variationId?: string;
  variationName?: string;
  staffId?: string;
  staffName?: string;
  dateTime?: string;
  addons?: Addon[];
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  consentForms?: Record<string, any>;
  createAccount?: boolean;
  service?: Service;
  variation?: ServiceVariation;
  paymentNonce?: string;
}

interface StoredProgress {
  bookingData: BookingData;
  availableAddons: Addon[];
  hasLoadedAddons: boolean;
}

/**
 * Returns the furthest step the given data actually supports, so a refresh or a
 * stale link can't land someone on a step whose earlier choices are missing.
 */
function furthestValidStep(requested: BookingStep, data: BookingData, hasAddons: boolean): BookingStep {
  const requirements: [BookingStep, boolean][] = [
    ['service', !!data.categoryId],
    ['variation', !!data.service],
    ['staff', !!data.variationId && !!data.serviceId],
    ['addons', !!data.staffId],
    ['datetime', !!data.staffId],
    ['client', !!data.dateTime],
    // The card token is never stored, so after a refresh the card has to be re-entered
    ['consent', !!data.clientName && !!data.paymentNonce],
    ['summary', !!data.clientName && !!data.paymentNonce],
  ];

  const requestedIndex = ALL_STEPS.indexOf(requested);
  let valid: BookingStep = 'category';
  for (const [step, ok] of requirements) {
    if (ALL_STEPS.indexOf(step) > requestedIndex) break;
    // The add-ons step only exists when the service has add-ons
    if (step === 'addons' && !hasAddons) continue;
    if (!ok) break;
    valid = step;
  }
  return valid;
}

function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [hasLoadedAddons, setHasLoadedAddons] = useState(false);
  const [restored, setRestored] = useState(false);
  // Steps visited in this tab, mirroring browser history, so our Back button can use history.back()
  const navStack = useRef<BookingStep[]>([]);

  const urlStep = searchParams.get('step') as BookingStep | null;
  const currentStep: BookingStep = urlStep && ALL_STEPS.includes(urlStep) ? urlStep : 'category';

  const buildUrl = useCallback((step: BookingStep, data: BookingData) => {
    const params = new URLSearchParams();
    params.set('step', step);
    if (data.categoryId) params.set('categoryId', data.categoryId);
    if (data.serviceId) params.set('serviceId', data.serviceId);
    if (data.variationId) params.set('variationId', data.variationId);
    return `/book?${params.toString()}`;
  }, []);

  const goToStep = useCallback((step: BookingStep, data: BookingData, options?: { replace?: boolean }) => {
    if (options?.replace) {
      // The replaced entry is gone from history, so drop it from our mirror too
      navStack.current.pop();
      router.replace(buildUrl(step, data), { scroll: false });
    } else {
      router.push(buildUrl(step, data), { scroll: false });
    }
  }, [router, buildUrl]);

  // Restore progress once on load (refresh, or coming back from another page in the same tab)
  useEffect(() => {
    let stored: StoredProgress | null = null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {
      // Storage unavailable or corrupt; start fresh
    }

    let data: BookingData = stored?.bookingData ?? {};
    let loadedAddons = stored?.hasLoadedAddons ?? false;

    // A deep link such as /book?step=service&categoryId=X wins over stored progress
    const urlCategoryId = searchParams.get('categoryId');
    if (urlCategoryId && urlCategoryId !== data.categoryId) {
      data = { categoryId: urlCategoryId };
      loadedAddons = false;
    }

    const storedAddons = loadedAddons ? stored?.availableAddons ?? [] : [];
    setBookingData(data);
    setAvailableAddons(storedAddons);
    setHasLoadedAddons(loadedAddons);

    const valid = furthestValidStep(currentStep, data, storedAddons.length > 0);
    if (valid !== currentStep) {
      router.replace(buildUrl(valid, data), { scroll: false });
    }
    navStack.current = [valid];
    setRestored(true);
    // Only runs on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist progress (without the single-use card token)
  useEffect(() => {
    if (!restored) return;
    try {
      const { paymentNonce, ...safeData } = bookingData;
      const progress: StoredProgress = { bookingData: safeData, availableAddons, hasLoadedAddons };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage errors; progress just won't survive a refresh
    }
  }, [bookingData, availableAddons, hasLoadedAddons, restored]);

  // Keep the history mirror in sync with browser back/forward
  useEffect(() => {
    if (!restored) return;
    const stack = navStack.current;
    if (stack.length >= 2 && stack[stack.length - 2] === currentStep) {
      stack.pop();
    } else if (stack[stack.length - 1] !== currentStep) {
      stack.push(currentStep);
    }
  }, [currentStep, restored]);

  const steps: BookingStep[] = hasLoadedAddons && availableAddons.length === 0
    ? ALL_STEPS.filter(step => step !== 'addons')
    : ALL_STEPS;
  const currentStepIndex = Math.max(0, steps.indexOf(currentStep));

  const goToPreviousStep = () => {
    if (navStack.current.length >= 2) {
      router.back();
      return;
    }
    // Arrived here directly (deep link / refresh): step back through the flow instead
    const prev = steps[currentStepIndex - 1];
    if (prev) goToStep(prev, bookingData, { replace: true });
  };

  const goToStepAfter = (step: BookingStep, data: BookingData, options?: { replace?: boolean }) => {
    const next = steps[steps.indexOf(step) + 1];
    if (next) goToStep(next, data, options);
  };

  // Each selection clears the choices that depended on the earlier one
  const selectCategory = (categoryId: string) => {
    const data: BookingData = { categoryId };
    setBookingData(data);
    setAvailableAddons([]);
    setHasLoadedAddons(false);
    goToStep('service', data);
  };

  const selectService = (service: Service, variation?: ServiceVariation) => {
    const data: BookingData = {
      categoryId: bookingData.categoryId,
      serviceId: service.id,
      serviceName: service.name,
      service,
      ...(variation && {
        variationId: variation.id,
        variationName: variation.name,
        variation,
      }),
    };
    setBookingData(data);
    setAvailableAddons([]);
    setHasLoadedAddons(false);

    if (variation) {
      BookingPreloader.preloadStaffForService(variation.id);
      goToStep('staff', data);
    } else {
      service.variations?.forEach(v => BookingPreloader.preloadStaffForService(v.id));
      goToStep('variation', data);
    }
  };

  const selectVariation = (variation: ServiceVariation) => {
    const data: BookingData = {
      categoryId: bookingData.categoryId,
      serviceId: bookingData.serviceId,
      serviceName: bookingData.serviceName,
      service: bookingData.service,
      variationId: variation.id,
      variationName: variation.name,
      variation,
    };
    setBookingData(data);
    BookingPreloader.preloadStaffForService(variation.id);
    goToStep('staff', data);
  };

  const selectStaff = async (staff: { id: string; name: string }, options?: { replace?: boolean }) => {
    const { addons, dateTime, ...rest } = bookingData;
    const data: BookingData = { ...rest, staffId: staff.id, staffName: staff.name };
    setBookingData(data);

    let addonsArray: Addon[] = [];
    if (data.serviceId) {
      try {
        const result = await BookingPreloader.preloadAddonsForService(data.serviceId);
        addonsArray = Array.isArray(result) ? result : [];
      } catch (err) {
        console.error('Error fetching addons:', err);
      }
    }
    setAvailableAddons(addonsArray);
    setHasLoadedAddons(true);

    if (addonsArray.length > 0) {
      goToStep('addons', data, options);
    } else {
      if (data.serviceId) {
        const today = new Date().toISOString().split('T')[0];
        BookingPreloader.preloadAvailability(data.serviceId, staff.id, today, data.variationId);
      }
      goToStep('datetime', data, options);
    }
  };

  // Scroll to top when step changes and trigger pre-loading for next steps
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (currentStep === 'category') {
      BookingPreloader.preloadCategories();
    } else if (currentStep === 'staff' && bookingData.serviceId) {
      // Pre-load addons for this service while selecting staff
      BookingPreloader.preloadAddonsForService(bookingData.serviceId);
    } else if (currentStep === 'addons' && bookingData.serviceId && bookingData.staffId) {
      // Pre-load availability for today and tomorrow while selecting addons
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      BookingPreloader.preloadAvailability(bookingData.serviceId, bookingData.staffId, formatDate(today), bookingData.variationId);
      BookingPreloader.preloadAvailability(bookingData.serviceId, bookingData.staffId, formatDate(tomorrow), bookingData.variationId);
    }
  }, [currentStep, bookingData.serviceId, bookingData.staffId, bookingData.variationId]);

  if (!restored) {
    return (
      <main className="min-h-screen bg-[#FFFBF0] pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" aria-label="Loading" />
      </main>
    );
  }

  return (
    <>
      {/* Cache Controls for admin users */}
      <CacheControls />
    <main className="min-h-screen bg-[#FFFBF0] pt-24">
      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div className="text-xs font-semibold inline-block text-accent">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
          </div>
          <div
            className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#F8E7E1]"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={currentStepIndex + 1}
          >
            <div
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-accent transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'category' && (
              <ServiceSelection
                mode="category"
                onSelect={(category) => selectCategory(category.id)}
              />
            )}
            {currentStep === 'service' && (
              <ServiceSelection
                mode="service"
                categoryId={bookingData.categoryId}
                preloadStaffForServices={(services: Service[]) => {
                  // Pre-load staff for the first few services (likely to be selected)
                  services.slice(0, 3).forEach((service: Service) => {
                    if (service.variations && service.variations.length > 0) {
                      service.variations.forEach((variation: ServiceVariation) => {
                        BookingPreloader.preloadStaffForService(variation.id);
                      });
                    } else {
                      BookingPreloader.preloadStaffForService(service.variationId || service.id);
                    }
                  });
                }}
                onSelect={(selection) => {
                  if (selection.type === 'service') {
                    // Multiple variations: choose one on the next step
                    selectService(selection.service);
                  } else if (selection.type === 'variation') {
                    // Single variation: skip straight to staff
                    selectService(selection.service, selection.variation);
                  }
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'variation' && (
              <ServiceSelection
                mode="variation"
                service={bookingData.service}
                onSelect={(selection) => selectVariation(selection.variation)}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'staff' && (
              <StaffSelection
                variationId={bookingData.variationId!}
                onSelect={(staff) => selectStaff(staff)}
                onAutoSelect={(staff) => selectStaff(staff, { replace: true })}
                onBack={goToPreviousStep}
                onBackToStart={() => goToStep('category', {})}
              />
            )}
            {currentStep === 'addons' && (
              <AddonSelection
                serviceId={bookingData.serviceId!}
                initialSelectedIds={(bookingData.addons || []).map(addon => addon.id)}
                onSelect={(selectedAddonsData) => {
                  // Duration changes with add-ons, so any previously picked time is cleared
                  const { dateTime, ...rest } = bookingData;
                  const data = { ...rest, addons: selectedAddonsData };
                  setBookingData(data);
                  goToStepAfter('addons', data);
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'datetime' && (
              <DateTimeSelection
                serviceId={bookingData.serviceId!}
                variationId={bookingData.variationId}
                staffId={bookingData.staffId!}
                addons={(bookingData.addons || []).map(addon => addon.id)}
                initialDateTime={bookingData.dateTime}
                onSelect={(dateTime) => {
                  const data = { ...bookingData, dateTime };
                  setBookingData(data);
                  goToStepAfter('datetime', data);
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'client' && (
              <ClientForm
                initialValues={{
                  name: bookingData.clientName,
                  email: bookingData.clientEmail,
                  phone: bookingData.clientPhone,
                  notes: bookingData.notes,
                }}
                onSubmit={async (clientData) => {
                  try {
                    // Handle account creation if requested
                    if (clientData.createAccount && clientData.password) {
                      const signupResponse = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          email: clientData.email,
                          password: clientData.password,
                          name: clientData.name,
                        }),
                      });

                      if (!signupResponse.ok) {
                        const errorData = await signupResponse.json();
                        throw new Error(errorData.error || 'Failed to create account');
                      }

                      showToast({
                        title: "Account Created!",
                        description: "Please check your email to verify your account. You can continue with your booking and sign in after verification.",
                        status: "success",
                        duration: 10000,
                      });
                    }

                    const data: BookingData = {
                      ...bookingData,
                      clientName: clientData.name,
                      clientEmail: clientData.email,
                      clientPhone: clientData.phone,
                      notes: clientData.notes,
                      createAccount: clientData.createAccount,
                      paymentNonce: clientData.paymentNonce,
                    };
                    setBookingData(data);
                    goToStepAfter('client', data);
                  } catch (error: any) {
                    console.error('Error during client form submission:', error);
                    showToast({
                      title: "Error",
                      description: error.message || 'An error occurred during account creation',
                      status: "error",
                      duration: 5000,
                    });
                  }
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'consent' && (
              <ConsentForms
                serviceId={bookingData.serviceId!}
                categoryId={bookingData.categoryId}
                onSubmit={(consentData) => {
                  const data = { ...bookingData, consentForms: consentData };
                  setBookingData(data);
                  goToStepAfter('consent', data);
                }}
                onNoForms={() => {
                  // Nothing to sign for this service; skip the step without leaving it in history
                  const data = { ...bookingData, consentForms: { consentFormResponses: [] } };
                  setBookingData(data);
                  goToStepAfter('consent', data, { replace: true });
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'summary' && (
              <BookingSummary
                bookingData={bookingData}
                onConfirm={async () => {
                  const requestBody = {
                    serviceId: bookingData.serviceId,
                    serviceName: bookingData.serviceName,
                    variationId: bookingData.variationId,
                    variationName: bookingData.variationName,
                    staffId: bookingData.staffId,
                    staffName: bookingData.staffName,
                    startTime: bookingData.dateTime,
                    clientName: bookingData.clientName,
                    clientEmail: bookingData.clientEmail,
                    clientPhone: bookingData.clientPhone,
                    notes: bookingData.notes,
                    addons: (bookingData.addons || []).map(addon => addon.id),
                    consentFormResponses: bookingData.consentForms?.consentFormResponses || [],
                    paymentNonce: bookingData.paymentNonce,
                  };

                  const response = await fetch('/api/booking/appointments', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to create booking');
                  }

                  const data = await response.json();
                  try {
                    sessionStorage.removeItem(STORAGE_KEY);
                  } catch {
                    // Ignore storage errors
                  }
                  window.location.href = `/booking-confirmed?id=${data.id}`;
                }}
                onBack={goToPreviousStep}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
    </>
  );
}

// Main export that wraps everything with the BookingCacheProvider
export default function BookingPage() {
  return (
    <BookingCacheProvider>
      <BookingPageContent />
    </BookingCacheProvider>
  );
}
