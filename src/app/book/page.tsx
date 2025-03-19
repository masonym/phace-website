'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceSelection from '@/components/booking/ServiceSelection';
import StaffSelection from '@/components/booking/StaffSelection';
import DateTimeSelection from '@/components/booking/DateTimeSelection';
import AddonSelection from '@/components/booking/AddonSelection';
import ClientForm from '@/components/booking/ClientForm';
import ConsentForms from '@/components/booking/ConsentForms';
import BookingSummary from '@/components/booking/BookingSummary';
import { showToast } from '@/components/ui/Toast';

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

interface ServiceVariation {
  id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isActive: boolean;
  variationId: string;
  variations?: ServiceVariation[];
}

interface BookingData {
  categoryId?: string;
  serviceId?: string;
  serviceName?: string;
  variationId?: string;
  variationName?: string;
  staffId?: string;
  staffName?: string;
  dateTime?: string;
  addons?: string[];
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  consentForms?: Record<string, any>;
  createAccount?: boolean;
  service?: Service;
  variation?: ServiceVariation;
}

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('category');
  const [bookingData, setBookingData] = useState<BookingData>({});

  const steps: BookingStep[] = ['category', 'service', 'variation', 'staff', 'addons', 'datetime', 'client', 'consent', 'summary'];
  const currentStepIndex = steps.indexOf(currentStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  return (
    <main className="min-h-screen bg-[#FFFBF0] pt-24">
      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div className="text-xs font-semibold inline-block text-accent">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#F8E7E1]">
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
                onSelect={(category) => {
                  console.log("Selected category:", category);
                  updateBookingData({
                    categoryId: category.id,
                  });
                  goToNextStep();
                }}
              />
            )}
            {currentStep === 'service' && (
              <ServiceSelection
                mode="service"
                categoryId={bookingData.categoryId}
                onSelect={(selection) => {
                  console.log("Service selection:", selection);
                  
                  if (selection.type === 'service') {
                    // If this is a service with multiple variations, store the service and go to variation selection
                    updateBookingData({
                      serviceId: selection.service.id,
                      serviceName: selection.service.name,
                      service: selection.service
                    });
                    setCurrentStep('variation');
                  } else if (selection.type === 'variation') {
                    // If this is a service with only one variation, store both and skip variation selection
                    updateBookingData({
                      serviceId: selection.service.id,
                      serviceName: selection.service.name,
                      service: selection.service,
                      variationId: selection.variation.id,
                      variationName: selection.variation.name,
                      variation: selection.variation
                    });
                    setCurrentStep('staff');
                  }
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'variation' && (
              <ServiceSelection
                mode="variation"
                service={bookingData.service}
                onSelect={(selection) => {
                  console.log("Selected variation:", selection);
                  updateBookingData({
                    variationId: selection.variation.id,
                    variationName: selection.variation.name,
                    variation: selection.variation
                  });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'staff' && (
              <StaffSelection
                serviceId={bookingData.serviceId!}
                onSelect={(staff) => {
                  console.log("Selected staff:", staff);
                  updateBookingData({
                    staffId: staff.id,
                    staffName: staff.name,
                  });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'addons' && (
              <AddonSelection
                serviceId={bookingData.serviceId!}
                onSelect={(addons) => {
                  console.log("Selected addons:", addons);
                  updateBookingData({ addons });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'datetime' && (
              <DateTimeSelection
                serviceId={bookingData.serviceId!}
                variationId={bookingData.variationId}
                staffId={bookingData.staffId!}
                addons={bookingData.addons || []}
                onSelect={(dateTime) => {
                  console.log("Selected datetime:", dateTime);
                  updateBookingData({ dateTime });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'client' && (
              <ClientForm
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

                      // Show success message about verification email
                      showToast({
                        title: "Account Created!",
                        description: "Please check your email to verify your account. You can continue with your booking and sign in after verification.",
                        status: "success",
                        duration: 10000,
                      });
                    }

                    // Update booking data and continue regardless of account status
                    updateBookingData({
                      clientName: clientData.name,
                      clientEmail: clientData.email,
                      clientPhone: clientData.phone,
                      notes: clientData.notes,
                      createAccount: clientData.createAccount,
                    });
                    goToNextStep();
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
                onSubmit={(consentData) => {
                  // Using setBookingData directly to ensure state update
                  setBookingData(prevData => {
                    const newData = {
                      ...prevData,
                      consentForms: consentData
                    };
                    return newData;
                  });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}
            {currentStep === 'summary' && (
              <BookingSummary
                bookingData={bookingData}
                onConfirm={async () => {
                  try {
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
                      addons: bookingData.addons || [],
                      consentFormResponses: bookingData.consentForms?.consentFormResponses || [],
                    };
                    console.log('Sending appointment request:', requestBody);

                    const response = await fetch('/api/booking/appointments', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(requestBody),
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to create booking');
                    }

                    const data = await response.json();
                    // Redirect to confirmation page
                    window.location.href = `/booking-confirmed?id=${data.id}`;
                  } catch (error: any) {
                    throw new Error(error.message || 'Failed to create booking');
                  }
                }}
                onBack={goToPreviousStep}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
