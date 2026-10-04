import { NextResponse } from 'next/server';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { SquareClient, SquareEnvironment } from 'square';
import { SquareBookingService } from '@/lib/services/squareBookingService';

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
    tokenUse: 'id',
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
});

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
        process.env.SQUARE_ENVIRONMENT === 'production'
            ? SquareEnvironment.Production
            : SquareEnvironment.Sandbox,
});

const DAY_MS = 24 * 60 * 60 * 1000;
// Square only allows a 31-day range per bookings.list call
const WINDOW_DAYS = 31;
const PAST_DAYS = 93;
const FUTURE_DAYS = 124;
const MAX_APPOINTMENTS = 25;

function getToken(request: Request): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice('Bearer '.length).trim() || null;
    const match = (request.headers.get('cookie') ?? '').match(/(?:^|;\s*)idToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Upcoming and recent appointments for the signed-in customer.
 * The email always comes from the verified token, never from the query string.
 */
export async function GET(request: Request) {
    const token = getToken(request);
    if (!token) {
        return NextResponse.json({ error: 'Please sign in to see your appointments' }, { status: 401 });
    }

    let email: string;
    try {
        const payload = await verifier.verify(token);
        email = String(payload.email ?? '');
        if (!email) throw new Error('Token has no email');
    } catch (error) {
        console.error('my-appointments token verification failed:', error);
        return NextResponse.json({ error: 'Please sign in again' }, { status: 401 });
    }

    try {
        const customers = await client.customers.search({
            query: { filter: { emailAddress: { exact: email } } },
        });
        const customerIds = (customers.customers ?? []).map(c => c.id).filter(Boolean) as string[];
        if (customerIds.length === 0) return NextResponse.json([]);

        const locationId = await SquareBookingService.getLocationId();
        const now = Date.now();
        const bookingIds = new Set<string>();

        for (const customerId of customerIds) {
            for (let start = now - PAST_DAYS * DAY_MS; start < now + FUTURE_DAYS * DAY_MS; start += WINDOW_DAYS * DAY_MS) {
                const end = Math.min(start + WINDOW_DAYS * DAY_MS, now + FUTURE_DAYS * DAY_MS);
                const page = await client.bookings.list({
                    customerId,
                    locationId,
                    startAtMin: new Date(start).toISOString(),
                    startAtMax: new Date(end).toISOString(),
                });
                for await (const booking of page) {
                    if (booking.id && booking.status !== 'CANCELLED_BY_SELLER' && booking.status !== 'DECLINED') {
                        bookingIds.add(booking.id);
                    }
                }
            }
        }

        const details = await Promise.all(
            Array.from(bookingIds).slice(0, MAX_APPOINTMENTS).map(id => SquareBookingService.getAppointmentById(id))
        );

        const appointments = details
            .filter((apt): apt is NonNullable<typeof apt> => !!apt)
            .map(apt => ({
                id: apt.id,
                serviceName: apt.serviceNames.join(', '),
                staffName: apt.staffName,
                startTime: apt.startTime,
                endTime: new Date(new Date(apt.startTime).getTime() + (apt.totalDuration || 60) * 60000).toISOString(),
                totalPrice: apt.totalPrice,
                status: apt.status,
            }));

        return NextResponse.json(appointments);
    } catch (error) {
        console.error('Error fetching customer appointments:', error);
        return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 });
    }
}
