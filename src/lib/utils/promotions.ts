import { CartItem } from '@/types/product';

/**
 * Calculates the "Buy 2 Get 1 Free" discount for qualifying cart items.
 *
 * Rules:
 * - Only items belonging to the promo category qualify.
 * - Qualifying unit prices are sorted descending (most expensive first).
 * - For every 3 qualifying units, the cheapest of the trio (index 2, 5, 8 ...) is free.
 * - Returns 0 if fewer than 3 qualifying units are in the cart.
 *
 * @param cart         Current cart items
 * @param categoryId   Square catalog category ID that triggers the promotion
 * @returns            Total discount amount in dollars
 */
export function calculateB2G1Discount(cart: CartItem[], categoryId: string): number {
    if (!categoryId) return 0;

    const qualifyingPrices: number[] = [];

    for (const item of cart) {
        const categories: { id?: string }[] = item.product.itemData?.categories ?? [];
        const legacyCategoryId: string | undefined = (item.product.itemData as any)?.categoryId;

        const qualifies =
            legacyCategoryId === categoryId ||
            categories.some((c) => c.id === categoryId);

        if (qualifies) {
            const unitPrice = item.price ?? item.basePrice ?? 0;
            for (let i = 0; i < item.quantity; i++) {
                qualifyingPrices.push(unitPrice);
            }
        }
    }

    if (qualifyingPrices.length < 3) return 0;

    // sort descending: most expensive first
    qualifyingPrices.sort((a, b) => b - a);

    // every 3rd unit starting at index 2 is free (the cheapest of each trio)
    let discount = 0;
    for (let i = 2; i < qualifyingPrices.length; i += 3) {
        discount += qualifyingPrices[i];
    }

    return Math.round(discount * 100) / 100;
}

/**
 * Returns how many free items are included in a B2G1 discount given a set of qualifying units.
 * Useful for UI messaging (e.g. "1 item free").
 */
export function countB2G1FreeItems(cart: CartItem[], categoryId: string): number {
    if (!categoryId) return 0;

    let qualifyingCount = 0;

    for (const item of cart) {
        const categories: { id?: string }[] = item.product.itemData?.categories ?? [];
        const legacyCategoryId: string | undefined = (item.product.itemData as any)?.categoryId;

        const qualifies =
            legacyCategoryId === categoryId ||
            categories.some((c) => c.id === categoryId);

        if (qualifies) {
            qualifyingCount += item.quantity;
        }
    }

    return Math.floor(qualifyingCount / 3);
}
