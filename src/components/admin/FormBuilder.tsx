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

      const baseQuestion = {
        id: uuidv4(),
        required: false,
        label: 'New Question',
      };

      let newQuestion: Question;
      switch (type) {
        case 'text':
          newQuestion = {
            ...baseQuestion,
            type: 'text',
            placeholder: 'Enter your answer',
          };
          break;
        case 'checkbox':
          newQuestion = {
            ...baseQuestion,
            type: 'checkbox',
            options: [{ id: uuidv4(), label: 'Option 1' }],
          };
          break;
        case 'radio':
          newQuestion = {
            ...baseQuestion,
            type: 'radio',
            options: [{ id: uuidv4(), label: 'Option 1' }],
          };
          break;
        case 'markdown':
          newQuestion = {
            ...baseQuestion,
            type: 'markdown',
            content: '',
          };
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
          return { ...question, ...updates };
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
          if (question.type !== 'checkbox' && question.type !== 'radio') return question;
          return {
            ...question,
            options: [...question.options, { id: uuidv4(), label: `Option ${question.options.length + 1}` }],
          };
        }),
      };
    }));
  };

  return (
    <div className="space-y-6 overflow-visible">
      {sections.map(section => (
        <div key={section.id} className="border rounded-lg p-4 space-y-4 bg-white">
          <input
            type="text"
            value={section.title}
            onChange={(e) => {
              setSections(sections.map(s => 
                s.id === section.id ? { ...s, title: e.target.value } : s
              ));
            }}
            className="text-lg font-semibold w-full"
          />
          
          <div className="space-y-4">
            {section.questions.map(question => (
              <div key={question.id} className="border-l-4 pl-4 space-y-2">
                <input
                  type="text"
                  value={question.label}
                  onChange={(e) => updateQuestion(section.id, question.id, { label: e.target.value })}
                  className="w-full"
                />
                
                {question.type === 'markdown' && (
                  <textarea
                    value={(question as MarkdownQuestion).content}
                    onChange={(e) => updateQuestion(section.id, question.id, { content: e.target.value })}
                    className="w-full h-32"
                  />
                )}
                
                {(question.type === 'checkbox' || question.type === 'radio') && (
                  <div className="space-y-2">
                    {(question as CheckboxQuestion | RadioQuestion).options.map(option => (
                      <input
                        key={option.id}
                        type="text"
                        value={option.label}
                        onChange={(e) => {
                          const updatedOptions = (question as CheckboxQuestion | RadioQuestion).options.map(opt =>
                            opt.id === option.id ? { ...opt, label: e.target.value } : opt
                          );
                          updateQuestion(section.id, question.id, { options: updatedOptions });
                        }}
                        className="w-full ml-4"
                      />
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
          onClick={() => onSave({ ...initialData, sections })}
          className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-dark"
        >
          Save Form
        </button>
      </div>
    </div>
  );
}