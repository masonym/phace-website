import { clinicDate, clinicDayRange, formatClinicTime } from '@/lib/utils/clinicTime';

describe('formatClinicTime', () => {
    it('uses permanent UTC-7 from March 2026, matching Square', () => {
        // Janine's Nov 23 appointment Square shows at 10:00
        expect(formatClinicTime('2026-11-23T17:00:00Z', 'cccc, LLLL d, yyyy h:mm a'))
            .toBe('Monday, November 23, 2026 10:00 AM');
        expect(formatClinicTime('2027-01-15T17:00:00Z', 'h:mm a')).toBe('10:00 AM');
        expect(formatClinicTime('2026-07-10T17:00:00Z', 'h:mm a')).toBe('10:00 AM');
    });

    it('keeps old PST/PDT rules for earlier timestamps', () => {
        expect(formatClinicTime('2025-12-01T18:00:00Z', 'h:mm a')).toBe('10:00 AM');
        expect(formatClinicTime('2025-07-01T17:00:00Z', 'h:mm a')).toBe('10:00 AM');
        // last PST hour before the switch, then the first UTC-7 hour
        expect(formatClinicTime('2026-03-08T09:30:00Z', 'h:mm a')).toBe('1:30 AM');
        expect(formatClinicTime('2026-03-08T10:30:00Z', 'h:mm a')).toBe('3:30 AM');
    });
});

describe('clinicDate', () => {
    it('puts late-evening slots on the clinic day', () => {
        expect(clinicDate('2026-11-24T06:30:00Z')).toBe('2026-11-23'); // 11:30 PM
        expect(clinicDate('2026-11-24T07:00:00Z')).toBe('2026-11-24'); // midnight
    });
});

describe('clinicDayRange', () => {
    it('covers a whole winter day, including evenings', () => {
        expect(clinicDayRange('2026-11-23', '2026-11-23')).toEqual({
            startAt: '2026-11-23T07:00:00Z',
            endAt: '2026-11-24T07:00:00Z',
        });
    });

    it('covers a whole summer day', () => {
        expect(clinicDayRange('2026-07-10', '2026-07-10')).toEqual({
            startAt: '2026-07-10T07:00:00Z',
            endAt: '2026-07-11T07:00:00Z',
        });
    });

    it('no longer shifts in November', () => {
        expect(clinicDayRange('2026-10-29', '2026-11-04')).toEqual({
            startAt: '2026-10-29T07:00:00Z',
            endAt: '2026-11-05T07:00:00Z',
        });
    });

    it('rejects bad dates', () => {
        expect(() => clinicDayRange('nope', '2026-11-23')).toThrow();
    });
});
