'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/auth/clientSession';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import PopupCard from '@/components/promotions/PopupCard';
import PopupModal from '@/components/promotions/PopupModal';
import { toLocalInput, fromLocalInput } from '@/lib/utils/datetimeLocal';
import {
    POPUP_FREQUENCIES,
    popupStatus,
    type Popup,
    type PopupContent,
    type PopupFrequency,
    type PopupStatus,
} from '@/lib/utils/popups';

/** Form values: dates are datetime-local strings and the checklist is one item per line */
interface FormState {
    name: string;
    isActive: boolean;
    startsAt: string;
    endsAt: string;
    frequency: PopupFrequency;
    delaySeconds: number;
    imageUrl: string;
    imageAlt: string;
    eyebrow: string;
    title: string;
    body: string;
    bulletsText: string;
    price: string;
    priceNote: string;
    highlight: string;
    ctaLabel: string;
    ctaUrl: string;
    ctaNote: string;
    finePrint: string;
}

const EMPTY_FORM: FormState = {
    name: '',
    isActive: true,
    startsAt: '',
    endsAt: '',
    frequency: 'daily',
    delaySeconds: 2,
    imageUrl: '',
    imageAlt: '',
    eyebrow: '',
    title: '',
    body: '',
    bulletsText: '',
    price: '',
    priceNote: '',
    highlight: '',
    ctaLabel: '',
    ctaUrl: '',
    ctaNote: '',
    finePrint: '',
};

const toForm = (popup: Popup): FormState => ({
    name: popup.name,
    isActive: popup.isActive,
    startsAt: popup.startsAt ? toLocalInput(popup.startsAt) : '',
    endsAt: popup.endsAt ? toLocalInput(popup.endsAt) : '',
    frequency: popup.frequency,
    delaySeconds: popup.delaySeconds,
    imageUrl: popup.imageUrl ?? '',
    imageAlt: popup.imageAlt ?? '',
    eyebrow: popup.eyebrow ?? '',
    title: popup.title,
    body: popup.body ?? '',
    bulletsText: popup.bullets.join('\n'),
    price: popup.price ?? '',
    priceNote: popup.priceNote ?? '',
    highlight: popup.highlight ?? '',
    ctaLabel: popup.ctaLabel ?? '',
    ctaUrl: popup.ctaUrl ?? '',
    ctaNote: popup.ctaNote ?? '',
    finePrint: popup.finePrint ?? '',
});

const toContent = (form: FormState): PopupContent => ({
    imageUrl: form.imageUrl.trim() || undefined,
    imageAlt: form.imageAlt.trim() || undefined,
    eyebrow: form.eyebrow.trim() || undefined,
    title: form.title.trim() || 'Your title here',
    body: form.body.trim() || undefined,
    bullets: form.bulletsText.split('\n').map((line) => line.trim()).filter(Boolean),
    price: form.price.trim() || undefined,
    priceNote: form.priceNote.trim() || undefined,
    highlight: form.highlight.trim() || undefined,
    ctaLabel: form.ctaLabel.trim() || undefined,
    ctaUrl: form.ctaUrl.trim() || undefined,
    ctaNote: form.ctaNote.trim() || undefined,
    finePrint: form.finePrint.trim() || undefined,
});

const toPayload = (form: FormState) => {
    const { bulletsText, startsAt, endsAt, ...rest } = form;
    return {
        ...rest,
        bullets: toContent(form).bullets,
        startsAt: fromLocalInput(startsAt),
        endsAt: fromLocalInput(endsAt),
    };
};

const STATUS_BADGES: Record<PopupStatus, { text: string; className: string }> = {
    live: { text: 'Live', className: 'bg-green-100 text-green-800' },
    scheduled: { text: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
    off: { text: 'Off', className: 'bg-gray-100 text-gray-700' },
    ended: { text: 'Ended', className: 'bg-amber-100 text-amber-800' },
};

const formatDate = (iso?: string) =>
    iso
        ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : null;

const inputClass = 'w-full p-3 border rounded-lg';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium mb-1">{label}</span>
            {hint && <span className="block text-sm text-gray-500 mb-2">{hint}</span>}
            {children}
        </label>
    );
}

