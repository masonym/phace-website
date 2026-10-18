import type { ConsentForm, Question } from '@/types/consentForm';

/** What ConsentFormRenderer collects: one entry per question ID ("agreed" for legacy single-text forms) */
export type ConsentFormValues = Record<string, { value: any; timestamp?: string } | undefined>;

export interface ConsentAnswer {
    questionId: string;
    question: string;
    answer: string;
    timestamp: string;
}

const KNOWN_TYPES = ['text', 'checkbox', 'radio', 'markdown', 'dropdown', 'yes-no'];

function normalizeQuestion(q: any): Question | null {
    const base = { id: q.id, required: !!q.required, label: q.label ?? '' };
    switch (q.type) {
        case 'text':
            // Older forms stored the placeholder in `content`
            return { ...base, type: 'text', placeholder: q.placeholder || q.content };
        case 'checkbox':
        case 'radio':
        case 'dropdown':
            return { ...base, type: q.type, options: q.options || [] };
        case 'markdown':
            return { ...base, type: 'markdown', content: q.content || '' };
        case 'yes-no':
            return { ...base, type: 'yes-no' };
        default:
            return null;
    }
}

/**
 * Turns a stored form into a ConsentForm. Questions of an unknown type are dropped
 * instead of failing, so one odd question can't block a booking.
 */
export function normalizeConsentForm(raw: any): ConsentForm {
    return {
        id: raw.id,
        title: raw.title ?? '',
        serviceIds: raw.serviceIds || [],
        isActive: raw.isActive ?? true,
        version: raw.version || 1,
        content: raw.content,
        sections: (raw.sections || []).map((section: any) => ({
            id: section.id,
            title: section.title ?? '',
            questions: (section.questions || [])
                .filter((q: any) => {
                    if (KNOWN_TYPES.includes(q?.type)) return true;
                    console.warn(`Skipping consent form question with unknown type "${q?.type}"`);
                    return false;
                })
                .map(normalizeQuestion)
                .filter((q: Question | null): q is Question => q !== null),
        })),
    };
}

function hasValue(value: any): boolean {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return value !== undefined && value !== null && value !== false;
}

/** True when every required question is answered (markdown blocks are never "answered") */
export function isConsentFormComplete(form: ConsentForm, values: ConsentFormValues = {}): boolean {
    if (form.content) return values.agreed?.value === true;

    return form.sections.every(section =>
        section.questions.every(q => q.type === 'markdown' || !q.required || hasValue(values[q.id]?.value))
    );
}

function optionLabel(q: Question, id: any): string {
    const options = 'options' in q ? q.options : [];
    return options.find(o => o.id === id)?.label ?? String(id ?? '');
}

function formatAnswer(q: Question, value: any): string {
    if (value === undefined || value === null) return '';
    switch (q.type) {
        case 'checkbox':
            return Array.isArray(value) ? value.map(id => optionLabel(q, id)).join(', ') : '';
        case 'radio':
        case 'dropdown':
            return value === '' ? '' : optionLabel(q, value);
        case 'yes-no':
            return value === 'yes' ? 'Yes' : value === 'no' ? 'No' : '';
        default:
            return String(value);
    }
}

/** Question/answer pairs in readable form (option labels, not IDs) for storing or emailing */
export function formatConsentAnswers(form: ConsentForm, values: ConsentFormValues = {}): ConsentAnswer[] {
    const now = new Date().toISOString();

    if (form.content) {
        return [{
            questionId: 'agreed',
            question: 'I agree to the terms above',
            answer: values.agreed?.value === true ? 'Yes' : 'No',
            timestamp: values.agreed?.timestamp || now,
        }];
    }

    return form.sections.flatMap(section =>
        section.questions
            .filter(q => q.type !== 'markdown')
            .map(q => ({
                questionId: q.id,
                question: q.label,
                answer: formatAnswer(q, values[q.id]?.value),
                timestamp: values[q.id]?.timestamp || now,
            }))
    );
}
