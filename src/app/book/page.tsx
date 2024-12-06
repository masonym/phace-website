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

type BookingStep = 
  | 'service'
  | 'staff'
  | 'datetime'
  | 'addons'
  | 'client'
  | 'consent'
  | 'summary';

interface BookingData {
  serviceId?: string;
  serviceName?: string;
  categoryId?: string;
  staffId?: string;
  staffName?: string;
  dateTime?: string;
  addons?: string[];
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  consentForms?: Record<string, any>;
}

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [bookingData, setBookingData] = useState<BookingData>({});

  const steps: BookingStep[] = ['service', 'staff', 'datetime', 'addons', 'client', 'consent', 'summary'];
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
      <div className="max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'service' && (
              <ServiceSelection
                onSelect={(service) => {
                  updateBookingData({
                    serviceId: service.id,
                    serviceName: service.name,
                    categoryId: service.categoryId,
                  });
                  goToNextStep();
                }}
              />
            )}

            {currentStep === 'staff' && (
              <StaffSelection
                serviceId={bookingData.serviceId!}
                onSelect={(staff) => {
                  updateBookingData({
                    staffId: staff.id,
                    staffName: staff.name,
                  });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'datetime' && (
              <DateTimeSelection
                serviceId={bookingData.serviceId!}
                staffId={bookingData.staffId!}
                onSelect={(dateTime) => {
                  updateBookingData({ dateTime });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'addons' && (
              <AddonSelection
                serviceId={bookingData.serviceId!}
                onSelect={(addons) => {
                  updateBookingData({ addons });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'client' && (
              <ClientForm
                onSubmit={(clientData) => {
                  updateBookingData(clientData);
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'consent' && (
              <ConsentForms
                serviceId={bookingData.serviceId!}
                onSubmit={(consentData) => {
                  updateBookingData({ consentForms: consentData });
                  goToNextStep();
                }}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 'summary' && (
              <BookingSummary
                bookingData={bookingData}
                onConfirm={async () => {
                  // Handle booking confirmation
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
