import { SquareClient, SquareEnvironment, Square } from 'square';
import { SquareBookingService } from '@/lib/services/squareBookingService';
import { AdminBookingService, type AdminStaffMember } from '@/lib/services/adminBookingService';
import { isBookableCategory } from '@/lib/config/booking';
import { CATEGORIES_WITHOUT_ADDONS, getAllowedAddonIds } from '@/lib/config/addonConfig';

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
        process.env.SQUARE_ENVIRONMENT === 'production'
            ? SquareEnvironment.Production
            : SquareEnvironment.Sandbox,
});

export interface AdminCategory {
    id: string;
    name: string;
    /** Shown as a category in the online booking flow */
    bookable: boolean;
    /** Listed in CATEGORIES_WITHOUT_ADDONS, so the add-on step is skipped */
    addonsExcluded: boolean;
}

export interface AdminServiceVariation {
    id: string;
    name: string;
    /** cents */
    price: number;
    /** Priced at the time of the visit rather than up front */
    variablePrice: boolean;
    durationMs: number;
    staffIds: string[];
    availableForBooking: boolean;
}

export interface AdminService {
    id: string;
    name: string;
    description?: string;
    categoryIds: string[];
    variations: AdminServiceVariation[];
    /** Add-ons the booking flow offers with this service */
    addonIds: string[];
}

export interface AdminAddon {
    id: string;
    name: string;
    description?: string;
    /** cents */
    price: number;
    durationMs: number;
    isActive: boolean;
}

export interface CatalogSnapshot {
    categories: AdminCategory[];
    services: AdminService[];
    addons: AdminAddon[];
    staff: AdminStaffMember[];
}

async function listTopLevelCategories(): Promise<AdminCategory[]> {
    const categories: AdminCategory[] = [];
    for await (const obj of await client.catalog.list({ types: 'CATEGORY' })) {
        if (obj.type !== 'CATEGORY' || !obj.id || !obj.categoryData?.isTopLevel) continue;
        const category = { id: obj.id, name: obj.categoryData.name || 'Unnamed Category' };
        categories.push({
            ...category,
            bookable: isBookableCategory(category),
            addonsExcluded: CATEGORIES_WITHOUT_ADDONS.includes(obj.id),
        });
    }
    return categories.sort((a, b) => a.name.localeCompare(b.name));
}

async function listServiceItems(): Promise<Square.CatalogObjectItem[]> {
    const items: Square.CatalogObjectItem[] = [];
    let cursor: string | undefined;
    do {
        const result = await client.catalog.searchItems({ productTypes: ['APPOINTMENTS_SERVICE'], cursor });
        items.push(...((result.items ?? []).filter(i => i.type === 'ITEM') as Square.CatalogObjectItem[]));
        cursor = result.cursor || undefined;
    } while (cursor);
    return items;
}

function itemCategoryIds(item: Square.CatalogItem): string[] {
    const ids = item.categories?.map(c => c.id).filter((id): id is string => !!id) ?? [];
    return ids.length > 0 ? ids : [item.categoryId].filter((id): id is string => !!id);
}

export class AdminCatalogService {
    /** Everything the Services, Add-ons and Staff pages show, read straight from Square */
    static async getSnapshot(): Promise<CatalogSnapshot> {
        const [categories, items, rawAddons, staff] = await Promise.all([
            listTopLevelCategories(),
            listServiceItems(),
            SquareBookingService.getAllAddons(),
            AdminBookingService.listStaff(),
        ]);

        const addons: AdminAddon[] = rawAddons
            .map(a => ({
                id: a.id,
                name: a.name,
                description: a.description,
                price: a.price,
                durationMs: a.duration,
                isActive: a.isActive,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const addonIds = new Set(addons.map(a => a.id));
        const allAddonIds = addons.map(a => a.id);

        const services: AdminService[] = items
            // Add-ons are bookable services in Square too; they get their own page
            .filter(item => !addonIds.has(item.id))
            .map(item => {
                const data = item.itemData!;
                const categoryIds = itemCategoryIds(data);
                return {
                    id: item.id,
                    name: data.name || 'Unnamed Service',
                    description: data.descriptionPlaintext || data.description || undefined,
                    categoryIds,
                    variations: ((data.variations ?? []).filter(v => v.type === 'ITEM_VARIATION') as Square.CatalogObjectItemVariation[])
                        .map(v => ({
                            id: v.id!,
                            name: v.itemVariationData?.name || 'Regular',
                            price: Number(v.itemVariationData?.priceMoney?.amount ?? 0),
                            variablePrice: v.itemVariationData?.pricingType === 'VARIABLE_PRICING',
                            durationMs: Number(v.itemVariationData?.serviceDuration ?? 0),
                            staffIds: v.itemVariationData?.teamMemberIds ?? [],
                            availableForBooking: v.itemVariationData?.availableForBooking !== false,
                        })),
                    addonIds: getAllowedAddonIds({ id: item.id, categoryIds }, allAddonIds),
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        return { categories, services, addons, staff };
    }
}
