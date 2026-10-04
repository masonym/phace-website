import { DateTime } from 'luxon';

/** The clinic is in Chilliwack, BC. Appointment times are always shown in its timezone. */
export const CLINIC_TIME_ZONE = 'America/Vancouver';

/**
 * Formats an ISO timestamp in clinic time using a Luxon format string,
 * e.g. 'h:mm a' or 'cccc, LLLL d, yyyy'.
 */
export function formatClinicTime(iso: string, format: string): string {
    return DateTime.fromISO(iso, { zone: CLINIC_TIME_ZONE }).toFormat(format);
}

/** True when the visitor's device is set to a different timezone than the clinic. */
export function isOutsideClinicTimeZone(): boolean {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone !== CLINIC_TIME_ZONE;
    } catch {
        return false;
    }
}
