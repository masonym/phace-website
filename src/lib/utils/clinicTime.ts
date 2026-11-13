import { DateTime, FixedOffsetZone, IANAZone, Zone, type ZoneOffsetFormat, type ZoneOffsetOptions } from 'luxon';

/** The clinic is in Chilliwack, BC. Appointment times are always shown in its timezone. */
export const CLINIC_TIME_ZONE = 'America/Vancouver';

/**
 * BC moved to permanent UTC-7 when clocks went forward on 2026-03-08 (tzdata 2026e). Node and
 * many browsers ship older timezone data that still switches Vancouver back to PST (UTC-8) in
 * November, which shows times an hour early. Square uses the new rule, so we bake it in here
 * rather than trust the runtime.
 */
const PERMANENT_UTC_MINUS_7_FROM = Date.UTC(2026, 2, 8, 10); // 2026-03-08 02:00 PST
const historicZone = IANAZone.create(CLINIC_TIME_ZONE);
const permanentZone = FixedOffsetZone.instance(-7 * 60);

class ClinicZone extends Zone {
    private pick(ts: number): Zone {
        return ts >= PERMANENT_UTC_MINUS_7_FROM ? permanentZone : historicZone;
    }

    get type() { return 'clinic'; }
    get name() { return CLINIC_TIME_ZONE; }
    get isUniversal() { return false; }
    get isValid() { return true; }

    offset(ts: number): number {
        return this.pick(ts).offset(ts);
    }

    offsetName(ts: number, opts: ZoneOffsetOptions): string {
        return this.pick(ts).offsetName(ts, opts) ?? '';
    }

    formatOffset(ts: number, format: ZoneOffsetFormat): string {
        return this.pick(ts).formatOffset(ts, format);
    }

    equals(other: Zone): boolean {
        return other instanceof ClinicZone;
    }
}

/** Luxon zone for clinic time that doesn't depend on the runtime's timezone data. */
export const clinicZone = new ClinicZone();

/** An ISO timestamp as a Luxon DateTime in clinic time. */
export function toClinicTime(iso: string): DateTime {
    return DateTime.fromISO(iso, { zone: clinicZone });
}

/**
 * Formats an ISO timestamp in clinic time using a Luxon format string,
 * e.g. 'h:mm a' or 'cccc, LLLL d, yyyy'.
 */
export function formatClinicTime(iso: string, format: string): string {
    return toClinicTime(iso).toFormat(format);
}

/** The clinic calendar date (yyyy-MM-dd) an ISO timestamp falls on, or null if invalid. */
export function clinicDate(iso: string): string | null {
    return toClinicTime(iso).toISODate();
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
 * openings on the last day are included.
 */
export function clinicDayRange(startDate: string, endDate: string): { startAt: string; endAt: string } {
    const start = DateTime.fromISO(startDate, { zone: clinicZone }).startOf('day');
    const end = DateTime.fromISO(endDate, { zone: clinicZone }).startOf('day').plus({ days: 1 });
    if (!start.isValid || !end.isValid) throw new Error(`Invalid date range ${startDate}..${endDate}`);
    return {
        startAt: start.toUTC().toISO({ suppressMilliseconds: true })!,
        endAt: end.toUTC().toISO({ suppressMilliseconds: true })!,
    };
}
