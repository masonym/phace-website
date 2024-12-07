import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ConsentForm, Question } from '@/types/consentForm';

interface ConsentFormRendererProps {
  form: ConsentForm;
  onChange: (responses: Record<string, any>) => void;
  responses?: Record<string, any>;
}

export default function ConsentFormRenderer({ form, onChange, responses = {} }: ConsentFormRendererProps) {
  const [formResponses, setFormResponses] = useState<Record<string, any>>(responses);

  const handleChange = (questionId: string, value: any) => {
    console.log('Handling form change:', {
      questionId,
      value,
      formId: form.id
    });

    const newResponses = { 
      ...formResponses, 
      [questionId]: {
        value,
        timestamp: new Date().toISOString()
      }
    };
    console.log('New responses state:', newResponses);
    setFormResponses(newResponses);
    onChange(newResponses);
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formResponses[question.id]?.value || ''}
            onChange={(e) => handleChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            required={question.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options.map(option => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formResponses[question.id]?.value?.includes(option.id) || false}
                  onChange={(e) => {
                    const currentValues = formResponses[question.id]?.value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.id]
                      : currentValues.filter((id: string) => id !== option.id);
                    handleChange(question.id, newValues);
                  }}
                  required={question.required && !formResponses[question.id]?.value?.length}
                  className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options.map(option => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={formResponses[question.id]?.value === option.id}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  required={question.required}
                  className="h-4 w-4 text-accent focus:ring-accent border-gray-300"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'markdown':
        return (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{question.content}</ReactMarkdown>
          </div>
        );

      default:
        return null;
    }
  };

  // Handle legacy markdown-only forms
  if (form.content) {
    return (
      <div className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{form.content}</ReactMarkdown>
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formResponses.agreed?.value || false}
            onChange={(e) => handleChange('agreed', e.target.checked)}
            required
            className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
          />
          <span className="text-gray-700">I have read and agree to the above terms</span>
        </label>
      </div>
    );
  }

  // Ensure sections exist and is an array before mapping
  const sections = form.sections || [];

  return (
    <div className="space-y-8">
      {sections.map(section => (
        <div key={section.id} className="space-y-4">
          <h3 className="text-lg font-semibold">{section.title}</h3>
          <div className="space-y-6">
            {section.questions?.map(question => (
              <div key={question.id} className="space-y-2">
                {question.type !== 'markdown' && (
                  <label className="block text-sm font-medium text-gray-700">
                    {question.label}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {renderQuestion(question)}
              </div>
            )) || null}
          </div>
        </div>
      ))}
    </div>
  );
}
