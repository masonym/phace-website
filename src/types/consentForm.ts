export interface QuestionBase {
  id: string;
  type: 'text' | 'checkbox' | 'radio' | 'markdown';
  required: boolean;
  label: string;
}

export interface TextQuestion extends QuestionBase {
  type: 'text';
  placeholder?: string;
}

export interface CheckboxQuestion extends QuestionBase {
  type: 'checkbox';
  options: Array<{
    id: string;
    label: string;
  }>;
}

export interface RadioQuestion extends QuestionBase {
  type: 'radio';
  options: Array<{
    id: string;
    label: string;
  }>;
}

export interface MarkdownQuestion extends QuestionBase {
  type: 'markdown';
  content: string;
}

export type Question = TextQuestion | CheckboxQuestion | RadioQuestion | MarkdownQuestion;

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

export interface ConsentForm {
  sections: ConsentFormSection[];
}
