'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, X } from 'lucide-react';
import ConsentFormForm from '@/components/admin/ConsentFormForm';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ConsentFormRenderer from '@/components/booking/ConsentFormRenderer';
import { adminFetch } from '@/lib/auth/clientSession';
import { normalizeConsentForm } from '@/lib/utils/consentForms';
import { formatClinicTime } from '@/lib/utils/clinicTime';
import { ConsentForm } from '@/types/consentForm';
import type { CatalogSnapshot } from '@/lib/services/adminCatalogService';

interface PickerCategory {
    id: string;
    name: string;
    services: { id: string; name: string; categoryId: string }[];
}

interface ConsentResponse {
    id: string;
    formId: string;
    formTitle: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    responses: { questionId: string; question: string; answer: string }[];
    submittedAt: string;
}

type Tab = 'forms' | 'responses';

/** Bookable categories and their services, in the shape the service picker expects */
function toPickerCategories(catalog: CatalogSnapshot): PickerCategory[] {
    return catalog.categories
        .filter(c => c.bookable)
        .map(category => ({
            id: category.id,
            name: category.name,
            services: catalog.services
                .filter(s => s.categoryIds.includes(category.id))
                .map(s => ({ id: s.id, name: s.name, categoryId: category.id })),
        }))
        .filter(c => c.services.length > 0);
}

