export interface QuestionBase {
  id: string;
  type: 'text' | 'checkbox' | 'radio' | 'markdown' | 'dropdown' | 'yes-no';
  required: boolean;
  label: string;
}

export interface TextQuestion extends QuestionBase {
  type: 'text';
  placeholder?: string;
  content?: string; // Optional markdown content for the question
}

export interface CheckboxQuestion extends QuestionBase {
  type: 'checkbox';
  options: Array<{
    id: string;
    label: string;
  }>;
  content?: string; // Optional markdown content for the question
}

export interface RadioQuestion extends QuestionBase {
  type: 'radio';
  options: Array<{
    id: string;
    label: string;
  }>;
  content?: string; // Optional markdown content for the question
}

export interface MarkdownQuestion extends QuestionBase {
  type: 'markdown';
  content: string;
}

export interface DropdownQuestion extends QuestionBase {
  type: 'dropdown';
  options: Array<{
    id: string;
    label: string;
  }>;
  content?: string; // Optional markdown content for the question
}

export interface YesNoQuestion extends QuestionBase {
  type: 'yes-no';
  content?: string; // Optional markdown content for the question
}

export type Question = TextQuestion | CheckboxQuestion | RadioQuestion | MarkdownQuestion | DropdownQuestion | YesNoQuestion;

export interface ConsentFormSection {
  id: string;
  title: string;
  questions: Question[];
}

export interface ConsentForm {
  id: string;
  title: string;
  serviceIds: string[];
  isActive: boolean;
  version: number;
  sections: ConsentFormSection[];
  // For backward compatibility
  content?: string;
}
