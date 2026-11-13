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

/**
 * The UTC instants spanning whole clinic days from startDate through endDate (yyyy-MM-dd):
 * midnight clinic time at the start to midnight clinic time after the end, so evening
 * openings on the last day are included and DST is handled.
 */
export function clinicDayRange(startDate: string, endDate: string): { startAt: string; endAt: string } {
    const start = DateTime.fromISO(startDate, { zone: CLINIC_TIME_ZONE }).startOf('day');
    const end = DateTime.fromISO(endDate, { zone: CLINIC_TIME_ZONE }).startOf('day').plus({ days: 1 });
    if (!start.isValid || !end.isValid) throw new Error(`Invalid date range ${startDate}..${endDate}`);
    return {
        startAt: start.toUTC().toISO({ suppressMilliseconds: true })!,
        endAt: end.toUTC().toISO({ suppressMilliseconds: true })!,
    };
}