export default function ConsentFormsPage() {
    const [tab, setTab] = useState<Tab>('forms');
    const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
    const [categories, setCategories] = useState<PickerCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingForm, setEditingForm] = useState<ConsentForm | null>(null);
    const [deletingForm, setDeletingForm] = useState<ConsentForm | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [previewForm, setPreviewForm] = useState<ConsentForm | null>(null);
    const [copiedFormId, setCopiedFormId] = useState<string | null>(null);

    const flash = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        if (type === 'success') setTimeout(() => setMessage(null), 3000);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [formsResponse, catalogResponse] = await Promise.all([
                    fetch('/api/booking/consent-forms', { cache: 'no-store' }),
                    adminFetch('/api/admin/catalog'),
                ]);
                if (!formsResponse.ok) throw new Error('Failed to load consent forms');
                setConsentForms((await formsResponse.json()).map(normalizeConsentForm));

                if (catalogResponse.ok) {
                    setCategories(toPickerCategories(await catalogResponse.json()));
                } else {
                    flash('error', 'Could not load services from Square, so forms cannot be assigned right now');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                flash('error', 'Failed to load consent forms');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const closeEditor = () => {
        setShowForm(false);
        setEditingForm(null);
    };

    const handleSave = async (formData: ConsentForm) => {
        const isEdit = !!editingForm?.id;
        try {
            const response = await adminFetch('/api/booking/consent-forms', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(isEdit ? { ...formData, id: editingForm!.id } : formData),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) throw new Error(data?.error || `Failed to ${isEdit ? 'update' : 'create'} consent form`);

            const saved = normalizeConsentForm(data);
            setConsentForms(prev => isEdit ? prev.map(f => (f.id === saved.id ? saved : f)) : [...prev, saved]);
            closeEditor();
            flash('success', `Consent form ${isEdit ? 'updated' : 'created'}`);
        } catch (error) {
            console.error('Error saving consent form:', error);
            flash('error', error instanceof Error ? error.message : 'Failed to save consent form');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingForm) return;
        try {
            const response = await adminFetch(`/api/booking/consent-forms?id=${deletingForm.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to delete consent form');
            }
            setConsentForms(prev => prev.filter(form => form.id !== deletingForm.id));
            flash('success', 'Consent form deleted');
        } catch (error) {
            console.error('Error deleting consent form:', error);
            flash('error', error instanceof Error ? error.message : 'Failed to delete consent form');
        } finally {
            setDeletingForm(null);
        }
    };

    const copyLink = async (form: ConsentForm) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/forms/${form.id}`);
            setCopiedFormId(form.id);
            setTimeout(() => setCopiedFormId(null), 2000);
        } catch {
            flash('error', 'Could not copy the link');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-semibold">Consent Forms</h1>
                    <p className="text-gray-600 mt-2">
                        Forms are shown to clients when they book the services they&apos;re assigned to, or can be sent as a link.
                    </p>
                </div>
                {tab === 'forms' && (
                    <button
                        onClick={() => {
                            setEditingForm(null);
                            setShowForm(true);
                        }}
                        className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 w-full sm:w-auto shrink-0"
                    >
                        Create Form
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-6 border-b" role="tablist">
                {([['forms', 'Forms'], ['responses', 'Link responses']] as [Tab, string][]).map(([id, label]) => (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium ${tab === id
                            ? 'border-accent text-accent'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {message && (
                <div className={`p-4 rounded-md mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {tab === 'responses' ? (
                <ConsentResponses forms={consentForms} />
            ) : loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : consentForms.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg border">No consent forms yet</div>
            ) : (
                <div className="space-y-4">
                    {consentForms.map(form => {
                        const services = form.serviceIds.length;
                        return (
                            <div key={form.id} className="bg-white p-5 rounded-lg shadow-sm border">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="space-y-2 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-medium">{form.title}</h3>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">v{form.version}</span>
                                            {!form.isActive && (
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Inactive</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {services === 0
                                                ? 'Not assigned to any services (link only)'
                                                : `Shown when booking ${services} service${services === 1 ? '' : 's'}`}
                                            {' · '}
                                            {form.sections.length} section{form.sections.length === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                                        <button
                                            onClick={() => copyLink(form)}
                                            className="flex-1 sm:flex-none bg-accent/10 text-accent px-3 py-2 text-sm rounded-md hover:bg-accent/20"
                                        >
                                            {copiedFormId === form.id ? 'Copied!' : 'Copy Link'}
                                        </button>
                                        <button
                                            onClick={() => setPreviewForm(form)}
                                            className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded-md hover:bg-gray-200"
                                        >
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingForm(form);
                                                setShowForm(true);
                                            }}
                                            className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded-md hover:bg-gray-200"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeletingForm(form)}
                                            className="flex-1 sm:flex-none bg-red-50 text-red-700 px-3 py-2 text-sm rounded-md hover:bg-red-100"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-semibold">{editingForm ? 'Edit Consent Form' : 'Create Consent Form'}</h2>
                        </div>
                        <div className="p-4">
                            <ConsentFormForm
                                categories={categories}
                                onSubmit={handleSave}
                                onCancel={closeEditor}
                                initialData={editingForm}
                            />
                        </div>
                    </div>
                </div>
            )}

            {previewForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewForm(null)}>
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Preview: {previewForm.title}</h2>
                            <button onClick={() => setPreviewForm(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <ConsentFormRenderer form={previewForm} onChange={() => { }} categoryId="" />
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deletingForm !== null}
                title="Delete Consent Form"
                message={deletingForm ? `Delete "${deletingForm.title}"? Clients will stop seeing it when they book. Responses already submitted are kept.` : ''}
                onConfirm={handleDeleteConfirm}
                onClose={() => setDeletingForm(null)}
                confirmLabel="Delete"
                cancelLabel="Cancel"
            />
        </div>
    );
}

/** Answers clients submitted through a form's shareable link (booking answers live in the booking's notes in Square) */
function ConsentResponses({ forms }: { forms: ConsentForm[] }) {
    const [responses, setResponses] = useState<ConsentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formFilter, setFormFilter] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<ConsentResponse | null>(null);

    useEffect(() => {
        adminFetch('/api/booking/consent-forms/responses')
            .then(async response => {
                const data = await response.json().catch(() => null);
                if (!response.ok) throw new Error(data?.error || 'Failed to load responses');
                setResponses((data as ConsentResponse[]).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return responses.filter(r =>
            (!formFilter || r.formId === formFilter) &&
            (!term || r.clientName.toLowerCase().includes(term) || r.clientEmail.toLowerCase().includes(term))
        );
    }, [responses, formFilter, search]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    if (error) return <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>;

    return (
        <div>
            <p className="text-sm text-gray-500 mb-4">
                Forms filled in through a shared link. Answers given while booking are saved in that appointment&apos;s notes, which you can see in the Calendar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <select
                    value={formFilter}
                    onChange={(e) => setFormFilter(e.target.value)}
                    aria-label="Filter by form"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-accent focus:ring-accent"
                >
                    <option value="">All forms</option>
                    {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by client name or email"
                    aria-label="Search responses"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-accent focus:ring-accent"
                />
            </div>

            {visible.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg border">No responses</div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Submitted', 'Client', 'Form'].map(h => (
                                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {visible.map(r => (
                                <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatClinicTime(r.submittedAt, 'LLL d, yyyy h:mm a')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelected(r);
                                            }}
                                            className="text-accent hover:underline"
                                        >
                                            {r.clientName}
                                        </button>
                                        <div className="text-gray-500">{r.clientEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{r.formTitle}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="response-title"
                        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start p-6 border-b">
                            <div>
                                <h2 id="response-title" className="text-xl font-semibold">{selected.formTitle}</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selected.clientName} &middot; submitted {formatClinicTime(selected.submittedAt, 'LLL d, yyyy h:mm a')}
                                </p>
                                <p className="text-sm mt-1">
                                    <a href={`mailto:${selected.clientEmail}`} className="text-accent hover:underline">{selected.clientEmail}</a>
                                    {selected.clientPhone && <> &middot; <a href={`tel:${selected.clientPhone}`} className="text-accent hover:underline">{selected.clientPhone}</a></>}
                                </p>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <dl className="p-6 space-y-4">
                            {selected.responses.map(r => (
                                <div key={r.questionId}>
                                    <dt className="text-sm font-medium text-gray-700">{r.question}</dt>
                                    <dd className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{r.answer || <span className="text-gray-400">No answer</span>}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
}
