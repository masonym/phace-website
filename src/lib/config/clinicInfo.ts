/**
 * Single source of truth for clinic contact details and hours.
 * Used by the footer, home page, contact page, booking confirmation and structured data.
 */
export const CLINIC = {
    name: 'Phace Medical Aesthetics',
    street: '42333 Yarrow Central Rd',
    city: 'Chilliwack',
    province: 'BC',
    postalCode: 'V2R 5E1',
    country: 'CA',
    phoneDisplay: '(778) 864-0624',
    phoneHref: 'tel:+17788640624',
    phoneE164: '+17788640624',
    email: 'hello@phace.ca',
    googleMapsPlaceId: 'ChIJwQQwelhHhFQRnUFtj2tusQ4',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=42333+Yarrow+Central+Rd%2C+Chilliwack%2C+BC+V2R+5E1&destination_place_id=ChIJwQQwelhHhFQRnUFtj2tusQ4',
    geo: { lat: 49.1329, lng: -122.0841 },
} as const;

export const CLINIC_ADDRESS_ONE_LINE = `${CLINIC.street}, ${CLINIC.city}, ${CLINIC.province} ${CLINIC.postalCode}`;

export interface OpeningHours {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    /** 24h "HH:MM", or null when closed */
    opens: string | null;
    closes: string | null;
}

export const OPENING_HOURS: OpeningHours[] = [
    { day: 'Monday', opens: null, closes: null },
    { day: 'Tuesday', opens: '10:00', closes: '19:00' },
    { day: 'Wednesday', opens: '10:00', closes: '16:00' },
    { day: 'Thursday', opens: '10:00', closes: '19:00' },
    { day: 'Friday', opens: '10:00', closes: '16:00' },
    { day: 'Saturday', opens: '10:00', closes: '14:00' },
    { day: 'Sunday', opens: null, closes: null },
];

function formatHour(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** e.g. "Tuesday: 10 AM - 7 PM" or "Monday: Closed" */
export function formatOpeningHours(hours: OpeningHours): string {
    if (!hours.opens || !hours.closes) return `${hours.day}: Closed`;
    return `${hours.day}: ${formatHour(hours.opens)} - ${formatHour(hours.closes)}`;
}
