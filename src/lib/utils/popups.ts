/** How often one visitor sees a popup while it's live */
export type PopupFrequency = 'daily' | 'session' | 'once';

export const POPUP_FREQUENCIES: { value: PopupFrequency; label: string }[] = [
    { value: 'daily', label: 'Once a day' },
    { value: 'session', label: 'Once per visit' },
    { value: 'once', label: 'Only once ever' },
];

/** What the visitor sees */
export interface PopupContent {
    imageUrl?: string;
    imageAlt?: string;
    /** Small uppercase line above the title, e.g. "Pre-sale · Now through October 10" */
    eyebrow?: string;
    title: string;
    /** Markdown: paragraphs, **bold**, links and lists */
    body?: string;
    /** Rendered as a checklist */
    bullets: string[];
    /** e.g. "$259.99" */
    price?: string;
    /** Sits beside the price, e.g. "complete collection" */
    priceNote?: string;
    /** Accent line under the price, e.g. "+ a $100 Phace service credit" */
    highlight?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    /** Small centred text under the button */
    ctaNote?: string;
    finePrint?: string;
}

export interface PopupFields extends PopupContent {
    /** Admin-only label, never shown on the site */
    name: string;
    isActive: boolean;
    startsAt?: string;
    endsAt?: string;
    frequency: PopupFrequency;
    delaySeconds: number;
}

export interface Popup extends PopupFields {
    id: string;
    createdAt: string;
    updatedAt: string;
}

/** The subset the public site needs to decide whether to show a popup and render it */
export type PublicPopup = Omit<Popup, 'name' | 'createdAt' | 'updatedAt'>;

export type PopupStatus = 'off' | 'scheduled' | 'live' | 'ended';

export function popupStatus(popup: Pick<PopupFields, 'isActive' | 'startsAt' | 'endsAt'>, now = new Date()): PopupStatus {
    if (popup.endsAt && now >= new Date(popup.endsAt)) return 'ended';
    if (!popup.isActive) return 'off';
    if (popup.startsAt && now < new Date(popup.startsAt)) return 'scheduled';
    return 'live';
}

/**
 * Picks the popup to show from the ones the visitor hasn't already dismissed.
 * When several are live at once, the one that started most recently wins.
 */
export function pickPopup<T extends Pick<PopupFields, 'isActive' | 'startsAt' | 'endsAt'>>(
    popups: T[],
    now = new Date(),
): T | null {
    const live = popups.filter((popup) => popupStatus(popup, now) === 'live');
    live.sort((a, b) => (b.startsAt ?? '').localeCompare(a.startsAt ?? ''));
    return live[0] ?? null;
}

/** Absolute http(s) links and on-site paths are allowed; anything else (javascript:, data:) is not */
export function isSafeUrl(url: string): boolean {
    if (url.startsWith('/') && !url.startsWith('//')) return true;
    try {
        const { protocol } = new URL(url);
        return protocol === 'https:' || protocol === 'http:';
    } catch {
        return false;
    }
}

export function isExternalUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

const MAX_TEXT = 300;
const MAX_LONG_TEXT = 4000;

/**
 * Validates the editable popup fields from an admin request body.
 * Blank optional text comes back undefined, meaning "not set".
 */
export function parsePopupFields(body: any): { fields: PopupFields } | { error: string } {
    if (!body || typeof body !== 'object') return { error: 'Invalid request body' };

    const errors: string[] = [];
    const text = (key: string, label: string, max = MAX_TEXT): string | undefined => {
        const value = body[key];
        if (value === undefined || value === null) return undefined;
        if (typeof value !== 'string') {
            errors.push(`${label} must be text`);
            return undefined;
        }
        const trimmed = value.trim();
        if (trimmed.length > max) errors.push(`${label} must be ${max} characters or fewer`);
        return trimmed || undefined;
    };
    const date = (key: string, label: string): string | undefined => {
        const value = body[key];
        if (!value) return undefined;
        const parsed = new Date(value);
        if (typeof value !== 'string' || Number.isNaN(parsed.getTime())) {
            errors.push(`${label} is not a valid date`);
            return undefined;
        }
        return parsed.toISOString();
    };

    const name = text('name', 'Name');
    const title = text('title', 'Title');
    if (!name) errors.push('Name is required');
    if (!title) errors.push('Title is required');

    const startsAt = date('startsAt', 'Start date');
    const endsAt = date('endsAt', 'End date');
    if (startsAt && endsAt && endsAt <= startsAt) errors.push('End date must be after the start date');

    const frequency = body.frequency ?? 'daily';
    if (!POPUP_FREQUENCIES.some((option) => option.value === frequency)) {
        errors.push('Frequency must be daily, session or once');
    }

    const delaySeconds = body.delaySeconds ?? 2;
    if (!Number.isInteger(delaySeconds) || delaySeconds < 0 || delaySeconds > 60) {
        errors.push('Delay must be a whole number of seconds from 0 to 60');
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
        errors.push('isActive must be true or false');
    }

    let bullets: string[] = [];
    if (body.bullets !== undefined && body.bullets !== null) {
        if (!Array.isArray(body.bullets) || body.bullets.some((item: unknown) => typeof item !== 'string')) {
            errors.push('Checklist must be a list of text');
        } else {
            bullets = body.bullets.map((item: string) => item.trim()).filter(Boolean);
            if (bullets.length > 12) errors.push('Checklist can have at most 12 items');
            if (bullets.some((item) => item.length > MAX_TEXT)) errors.push(`Checklist items must be ${MAX_TEXT} characters or fewer`);
        }
    }

    const imageUrl = text('imageUrl', 'Image URL', 1000);
    const ctaUrl = text('ctaUrl', 'Button link', 1000);
    const ctaLabel = text('ctaLabel', 'Button text');
    if (imageUrl && !isSafeUrl(imageUrl)) errors.push('Image URL must start with https:// or /');
    if (ctaUrl && !isSafeUrl(ctaUrl)) errors.push('Button link must start with https:// or /');
    if (!!ctaUrl !== !!ctaLabel) errors.push('Button text and button link go together: fill in both or neither');

    const fields: PopupFields = {
        name: name ?? '',
        isActive: body.isActive ?? true,
        startsAt,
        endsAt,
        frequency,
        delaySeconds,
        imageUrl,
        imageAlt: text('imageAlt', 'Image description'),
        eyebrow: text('eyebrow', 'Small heading'),
        title: title ?? '',
        body: text('body', 'Body', MAX_LONG_TEXT),
        bullets,
        price: text('price', 'Price'),
        priceNote: text('priceNote', 'Price note'),
        highlight: text('highlight', 'Highlight'),
        ctaLabel,
        ctaUrl,
        ctaNote: text('ctaNote', 'Note under button'),
        finePrint: text('finePrint', 'Fine print', MAX_LONG_TEXT),
    };

    return errors.length ? { error: errors.join('. ') } : { fields };
}

/** Strips the admin-only fields before a popup goes to the public site */
export function toPublicPopup({ name, createdAt, updatedAt, ...rest }: Popup): PublicPopup {
    return rest;
}
