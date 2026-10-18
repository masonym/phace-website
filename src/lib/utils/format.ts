/**
 * Square returns money in cents and service durations in milliseconds.
 * These keep admin pages from printing raw values as dollars and minutes.
 */

/** 4500 -> "$45.00" (CAD). Accepts bigint since the Square SDK uses it for amounts. */
export function formatMoney(cents: number | bigint | null | undefined): string {
    const dollars = Number(cents ?? 0) / 100;
    return dollars.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
}

/** 5400000 -> "1 hr 30 min", 1800000 -> "30 min" */
export function formatDuration(ms: number | bigint | null | undefined): string {
    const totalMinutes = Math.round(Number(ms ?? 0) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} min`;
    return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}
