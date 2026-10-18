const CONSENT_MARKER = 'CONSENT FORMS:';

/**
 * Website bookings store the visit details in the Square seller note, then a
 * "CONSENT FORMS:" marker, then the client's consent form answers.
 */
export function splitSellerNote(note?: string): { details?: string; consent?: string } {
    if (!note) return {};
    const index = note.indexOf(CONSENT_MARKER);
    if (index === -1) return { details: note.trim() || undefined };

    const details = note.slice(0, index).replace(/\n-{3,}\s*$/, '').trim();
    const consent = note.slice(index + CONSENT_MARKER.length).trim();
    return { details: details || undefined, consent: consent || undefined };
}
