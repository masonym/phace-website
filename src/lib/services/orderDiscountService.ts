import { SquareClient, SquareEnvironment } from 'square';
import { SimpleCouponService } from '@/lib/services/simpleCouponService';
import { calculateB2G1DiscountFromPrices } from '@/lib/utils/promotions';

const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
        process.env.SQUARE_ENVIRONMENT === 'production'
            ? SquareEnvironment.Production
            : SquareEnvironment.Sandbox,
});

interface OrderItemInput {
    variationId?: string;
    catalogObjectId?: string;
    quantity: number;
}

export interface ResolvedDiscount {
    name: string;
    code: string;
    couponCode: string | null;
    /** Total discount in dollars */
    discountAmount: number;
}

/**
 * Works out the order discount on the server from Square catalog prices.
 * Never trust a discount amount sent by the browser -- only the coupon code.
 */
export async function resolveOrderDiscount(
    items: OrderItemInput[],
    requestedCouponCode?: string | null
): Promise<ResolvedDiscount | null> {
    const variationIds = Array.from(new Set(
        items.map((item) => item.catalogObjectId || item.variationId).filter(Boolean) as string[]
    ));
    if (variationIds.length === 0) return null;

    const b2g1CategoryId = process.env.B2G1_PROMO_CATEGORY_ID || process.env.NEXT_PUBLIC_B2G1_PROMO_CATEGORY_ID || '';
    const hasCoupon = !!requestedCouponCode && requestedCouponCode.toUpperCase() !== 'B2G1';
    if (!hasCoupon && !b2g1CategoryId) return null;

    const result = await client.catalog.batchGet({
        objectIds: variationIds,
        includeRelatedObjects: true,
    });

    const unitPriceByVariation = new Map<string, number>();
    const itemIdByVariation = new Map<string, string>();
    for (const obj of result.objects ?? []) {
        if (obj.type !== 'ITEM_VARIATION') continue;
        const data = obj.itemVariationData;
        // Variable-priced items have no catalog price; they get no discount credit
        const cents = Number(data?.priceMoney?.amount ?? 0);
        unitPriceByVariation.set(obj.id, cents / 100);
        if (data?.itemId) itemIdByVariation.set(obj.id, data.itemId);
    }

    const categoryIdsByItem = new Map<string, string[]>();
    for (const obj of [...(result.relatedObjects ?? []), ...(result.objects ?? [])]) {
        if (obj.type !== 'ITEM') continue;
        const itemData = obj.itemData as any;
        const ids: string[] = (itemData?.categories ?? []).map((c: { id?: string }) => c.id).filter(Boolean);
        if (itemData?.categoryId) ids.push(itemData.categoryId);
        categoryIdsByItem.set(obj.id, ids);
    }

    let subtotal = 0;
    const qualifyingPrices: number[] = [];
    for (const item of items) {
        const id = item.catalogObjectId || item.variationId;
        if (!id) continue;
        const unitPrice = unitPriceByVariation.get(id) ?? 0;
        const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
        subtotal += unitPrice * quantity;

        const itemId = itemIdByVariation.get(id);
        const categories = itemId ? categoryIdsByItem.get(itemId) ?? [] : [];
        if (b2g1CategoryId && categories.includes(b2g1CategoryId)) {
            for (let i = 0; i < quantity; i++) qualifyingPrices.push(unitPrice);
        }
    }

    const b2g1Amount = calculateB2G1DiscountFromPrices(qualifyingPrices);

    let couponAmount = 0;
    let couponName: string | null = null;
    let couponCode: string | null = null;
    if (hasCoupon) {
        const coupon = await SimpleCouponService.validateCoupon(requestedCouponCode!);
        if (coupon) {
            // Matches the checkout preview: coupons apply to the product subtotal, not shipping
            couponAmount = SimpleCouponService.calculateDiscount(coupon, subtotal);
            couponName = coupon.name;
            couponCode = coupon.code;
        }
    }

    const discountAmount = Math.min(
        subtotal,
        Math.round((b2g1Amount + couponAmount) * 100) / 100
    );
    if (discountAmount <= 0) return null;

    const nameParts: string[] = [];
    if (b2g1Amount > 0) nameParts.push('Buy 2 Get 1 Free');
    if (couponName) nameParts.push(couponName);

    return {
        name: nameParts.join(' + '),
        code: couponCode ?? 'B2G1',
        couponCode,
        discountAmount,
    };
}
