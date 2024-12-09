'use client';

import { useState, useEffect } from 'react';
import ConsentFormRenderer from './ConsentFormRenderer';
import { ConsentForm, ConsentFormSection, Question } from '@/types/consentForm';

interface ConsentFormsProps {
  serviceId: string;
  onSubmit: (data: Record<string, any>) => void;
  onBack: () => void;
}

export default function ConsentForms({ serviceId, onSubmit, onBack }: ConsentFormsProps) {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch(`/api/booking/consent-forms?serviceId=${serviceId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch consent forms');
        }
        const data = await response.json();
        // Transform the data to match the ConsentForm type
        setForms(data.map((form: any) => ({
          id: form.id,
          title: form.title,
          serviceIds: form.serviceIds || [],
          isActive: form.isActive ?? true,
          version: form.version || 1,
          sections: (form.sections || []).map((section: any) => ({
            id: section.id,
            title: section.title,
            questions: section.questions.map((question: any) => {
              const baseQuestion = {
                id: question.id,
                type: question.type,
                required: question.required,
                label: question.label,
              };

              switch (question.type) {
                case 'text':
                  return {
                    ...baseQuestion,
                    type: 'text' as const,
                    placeholder: question.content,
                  };
                case 'checkbox':
                case 'radio':
                  return {
                    ...baseQuestion,
                    type: question.type as 'checkbox' | 'radio',
                    options: question.options || [],
                  };
                case 'markdown':
                  return {
                    ...baseQuestion,
                    type: 'markdown' as const,
                    content: question.content || '',
                  };
                default:
                  throw new Error(`Unknown question type: ${question.type}`);
              }
            }),
          })),
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch consent forms');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [serviceId]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all forms have been agreed to
    const allFormsAgreed = forms.every(form => {
      if (form.content) {
        return formResponses[form.id]?.agreed?.value === true;
      }
      // For structured forms, check if all required questions are answered
      return form.sections?.every(section =>
        section.questions?.every(question =>
          !question.required || formResponses[form.id]?.[question.id]?.value
        )
      ) ?? true;
    });

    if (!allFormsAgreed) {
      setError('Please complete all required fields in the consent forms');
      return;
    }

    // Format the responses to include form and question context
    const formattedResponses = forms.map(form => {
      const formId = form.id;
      const formTitle = form.title;
      
      if (form.content) {
        const response = {
          formId,
          formTitle,
          responses: [{
            questionId: 'agreed',
            question: 'I agree to the terms above',
            answer: formResponses[formId]?.agreed?.value === true ? 'Yes' : 'No',
            timestamp: formResponses[formId]?.agreed?.timestamp || new Date().toISOString()
          }]
        };
        return response;
      }

      // Handle structured forms
      const responses = form.sections?.flatMap(section =>
        section.questions.map(question => {
          let formattedAnswer = '';
          const value = formResponses[formId]?.[question.id]?.value;

          switch (question.type) {
            case 'checkbox':
              if (Array.isArray(value)) {
                formattedAnswer = value
                  .map(optionId => 
                    question.options?.find(opt => opt.id === optionId)?.label || optionId
                  )
                  .filter(Boolean)
                  .join(', ');
              }
              break;

            case 'radio':
              formattedAnswer = question.options?.find(opt => opt.id === value)?.label || String(value);
              break;

            default:
              formattedAnswer = String(value || '');
          }

          const response = {
            questionId: question.id,
            question: question.label,
            answer: formattedAnswer,
            timestamp: formResponses[formId]?.[question.id]?.timestamp || new Date().toISOString()
          };
          return response;
        })
      ) || [];

      const formattedForm = {
        formId,
        formTitle,
        responses
      };
      return formattedForm;
    });

    const data = { consentFormResponses: formattedResponses };
    onSubmit(data);
  };

  const formatAnswer = (type: string, value: any, options?: Array<{ id: string, label: string }>) => {
    if (!value) return '';
    
    switch (type) {
      case 'checkbox':
        if (options && Array.isArray(value)) {
          return value
            .map(optionId => options.find(opt => opt.id === optionId)?.label)
            .filter(Boolean)
            .join(', ');
        }
        return value ? 'Yes' : 'No';
      
      case 'radio':
        if (options) {
          const selectedOption = options.find(opt => opt.id === value);
          return selectedOption?.label || value;
        }
        return value;
      
      default:
        return value;
    }
  };

  if (loading) {
    return <div>Loading consent forms...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Consent Forms</h1>
        <p className="text-center text-gray-600 mb-8">
          Please fill out the consent forms below to confirm your appointment.
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
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {forms.map((form) => {
          return (
            <div key={form.id} className="border rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold">{form.title}</h3>
              <ConsentFormRenderer
                form={form}
                onChange={(responses) => {
                  setFormResponses(prev => ({
                    ...prev,
                    [form.id]: responses,
                  }));
                }}
                responses={formResponses[form.id]}
              />
            </div>
          );
        })}
        
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
          >
            Review Your Booking
          </button>
        </div>
      </form>
    </div>
  );
}
