import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ConsentForm, Question } from '@/types/consentForm';

// Extended Question types to include dropdown
interface DropdownQuestion {
  id: string;
  type: 'dropdown';
  required: boolean;
  label: string;
  content?: string; // Optional markdown content for the question
  options: Array<{
    id: string;
    label: string;
  }>;
}

interface YesNoQuestion {
  id: string;
  type: 'yes-no';
  required: boolean;
  label: string;
  content?: string; // Optional markdown content for the question
}

// Extend the Question type to include our new question types
type ExtendedQuestion = Question | DropdownQuestion | YesNoQuestion;

interface ConsentFormRendererProps {
  form: ConsentForm;
  onChange: (responses: Record<string, any>) => void;
  responses?: Record<string, any>;
  categoryId?: string; // Add categoryId to determine which form to show
}

// Map of category IDs to form templates
// Each category can have its own specific consent form
const CATEGORY_FORM_TEMPLATES: Record<string, string> = {
  // Tattoo categories
  'LQRX5FSHBMCSPDI5EBFPXN6P': 'tattoo-consent',  // Tattoo
  'WVWPWXGZJWP7JXZC4WFGJ5BF': 'tattoo-touchup-consent', // Tattoo Touch-Up
  
  // Piercing categories
  'FZQVJ4SNDVJ6NSNDCBZIH6ZR': 'piercing-consent', // Piercing
  'ZZPKQNPGWMWVVFXG3T3T6RKV': 'piercing-jewelry-consent', // Piercing Jewelry
  
  // Permanent Makeup categories
  'LMVXR7GSW6EQ3JJPYBXHBMR5': 'pmu-brows-consent', // PMU Brows
  'QVVVLVX5JVHVNZGDVVGCQPWL': 'pmu-eyeliner-consent', // PMU Eyeliner
  'RNPJHW5JDGPBGZFQW3ZLDXFR': 'pmu-lips-consent', // PMU Lips
  'JRJHQFNBVNPJNXVPVBQFXDGP': 'pmu-touchup-consent', // PMU Touch-Up
  
  // Removal categories
  'WQRXGZFVDNQJNXBPWFXGDVZR': 'removal-consent', // Removal
  
  // Consultation categories
  'VVQFXJVLWMWVNZGDVVGCQPWL': 'consultation-consent', // Consultation
  
  // Other categories
  'QVDNRXGZJWP7JXZC4WFGJ5BF': 'other-consent', // Other services
  
  // Default form for any other category
  'default': 'general-consent'
};

export default function ConsentFormRenderer({ form, onChange, responses = {}, categoryId }: ConsentFormRendererProps) {
  const [formResponses, setFormResponses] = useState<Record<string, any>>(responses);
  const [formTemplate, setFormTemplate] = useState<string>('general-consent');

  // Determine which form template to use based on category ID
  useEffect(() => {
    if (categoryId && CATEGORY_FORM_TEMPLATES[categoryId]) {
      setFormTemplate(CATEGORY_FORM_TEMPLATES[categoryId]);
    } else {
      setFormTemplate(CATEGORY_FORM_TEMPLATES['default']);
    }
    
    // Log for debugging
    console.log('Using form template:', categoryId ? CATEGORY_FORM_TEMPLATES[categoryId] || 'default' : 'default');
  }, [categoryId]);

  const handleChange = (questionId: string, value: any) => {
    console.log('Handling form change:', {
      questionId,
      value,
      formId: form.id,
      formTemplate
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

  const renderQuestion = (question: ExtendedQuestion) => {
    switch (question.type) {
      case 'text':
        return (
          <div>
            {question.content && (
              <div className="prose prose-sm max-w-none mb-2">
                <ReactMarkdown>{question.content}</ReactMarkdown>
              </div>
            )}
            <input
              type="text"
              value={formResponses[question.id]?.value || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              placeholder={question.placeholder}
              required={question.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.content && (
              <div className="prose prose-sm max-w-none mb-2">
                <ReactMarkdown>{question.content}</ReactMarkdown>
              </div>
            )}
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
                <span className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>{option.label}</ReactMarkdown>
                </span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {question.content && (
              <div className="prose prose-sm max-w-none mb-2">
                <ReactMarkdown>{question.content}</ReactMarkdown>
              </div>
            )}
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
                <span className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>{option.label}</ReactMarkdown>
                </span>
              </label>
            ))}
          </div>
        );

      case 'dropdown':
        return (
          <div>
            {question.content && (
              <div className="prose prose-sm max-w-none mb-2">
                <ReactMarkdown>{question.content}</ReactMarkdown>
              </div>
            )}
            <select
              value={formResponses[question.id]?.value || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              required={question.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select an option</option>
              {question.options.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'yes-no':
        return (
          <div>
            {question.content && (
              <div className="prose prose-sm max-w-none mb-2">
                <ReactMarkdown>{question.content}</ReactMarkdown>
              </div>
            )}
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value="yes"
                  checked={formResponses[question.id]?.value === 'yes'}
                  onChange={() => handleChange(question.id, 'yes')}
                  required={question.required}
                  className="h-4 w-4 text-accent focus:ring-accent border-gray-300"
                />
                <span className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>Yes</ReactMarkdown>
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value="no"
                  checked={formResponses[question.id]?.value === 'no'}
                  onChange={() => handleChange(question.id, 'no')}
                  required={question.required}
                  className="h-4 w-4 text-accent focus:ring-accent border-gray-300"
                />
                <span className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>No</ReactMarkdown>
                </span>
              </label>
            </div>
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
          <span className="text-gray-700 prose prose-sm max-w-none">
            <ReactMarkdown>I have read and agree to the above terms</ReactMarkdown>
          </span>
        </label>
      </div>
    );
  }

  // Ensure sections exist and is an array before mapping
  const sections = form.sections || [];

  return (
    <div className="space-y-8">
      {/* Optional: Display form template name for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 p-2 text-xs text-blue-800 rounded">
          Form Template: {formTemplate}
        </div>
      )}
      
      {sections.map(section => (
        <div key={section.id} className="space-y-4">
          <h3 className="text-lg font-semibold">{section.title}</h3>
          <div className="space-y-6">
            {section.questions?.map(question => (
              <div key={question.id} className="space-y-2">
                {question.type !== 'markdown' && (
                  <div className="flex items-baseline">
                    {question.label && question.label.trim() !== '' && (
                      <label className="block text-sm font-medium text-gray-700 prose prose-sm max-w-none">
                        <ReactMarkdown>{question.label}</ReactMarkdown>
                      </label>
                    )}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                )}
                {renderQuestion(question as ExtendedQuestion)}
              </div>
            )) || null}
          </div>
        </div>
      ))}
    </div>
  );
}
