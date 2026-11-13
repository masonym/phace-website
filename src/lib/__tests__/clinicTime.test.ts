import { clinicDayRange } from '@/lib/utils/clinicTime';

describe('clinicDayRange', () => {
    it('covers a whole winter day, including evenings', () => {
        expect(clinicDayRange('2026-11-23', '2026-11-23')).toEqual({
            startAt: '2026-11-23T08:00:00Z',
            endAt: '2026-11-24T08:00:00Z',
        });
    });

    it('covers a whole summer day', () => {
        expect(clinicDayRange('2026-07-10', '2026-07-10')).toEqual({
            startAt: '2026-07-10T07:00:00Z',
            endAt: '2026-07-11T07:00:00Z',
        });
    });

    it('spans a multi-day batch across the DST change', () => {
        expect(clinicDayRange('2026-10-29', '2026-11-04')).toEqual({
            startAt: '2026-10-29T07:00:00Z',
            endAt: '2026-11-05T08:00:00Z',
        });
    });

    it('rejects bad dates', () => {
        expect(() => clinicDayRange('nope', '2026-11-23')).toThrow();
    });
});