export default function AdminPopupsPage() {
    const [popups, setPopups] = useState<Popup[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState('');
    /** null: showing the list; 'new': creating; otherwise the id being edited */
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [deleting, setDeleting] = useState<Popup | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchPopups = async () => {
        try {
            const response = await adminFetch('/api/admin/popups');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            setPopups(await response.json());
            setListError('');
        } catch (error) {
            console.error('Failed to fetch popups:', error);
            setListError('Could not load popups.');
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchPopups();
    }, []);

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const openEditor = (popup?: Popup, asCopy = false) => {
        setEditing(popup && !asCopy ? popup.id : 'new');
        setForm(popup ? { ...toForm(popup), ...(asCopy ? { name: `${popup.name} (copy)`, isActive: false } : {}) } : EMPTY_FORM);
        setMessage(null);
        window.scrollTo({ top: 0 });
    };

    const closeEditor = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const isNew = editing === 'new';
            const response = await adminFetch(isNew ? '/api/admin/popups' : `/api/admin/popups/${encodeURIComponent(editing!)}`, {
                method: isNew ? 'POST' : 'PUT',
                body: JSON.stringify(toPayload(form)),
            });
            const result = await response.json();
            if (!response.ok) {
                setMessage({ text: result.error || 'Failed to save popup', isError: true });
                return;
            }
            setMessage({ text: `"${result.name}" ${isNew ? 'created' : 'saved'}. Changes reach the website within a minute.`, isError: false });
            closeEditor();
            fetchPopups();
        } catch (error) {
            setMessage({ text: error instanceof Error ? error.message : 'Failed to save popup', isError: true });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const popup = deleting;
        setDeleting(null);
        if (!popup) return;

        try {
            const response = await adminFetch(`/api/admin/popups/${encodeURIComponent(popup.id)}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                setMessage({ text: result.error || 'Failed to delete popup', isError: true });
                return;
            }
            setMessage({ text: `"${popup.name}" deleted.`, isError: false });
            fetchPopups();
        } catch {
            setMessage({ text: 'Failed to delete popup', isError: true });
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setMessage({ text: 'Please choose an image file.', isError: true });
            return;
        }
        setUploading(true);
        setMessage(null);
        try {
            const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
            const response = await adminFetch('/api/upload-url', {
                method: 'POST',
                body: JSON.stringify({ fileName: `popups/${Date.now()}-${safeName}`, contentType: file.type }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Could not start the upload');

            const upload = await fetch(result.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!upload.ok) throw new Error('The image upload failed');

            update('imageUrl', result.imageUrl);
        } catch (error) {
            setMessage({ text: error instanceof Error ? error.message : 'The image upload failed', isError: true });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const messageBanner = message && (
        <div className={`p-4 rounded-lg ${message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
        </div>
    );

    if (editing) {
        const content = toContent(form);
        const status = popupStatus({
            isActive: form.isActive,
            startsAt: fromLocalInput(form.startsAt),
            endsAt: fromLocalInput(form.endsAt),
        });

        return (
            <div className="max-w-7xl mx-auto p-6">
                <button onClick={closeEditor} className="text-sm text-accent hover:underline mb-4">
                    ← Back to popups
                </button>
                <h1 className="text-3xl font-bold mb-6">{editing === 'new' ? 'New Popup' : `Edit ${form.name || 'Popup'}`}</h1>

                <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 items-start">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <section className="bg-white border rounded-lg p-5 space-y-4">
                            <h2 className="text-lg font-semibold">Settings</h2>
                            <Field label="Internal name" hint="Only admins see this, e.g. “Holiday gift cards 2026”.">
                                <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} required />
                            </Field>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="Start showing (optional)" hint="Blank means right away.">
                                    <input
                                        type="datetime-local"
                                        className={inputClass}
                                        value={form.startsAt}
                                        onChange={(e) => update('startsAt', e.target.value)}
                                    />
                                </Field>
                                <Field label="Stop showing (optional)" hint="Blank means until switched off.">
                                    <input
                                        type="datetime-local"
                                        className={inputClass}
                                        value={form.endsAt}
                                        onChange={(e) => update('endsAt', e.target.value)}
                                    />
                                </Field>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="How often each visitor sees it">
                                    <select
                                        className={inputClass}
                                        value={form.frequency}
                                        onChange={(e) => update('frequency', e.target.value as PopupFrequency)}
                                    >
                                        {POPUP_FREQUENCIES.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Delay before it appears (seconds)">
                                    <input
                                        type="number"
                                        min={0}
                                        max={60}
                                        step={1}
                                        className={inputClass}
                                        value={form.delaySeconds}
                                        onChange={(e) => update('delaySeconds', parseInt(e.target.value, 10) || 0)}
                                    />
                                </Field>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} />
                                <span className="text-sm font-medium">Switched on</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGES[status].className}`}>
                                    {STATUS_BADGES[status].text}
                                </span>
                            </label>
                            <p className="text-sm text-gray-500">
                                If more than one popup is live, visitors see the one that started most recently. Popups never
                                appear during booking, checkout, sign-in or on admin pages.
                            </p>
                        </section>

                        <section className="bg-white border rounded-lg p-5 space-y-4">
                            <h2 className="text-lg font-semibold">Image</h2>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : form.imageUrl ? 'Replace image' : 'Upload image'}
                                </button>
                                {form.imageUrl && (
                                    <button type="button" onClick={() => update('imageUrl', '')} className="text-sm text-red-600 hover:underline">
                                        Remove image
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                />
                            </div>
                            <Field label="Image URL" hint="Filled in by the upload, or paste a link or a site path like /images/promotions/first-five.webp.">
                                <input className={inputClass} value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} />
                            </Field>
                            <Field label="Image description" hint="Read aloud by screen readers. Describe what's in the picture.">
                                <input className={inputClass} value={form.imageAlt} onChange={(e) => update('imageAlt', e.target.value)} />
                            </Field>
                        </section>

                        <section className="bg-white border rounded-lg p-5 space-y-4">
                            <h2 className="text-lg font-semibold">Text</h2>
                            <Field label="Small heading (optional)" hint="Shown above the title, e.g. “Pre-sale · Now through October 10”.">
                                <input className={inputClass} value={form.eyebrow} onChange={(e) => update('eyebrow', e.target.value)} />
                            </Field>
                            <Field label="Title">
                                <input className={inputClass} value={form.title} onChange={(e) => update('title', e.target.value)} required />
                            </Field>
                            <Field label="Body (optional)" hint="Leave a blank line between paragraphs. **bold**, [link text](https://...) and lines starting with - all work.">
                                <textarea className={inputClass} rows={5} value={form.body} onChange={(e) => update('body', e.target.value)} />
                            </Field>
                            <Field label="Checklist (optional)" hint="One item per line. Each gets a ✓.">
                                <textarea className={inputClass} rows={4} value={form.bulletsText} onChange={(e) => update('bulletsText', e.target.value)} />
                            </Field>
                        </section>

                        <section className="bg-white border rounded-lg p-5 space-y-4">
                            <h2 className="text-lg font-semibold">Price (optional)</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="Price" hint="e.g. $259.99">
                                    <input className={inputClass} value={form.price} onChange={(e) => update('price', e.target.value)} />
                                </Field>
                                <Field label="Beside the price" hint="e.g. complete collection">
                                    <input className={inputClass} value={form.priceNote} onChange={(e) => update('priceNote', e.target.value)} />
                                </Field>
                            </div>
                            <Field label="Highlight" hint="Accent line under the price, e.g. + a $100 Phace service credit">
                                <input className={inputClass} value={form.highlight} onChange={(e) => update('highlight', e.target.value)} />
                            </Field>
                        </section>

                        <section className="bg-white border rounded-lg p-5 space-y-4">
                            <h2 className="text-lg font-semibold">Button and fine print</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="Button text" hint="e.g. Preorder Now">
                                    <input className={inputClass} value={form.ctaLabel} onChange={(e) => update('ctaLabel', e.target.value)} />
                                </Field>
                                <Field label="Button link" hint="https://... or a site path like /store">
                                    <input className={inputClass} value={form.ctaUrl} onChange={(e) => update('ctaUrl', e.target.value)} />
                                </Field>
                            </div>
                            <Field label="Note under the button (optional)" hint="e.g. Preorders close October 10 at midnight.">
                                <input className={inputClass} value={form.ctaNote} onChange={(e) => update('ctaNote', e.target.value)} />
                            </Field>
                            <Field label="Fine print (optional)">
                                <textarea className={inputClass} rows={4} value={form.finePrint} onChange={(e) => update('finePrint', e.target.value)} />
                            </Field>
                        </section>

                        {messageBanner}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="flex-1 bg-accent text-white py-3 px-6 rounded-lg hover:bg-accent/90 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : editing === 'new' ? 'Create Popup' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={closeEditor} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                        </div>
                    </form>

                    <aside className="lg:sticky lg:top-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Preview</h2>
                            <button type="button" onClick={() => setPreviewOpen(true)} className="text-sm text-accent hover:underline">
                                Preview full screen
                            </button>
                        </div>
                        <div className="rounded-xl bg-black/40 p-4 sm:p-6 flex justify-center">
                            <PopupCard popup={content} onClose={() => {}} layout="stacked" titleId="popup-preview-title" />
                        </div>
                        <p className="text-xs text-gray-500">
                            On wide screens the image sits beside the text, as in the full-screen preview.
                        </p>
                    </aside>
                </div>

                <PopupModal popup={previewOpen ? content : null} onClose={() => setPreviewOpen(false)} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Popups</h1>
                    <p className="text-gray-500 mt-1">Announcements that appear over the website, like holiday offers or pre-sales.</p>
                </div>
                <button onClick={() => openEditor()} className="bg-accent text-white py-2.5 px-5 rounded-lg hover:bg-accent/90">
                    New popup
                </button>
            </div>

            {messageBanner}

            {loadingList ? (
                <p className="text-gray-500 py-8 text-center">Loading popups...</p>
            ) : listError ? (
                <p className="text-red-600 py-8 text-center">{listError}</p>
            ) : popups.length === 0 ? (
                <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
                    No popups yet. Create one to announce a sale, pre-order or holiday offer.
                </div>
            ) : (
                <ul className="space-y-3">
                    {popups.map((popup) => {
                        const badge = STATUS_BADGES[popupStatus(popup)];
                        const starts = formatDate(popup.startsAt);
                        const ends = formatDate(popup.endsAt);
                        return (
                            <li key={popup.id} className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                {popup.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={popup.imageUrl} alt="" className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded" />
                                ) : (
                                    <div className="hidden sm:block w-24 h-16 rounded bg-gray-100" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold">{popup.name}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${badge.className}`}>{badge.text}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">{popup.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {starts ? `From ${starts}` : 'From when switched on'}
                                        {' · '}
                                        {ends ? `until ${ends}` : 'no end date'}
                                        {' · '}
                                        {POPUP_FREQUENCIES.find((option) => option.value === popup.frequency)?.label.toLowerCase()}
                                    </p>
                                </div>
                                <div className="flex gap-4 text-sm whitespace-nowrap">
                                    <button onClick={() => openEditor(popup)} className="text-accent hover:underline">Edit</button>
                                    <button onClick={() => openEditor(popup, true)} className="text-accent hover:underline">Duplicate</button>
                                    <button onClick={() => setDeleting(popup)} className="text-red-600 hover:text-red-800">Delete</button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <ConfirmDialog
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Delete Popup"
                message={`Delete "${deleting?.name}"? To stop showing it but keep it for next time, edit it and switch it off instead.`}
            />
        </div>
    );
}
