import { HIDDEN_CATEGORY_IDS } from '@/lib/config/storeConfig';

/** staffId value meaning "any provider who offers this service" */
export const ANY_STAFF_ID = 'any';

/** Square categories that exist for retail/promos and shouldn't be offered as bookable services */
const EXCLUDED_BOOKING_CATEGORY_NAMES = [
    'add-ons',
    'gift cards',
    'retail',
    'black friday service packages',
    'buy 2 get 1 free',
    'paz retail',
];

export function isBookableCategory(category: { id: string; name?: string; isActive?: boolean }): boolean {
    if (category.isActive === false) return false;
    if (HIDDEN_CATEGORY_IDS.includes(category.id)) return false;
    return !EXCLUDED_BOOKING_CATEGORY_NAMES.includes((category.name ?? '').toLowerCase().trim());
}
