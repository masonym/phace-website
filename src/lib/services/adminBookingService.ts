import { SquareClient, SquareEnvironment, Square } from 'square';

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
        process.env.SQUARE_ENVIRONMENT === 'production'
            ? SquareEnvironment.Production
            : SquareEnvironment.Sandbox,
});

const DAY_MS = 24 * 60 * 60 * 1000;
// Square only allows a 31-day range per bookings.list call
const WINDOW_MS = 31 * DAY_MS;
// The calendar never asks for more than a month view (6 weeks); this caps runaway requests
export const MAX_RANGE_DAYS = 62;

export interface AdminStaffMember {
    id: string;
    name: string;
    isBookable: boolean;
}

export interface AdminAppointment {
    id: string;
    status: Square.BookingStatus;
    startAt: string;
    endAt: string;
    staffId: string;
    staffName: string;
    services: string[];
    addons: string[];
    customer: {
        name?: string;
        email?: string;
        phone?: string;
    };
    sellerNote?: string;
    customerNote?: string;
}

async function collectPages<T>(page: AsyncIterable<T>): Promise<T[]> {
    const items: T[] = [];
    for await (const item of page) items.push(item);
    return items;
}

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
}

async function getCustomers(ids: string[]): Promise<Record<string, Square.Customer>> {
    const customers: Record<string, Square.Customer> = {};
    // bulkRetrieveCustomers takes at most 100 IDs
    for (const batch of chunk([...new Set(ids)], 100)) {
        const result = await client.customers.bulkRetrieveCustomers({ customerIds: batch });
        for (const [id, response] of Object.entries(result.responses ?? {})) {
            if (response.customer) customers[id] = response.customer;
        }
    }
    return customers;
}

interface VariationInfo {
    name: string;
    isAddon: boolean;
}

/** Service variation ID -> display name, and whether it's an add-on (lives in the add-on category) */
async function getVariations(ids: string[]): Promise<Record<string, VariationInfo>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return {};

    const addonCategoryId = process.env.SQUARE_ADDON_CATEGORY_ID;
    const result = await client.catalog.batchGet({ objectIds: unique, includeRelatedObjects: true });

    const items = new Map<string, Square.CatalogItem>();
    for (const obj of result.relatedObjects ?? []) {
        if (obj.type === 'ITEM' && obj.itemData) items.set(obj.id, obj.itemData);
    }

    const variations: Record<string, VariationInfo> = {};
    for (const obj of result.objects ?? []) {
        if (obj.type !== 'ITEM_VARIATION' || !obj.itemVariationData) continue;

        const variation = obj.itemVariationData;
        const item = variation.itemId ? items.get(variation.itemId) : undefined;
        const itemName = item?.name ?? variation.name ?? 'Service';
        const variationName = variation.name;
        const showVariation = variationName && variationName !== 'Regular' && variationName !== itemName;

        variations[obj.id] = {
            name: showVariation ? `${itemName} – ${variationName}` : itemName,
            isAddon: !!addonCategoryId && (
                item?.categories?.some(c => c.id === addonCategoryId) ||
                (item as any)?.categoryId === addonCategoryId
            ),
        };
    }
    return variations;
}

export class AdminBookingService {
    static async listStaff(): Promise<AdminStaffMember[]> {
        const profiles = await collectPages(await client.bookings.teamMemberProfiles.list({}));
        return profiles
            .filter(p => p.teamMemberId)
            .map(p => ({
                id: p.teamMemberId!,
                name: p.displayName || 'Unnamed',
                isBookable: !!p.isBookable,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /** Appointments starting in [start, end), optionally for one staff member */
    static async listAppointments(start: Date, end: Date, staffId?: string): Promise<AdminAppointment[]> {
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;
        const bookings = new Map<string, Square.Booking>();

        for (let windowStart = start.getTime(); windowStart < end.getTime(); windowStart += WINDOW_MS) {
            const windowEnd = Math.min(windowStart + WINDOW_MS, end.getTime());
            const page = await client.bookings.list({
                locationId,
                teamMemberId: staffId || undefined,
                startAtMin: new Date(windowStart).toISOString(),
                startAtMax: new Date(windowEnd).toISOString(),
            });
            for (const booking of await collectPages(page)) {
                // Declined requests never made it onto the schedule
                if (booking.id && booking.status !== 'DECLINED') bookings.set(booking.id, booking);
            }
        }

        const list = [...bookings.values()];
        const [customers, variations, staff] = await Promise.all([
            getCustomers(list.map(b => b.customerId).filter((id): id is string => !!id)),
            getVariations(list.flatMap(b => (b.appointmentSegments ?? []).map(s => s.serviceVariationId).filter((id): id is string => !!id))),
            AdminBookingService.listStaff(),
        ]);
        const staffNames = new Map(staff.map(s => [s.id, s.name]));

        return list.map(booking => {
            const segments = booking.appointmentSegments ?? [];
            const durationMinutes = segments.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
            const startAt = booking.startAt!;
            const staffMemberId = segments[0]?.teamMemberId ?? '';
            const customer = booking.customerId ? customers[booking.customerId] : undefined;

            const services: string[] = [];
            const addons: string[] = [];
            for (const segment of segments) {
                const info = segment.serviceVariationId ? variations[segment.serviceVariationId] : undefined;
                (info?.isAddon ? addons : services).push(info?.name ?? 'Service');
            }

            return {
                id: booking.id!,
                status: booking.status ?? 'PENDING',
                startAt,
                endAt: new Date(new Date(startAt).getTime() + durationMinutes * 60000).toISOString(),
                staffId: staffMemberId,
                staffName: staffNames.get(staffMemberId) ?? 'Unknown staff',
                services,
                addons,
                customer: {
                    name: [customer?.givenName, customer?.familyName].filter(Boolean).join(' ') || undefined,
                    email: customer?.emailAddress ?? undefined,
                    phone: customer?.phoneNumber ?? undefined,
                },
                sellerNote: booking.sellerNote || undefined,
                customerNote: booking.customerNote || undefined,
            };
        }).sort((a, b) => a.startAt.localeCompare(b.startAt));
    }
}
