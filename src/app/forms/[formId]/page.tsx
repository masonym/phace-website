'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ConsentFormRenderer from '@/components/booking/ConsentFormRenderer';
import { ConsentForm } from '@/types/consentForm';

function transformForm(raw: any): ConsentForm {
    return {
        id: raw.id,
        title: raw.title,
        serviceIds: raw.serviceIds || [],
        isActive: raw.isActive ?? true,
        version: raw.version || 1,
        content: raw.content,
        sections: (raw.sections || []).map((section: any) => ({
            id: section.id,
            title: section.title,
            questions: (section.questions || []).map((q: any) => {
                const base = { id: q.id, type: q.type, required: q.required, label: q.label };
                switch (q.type) {
                    case 'text':
                        return { ...base, type: 'text' as const, placeholder: q.placeholder || q.content };
                    case 'checkbox':
                    case 'radio':
                        return { ...base, type: q.type as 'checkbox' | 'radio', options: q.options || [] };
                    case 'markdown':
                        return { ...base, type: 'markdown' as const, content: q.content || '' };
                    case 'dropdown':
                        return { ...base, type: 'dropdown' as const, options: q.options || [] };
                    case 'yes-no':
                        return { ...base, type: 'yes-no' as const };
                    default:
                        return base;
                }
            }),
        })),
    };
}

function validateResponses(form: ConsentForm, responses: Record<string, any>): boolean {
    if (form.content) {
        return responses.agreed?.value === true;
    }
    return (form.sections || []).every(section =>
        section.questions.every(q => {
            if (!q.required) return true;
            if (q.type === 'markdown') return true;
            const val = responses[q.id]?.value;
            if (Array.isArray(val)) return val.length > 0;
            return val !== undefined && val !== '' && val !== null;
        })
    );
}

export default function AdHocConsentFormPage() {
    const params = useParams();
    const formId = params?.formId as string;

    const [form, setForm] = useState<ConsentForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [validationError, setValidationError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!formId) return;
        const fetchForm = async () => {
            try {
                const res = await fetch(`/api/booking/consent-forms?id=${formId}`);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || 'Failed to load form');
                }
                const data = await res.json();
                setForm(transformForm(data));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load form');
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [formId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (!form) return;

        if (!validateResponses(form, responses)) {
            setValidationError('Please complete all required fields before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const formattedResponses = (form.sections || []).flatMap(section =>
                section.questions
                    .filter(q => q.type !== 'markdown')
                    .map(q => {
                        const val = responses[q.id]?.value;
                        let answer = '';
                        if (q.type === 'checkbox' && Array.isArray(val)) {
                            const opts = (q as any).options || [];
                            answer = val.map((id: string) => opts.find((o: any) => o.id === id)?.label || id).join(', ');
                        } else if (q.type === 'radio' || q.type === 'dropdown') {
                            const opts = (q as any).options || [];
                            answer = opts.find((o: any) => o.id === val)?.label || String(val ?? '');
                        } else {
                            answer = String(val ?? '');
                        }
                        return {
                            questionId: q.id,
                            question: q.label,
                            answer,
                            timestamp: responses[q.id]?.timestamp || new Date().toISOString(),
                        };
                    })
            );

            const res = await fetch('/api/booking/consent-forms/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formId: form.id,
                    formTitle: form.title,
                    clientName: clientInfo.name,
                    clientEmail: clientInfo.email,
                    clientPhone: clientInfo.phone,
                    responses: formattedResponses,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to submit form');
            }

            setSubmitted(true);
        } catch (err) {
            setValidationError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-gray-500 text-lg">Loading form...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-light mb-3 text-gray-800">Form Not Found</h2>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-light mb-3 text-gray-800">Thank You, {clientInfo.name}!</h2>
                    <p className="text-gray-500">Your consent form has been submitted successfully. You may now close this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-light text-gray-900 mb-1">{form?.title}</h1>
                <p className="text-gray-500 text-sm">Please complete all required fields and submit.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Client Information */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-800">Your Information</h2>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={clientInfo.name}
                            onChange={e => setClientInfo(p => ({ ...p, name: e.target.value }))}
                            placeholder="Jane Smith"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={clientInfo.email}
                            onChange={e => setClientInfo(p => ({ ...p, email: e.target.value }))}
                            placeholder="jane@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={clientInfo.phone}
                            onChange={e => setClientInfo(p => ({ ...p, phone: e.target.value }))}
                            placeholder="(604) 555-0123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                </div>

                {/* Consent Form Content */}
                {form && (
                    <div className="border border-gray-200 rounded-lg p-6">
                        <ConsentFormRenderer
                            form={form}
                            onChange={setResponses}
                            responses={responses}
                        />
                    </div>
                )}

                {validationError && (
                    <p className="text-red-600 text-sm">{validationError}</p>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-accent text-white px-8 py-3 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting...' : 'Submit Consent Form'}
                    </button>
                </div>
            </form>
        </div>
    );
}
