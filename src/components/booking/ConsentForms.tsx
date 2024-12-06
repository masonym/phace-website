'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'checkbox' | 'radio' | 'select';
  required: boolean;
  options?: string[];
}

interface ConsentForm {
  id: string;
  name: string;
  type: 'general' | 'service-specific' | 'photo' | 'terms';
  questions: Question[];
}

interface Props {
  serviceId: string;
  onSubmit: (data: Record<string, any>) => void;
  onBack: () => void;
}

export default function ConsentForms({ serviceId, onSubmit, onBack }: Props) {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch(`/api/booking/forms?serviceId=${serviceId}`);
        if (!response.ok) throw new Error('Failed to fetch consent forms');
        const data = await response.json();
        setForms(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [serviceId]);

  const currentForm = forms[currentFormIndex];

  const onFormSubmit = (data: Record<string, any>) => {
    const updatedResponses = {
      ...formResponses,
      [currentForm.id]: data,
    };
    setFormResponses(updatedResponses);

    if (currentFormIndex < forms.length - 1) {
      setCurrentFormIndex(prev => prev + 1);
    } else {
      onSubmit(updatedResponses);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading consent forms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!currentForm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">No consent forms required</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-center mb-2">Consent Forms</h1>
        <p className="text-center text-gray-600 mb-8">
          Form {currentFormIndex + 1} of {forms.length}: {currentForm.name}
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
        Back to Client Information
      </button>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {currentForm.questions.map((question) => (
            <div key={question.id} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.text}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {question.type === 'text' && (
                <input
                  type="text"
                  {...register(`${question.id}`, { required: question.required })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                />
              )}

              {question.type === 'checkbox' && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register(`${question.id}`, { required: question.required })}
                      className="rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-gray-700">I agree</span>
                  </label>
                </div>
              )}

              {question.type === 'radio' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value={option}
                        {...register(`${question.id}`, { required: question.required })}
                        className="border-gray-300 text-accent focus:ring-accent"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'select' && question.options && (
                <select
                  {...register(`${question.id}`, { required: question.required })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-accent focus:border-accent"
                >
                  <option value="">Select an option</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {errors[question.id] && (
                <p className="mt-1 text-sm text-red-600">This field is required</p>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentFormIndex(prev => Math.max(0, prev - 1))}
            className="text-accent hover:text-accent/80 transition-colors"
            disabled={currentFormIndex === 0}
          >
            Previous Form
          </button>
          <button
            type="submit"
            className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors"
          >
            {currentFormIndex === forms.length - 1 ? 'Review Booking' : 'Next Form'}
          </button>
        </div>
      </form>
    </div>
  );
}
