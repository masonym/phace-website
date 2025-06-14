import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  ConsentForm,
  ConsentFormSection,
  Question,
  TextQuestion,
  CheckboxQuestion,
  RadioQuestion,
  MarkdownQuestion,
  DropdownQuestion,
  YesNoQuestion,
} from '@/types/consentForm';

interface FormBuilderProps {
  initialData?: ConsentForm;
  onSave: (form: ConsentForm) => void;
}

export default function FormBuilder({ initialData, onSave }: FormBuilderProps) {
  const [sections, setSections] = useState<ConsentFormSection[]>(
    initialData?.sections || []
  );

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: uuidv4(),
        title: 'New Section',
        questions: [],
      },
    ]);
  };

  const addQuestion = (sectionId: string, type: Question['type']) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;

      let newQuestion;
      switch (type) {
        case 'text':
          newQuestion = {
            id: uuidv4(),
            type: 'text' as const,
            label: 'New Text Question',
            required: false,
            placeholder: 'Enter your answer',
          } as TextQuestion;
          break;
        case 'checkbox':
          newQuestion = {
            id: uuidv4(),
            type: 'checkbox' as const,
            label: 'New Checkbox Question',
            required: false,
            options: [{ id: uuidv4(), label: 'Option 1' }],
          } as CheckboxQuestion;
          break;
        case 'radio':
          newQuestion = {
            id: uuidv4(),
            type: 'radio' as const,
            label: 'New Radio Question',
            required: false,
            options: [{ id: uuidv4(), label: 'Option 1' }],
          } as RadioQuestion;
          break;
        case 'markdown':
          newQuestion = {
            id: uuidv4(),
            type: 'markdown' as const,
            label: 'New Markdown Content',
            required: false,
            content: 'Enter markdown content here...',
          } as MarkdownQuestion;
          break;
        case 'dropdown':
          newQuestion = {
            id: uuidv4(),
            type: 'dropdown' as const,
            label: 'New Dropdown Question',
            required: false,
            options: [
              { id: uuidv4(), label: 'Option 1' },
              { id: uuidv4(), label: 'Option 2' },
              { id: uuidv4(), label: 'Option 3' }
            ],
          } as DropdownQuestion;
          break;
        case 'yes-no':
          newQuestion = {
            id: uuidv4(),
            type: 'yes-no' as const,
            label: 'New Yes/No Question',
            required: false,
          } as YesNoQuestion;
          break;
        default:
          return section;
      }

      return {
        ...section,
        questions: [...section.questions, newQuestion],
      };
    }));
  };

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        questions: section.questions.map(question => {
          if (question.id !== questionId) return question;
          
          // Type guard to ensure type safety
          const updatedQuestion = (() => {
            switch (question.type) {
              case 'text': {
                if (updates.type && updates.type !== 'text') {
                  // Handle type change
                  switch (updates.type) {
                    case 'checkbox':
                      return {
                        ...question,
                        ...updates,
                        type: 'checkbox' as const,
                        options: [{ id: uuidv4(), label: 'Option 1' }],
                      } as CheckboxQuestion;
                    case 'radio':
                      return {
                        ...question,
                        ...updates,
                        type: 'radio' as const,
                        options: [{ id: uuidv4(), label: 'Option 1' }],
                      } as RadioQuestion;
                    case 'markdown':
                      return {
                        ...question,
                        ...updates,
                        type: 'markdown' as const,
                        content: '',
                      } as MarkdownQuestion;
                    default:
                      return question;
                  }
                }
                // Same type, safe to spread
                return { ...question, ...updates } as TextQuestion;
              }
              case 'checkbox': {
                if (updates.type && updates.type !== 'checkbox') {
                  // Handle type change
                  switch (updates.type) {
                    case 'text':
                      return {
                        ...question,
                        ...updates,
                        type: 'text' as const,
                        placeholder: 'Enter your answer',
                      } as TextQuestion;
                    case 'radio':
                      return {
                        ...question,
                        ...updates,
                        type: 'radio' as const,
                      } as RadioQuestion;
                    case 'markdown':
                      return {
                        ...question,
                        ...updates,
                        type: 'markdown' as const,
                        content: '',
                      } as MarkdownQuestion;
                    default:
                      return question;
                  }
                }
                // Same type, safe to spread
                return { ...question, ...updates } as CheckboxQuestion;
              }
              case 'radio': {
                if (updates.type && updates.type !== 'radio') {
                  // Handle type change
                  switch (updates.type) {
                    case 'text':
                      return {
                        ...question,
                        ...updates,
                        type: 'text' as const,
                        placeholder: 'Enter your answer',
                      } as TextQuestion;
                    case 'checkbox':
                      return {
                        ...question,
                        ...updates,
                        type: 'checkbox' as const,
                      } as CheckboxQuestion;
                    case 'markdown':
                      return {
                        ...question,
                        ...updates,
                        type: 'markdown' as const,
                        content: '',
                      } as MarkdownQuestion;
                    default:
                      return question;
                  }
                }
                // Same type, safe to spread
                return { ...question, ...updates } as RadioQuestion;
              }
              case 'markdown': {
                if (updates.type && updates.type !== 'markdown') {
                  // Handle type change
                  switch (updates.type) {
                    case 'text':
                      return {
                        ...question,
                        ...updates,
                        type: 'text' as const,
                        placeholder: 'Enter your answer',
                      } as TextQuestion;
                    case 'checkbox':
                      return {
                        ...question,
                        ...updates,
                        type: 'checkbox' as const,
                        options: [{ id: uuidv4(), label: 'Option 1' }],
                      } as CheckboxQuestion;
                    case 'radio':
                      return {
                        ...question,
                        ...updates,
                        type: 'radio' as const,
                        options: [{ id: uuidv4(), label: 'Option 1' }],
                      } as RadioQuestion;
                    default:
                      return question;
                  }
                }
                // Same type, safe to spread
                return { ...question, ...updates } as MarkdownQuestion;
              }
              default:
                return question;
            }
          })();

          return updatedQuestion;
        }),
      };
    }));
  };

  const addOption = (sectionId: string, questionId: string) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        questions: section.questions.map(question => {
          if (question.id !== questionId) return question;
          if (question.type !== 'checkbox' && question.type !== 'radio' && question.type !== 'dropdown') return question;
          return {
            ...question,
            options: [...question.options, { id: uuidv4(), label: `Option ${question.options.length + 1}` }],
          };
        }),
      };
    }));
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        questions: section.questions.filter(question => question.id !== questionId),
      };
    }));
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  return (
    <div className="space-y-6 overflow-visible">
      {sections.map(section => (
        <div key={section.id} className="border rounded-lg p-4 space-y-4 bg-white">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={section.title}
              onChange={(e) => {
                setSections(sections.map(s => 
                  s.id === section.id ? { ...s, title: e.target.value } : s
                ));
              }}
              className="text-lg font-semibold w-full mr-2"
            />
            <button
              type="button"
              onClick={() => deleteSection(section.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete Section
            </button>
          </div>
          
          <div className="space-y-4">
            {section.questions.map(question => (
              <div key={question.id} className="border-l-4 pl-4 space-y-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Question Label (supports markdown):</label>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(section.id, question.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  <textarea
                    value={question.label}
                    onChange={(e) => updateQuestion(section.id, question.id, { label: e.target.value })}
                    className="w-full border p-2 h-16"
                    placeholder="Enter question label here..."
                  />
                </div>
                
                {question.type === 'markdown' && (
                  <textarea
                    value={(question as MarkdownQuestion).content}
                    onChange={(e) => updateQuestion(section.id, question.id, { content: e.target.value })}
                    className="w-full h-32"
                  />
                )}
                
                {question.type === 'text' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder:</label>
                      <input
                        type="text"
                        placeholder="Placeholder text"
                        onChange={(e) => updateQuestion(section.id, question.id, { placeholder: e.target.value })}
                        className="w-full border p-2 text-gray-500 italic"
                        value={(question as TextQuestion).placeholder || ''}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Markdown Content (optional):</label>
                      <textarea
                        placeholder="Enter markdown content here..."
                        onChange={(e) => updateQuestion(section.id, question.id, { content: e.target.value })}
                        className="w-full border p-2 h-32"
                        value={(question as TextQuestion).content || ''}
                      />
                      <p className="text-xs text-gray-500 mt-1">You can use markdown formatting for line breaks, lists, etc.</p>
                    </div>
                  </div>
                )}
                
                {(question.type === 'checkbox' || question.type === 'radio') && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Markdown Content (optional):</label>
                      <textarea
                        placeholder="Enter markdown content here..."
                        onChange={(e) => updateQuestion(section.id, question.id, { content: e.target.value })}
                        className="w-full border p-2 h-32"
                        value={(question as any).content || ''}
                      />
                      <p className="text-xs text-gray-500 mt-1">You can use markdown formatting for line breaks, lists, etc.</p>
                    </div>
                    
                    {(question as CheckboxQuestion | RadioQuestion).options.map(option => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type={question.type}
                          disabled
                          className="mr-2"
                        />
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => {
                            const updatedOptions = (question as CheckboxQuestion | RadioQuestion).options.map(opt =>
                              opt.id === option.id ? { ...opt, label: e.target.value } : opt
                            );
                            updateQuestion(section.id, question.id, { options: updatedOptions });
                          }}
                          className="w-full"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(section.id, question.id)}
                      className="text-sm text-accent hover:text-accent-dark"
                    >
                      + Add Option
                    </button>
                  </div>
                )}
                
                {question.type === 'dropdown' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Markdown Content (optional):</label>
                      <textarea
                        placeholder="Enter markdown content here..."
                        onChange={(e) => updateQuestion(section.id, question.id, { content: e.target.value })}
                        className="w-full border p-2 h-32"
                        value={(question as any).content || ''}
                      />
                      <p className="text-xs text-gray-500 mt-1">You can use markdown formatting for line breaks, lists, etc.</p>
                    </div>
                    
                    <select className="w-full p-2 border rounded" disabled>
                      <option>Select an option...</option>
                      {(question as any).options?.map((option: any) => (
                        <option key={option.id}>{option.label}</option>
                      ))}
                    </select>
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Options:</p>
                      {(question as any).options?.map((option: any) => (
                        <div key={option.id} className="flex items-center mb-1">
                          <input
                            type="text"
                            value={option.label}
                            onChange={(e) => {
                              const updatedOptions = (question as any).options.map((opt: any) =>
                                opt.id === option.id ? { ...opt, label: e.target.value } : opt
                              );
                              updateQuestion(section.id, question.id, { options: updatedOptions });
                            }}
                            className="w-full"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(section.id, question.id)}
                        className="text-sm text-accent hover:text-accent-dark mt-1"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}
                
                {question.type === 'yes-no' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Markdown Content (optional):</label>
                      <textarea
                        placeholder="Enter markdown content here..."
                        onChange={(e) => updateQuestion(section.id, question.id, { content: e.target.value })}
                        className="w-full border p-2 h-32"
                        value={(question as any).content || ''}
                      />
                      <p className="text-xs text-gray-500 mt-1">You can use markdown formatting for line breaks, lists, etc.</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center">
                        <input type="radio" disabled className="mr-1" />
                        <span>Yes</span>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" disabled className="mr-1" />
                        <span>No</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(section.id, question.id, { required: e.target.checked })}
                  />
                  <span className="text-sm">Required</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => addQuestion(section.id, 'text')}
              className="text-sm text-accent hover:text-accent-dark"
            >
              + Text
            </button>
            <button
              type="button"
              onClick={() => addQuestion(section.id, 'checkbox')}
              className="text-sm text-accent hover:text-accent-dark"
            >
              + Checkbox
            </button>
            <button
              type="button"
              onClick={() => addQuestion(section.id, 'radio')}
              className="text-sm text-accent hover:text-accent-dark"
            >
              + Radio
            </button>
            <button
              type="button"
              onClick={() => addQuestion(section.id, 'markdown')}
              className="text-sm text-accent hover:text-accent-dark"
            >
              + Markdown
            </button>
            <button
              type="button"
              onClick={() => addQuestion(section.id, 'dropdown')}
              className="text-sm text-accent hover:text-accent-dark"
            >
              + Dropdown
            </button>
            <button
              type="button"
              onClick={() => addQuestion(section.id, 'yes-no')}
              className="text-sm text-accent hover:text-accent-dark"
            >
              + Yes/No
            </button>
          </div>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addSection}
        className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-accent hover:text-accent rounded-lg bg-white"
      >
        + Add Section
      </button>
      
      <div className="flex justify-end sticky bottom-0 pt-4 pb-2 bg-white border-t">
        <button
          type="button"
          onClick={() => {
            const form: ConsentForm = {
              id: initialData?.id ?? uuidv4(),
              title: initialData?.title ?? 'New Consent Form',
              serviceIds: initialData?.serviceIds ?? [],
              isActive: initialData?.isActive ?? false,
              version: initialData?.version ?? 1,
              sections,
              content: initialData?.content,
            };
            onSave(form);
          }}
          className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-dark"
        >
          Save Form
        </button>
      </div>
    </div>
  );
}
