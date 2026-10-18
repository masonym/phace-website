import { SquareClient, SquareEnvironment } from 'square';
import { SimpleCouponService, SimpleCoupon } from '@/lib/services/simpleCouponService';
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

export interface CouponPreview {
    coupon: SimpleCoupon;
    /** Coupon discount in dollars */
    discountAmount: number;
    /** Subtotal of the items the coupon applies to */
    eligibleSubtotal: number;
}

interface PricedLine {
    unitPrice: number;
    quantity: number;
    categoryIds: string[];
}

/**
 * Prices the cart from the Square catalog and attaches each line's category IDs.
 */
async function loadPricedLines(items: OrderItemInput[]): Promise<PricedLine[]> {
    const variationIds = Array.from(new Set(
        items.map((item) => item.catalogObjectId || item.variationId).filter(Boolean) as string[]
    ));
    if (variationIds.length === 0) return [];

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

    const lines: PricedLine[] = [];
    for (const item of items) {
        const id = item.catalogObjectId || item.variationId;
        if (!id) continue;
        const itemId = itemIdByVariation.get(id);
        lines.push({
            unitPrice: unitPriceByVariation.get(id) ?? 0,
            quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)),
            categoryIds: itemId ? categoryIdsByItem.get(itemId) ?? [] : [],
        });
    }
    return lines;
}

/**
 * Subtotal of the lines a coupon covers. A coupon with no categories covers the whole order.
 */
function couponEligibleSubtotal(lines: PricedLine[], coupon: SimpleCoupon): number {
    const scope = coupon.categoryIds ?? [];
    return lines
        .filter((line) => scope.length === 0 || line.categoryIds.some((id) => scope.includes(id)))
        .reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

/**
 * Works out the order discount on the server from Square catalog prices.
 * Never trust a discount amount sent by the browser -- only the coupon code.
 */
export async function resolveOrderDiscount(
    items: OrderItemInput[],
    requestedCouponCode?: string | null
): Promise<ResolvedDiscount | null> {
    const b2g1CategoryId = process.env.B2G1_PROMO_CATEGORY_ID || process.env.NEXT_PUBLIC_B2G1_PROMO_CATEGORY_ID || '';
    const hasCoupon = !!requestedCouponCode && requestedCouponCode.toUpperCase() !== 'B2G1';
    if (!hasCoupon && !b2g1CategoryId) return null;

    const lines = await loadPricedLines(items);
    if (lines.length === 0) return null;

    let subtotal = 0;
    const qualifyingPrices: number[] = [];
    for (const line of lines) {
        subtotal += line.unitPrice * line.quantity;
        if (b2g1CategoryId && line.categoryIds.includes(b2g1CategoryId)) {
            for (let i = 0; i < line.quantity; i++) qualifyingPrices.push(line.unitPrice);
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
            couponAmount = SimpleCouponService.calculateDiscount(coupon, couponEligibleSubtotal(lines, coupon));
            if (couponAmount > 0) {
                couponName = coupon.name;
                couponCode = coupon.code;
            }
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

/**
 * Coupon-only discount for the checkout preview (B2G1 is shown separately there).
 * Returns null if the code is invalid; discountAmount is 0 if nothing in the cart qualifies.
 */
export async function previewCouponDiscount(
    items: OrderItemInput[],
    couponCode: string
): Promise<CouponPreview | null> {
    const coupon = await SimpleCouponService.validateCoupon(couponCode);
    if (!coupon) return null;

    const lines = await loadPricedLines(items);
    const eligibleSubtotal = couponEligibleSubtotal(lines, coupon);
    const discountAmount = Math.round(SimpleCouponService.calculateDiscount(coupon, eligibleSubtotal) * 100) / 100;
    return { coupon, discountAmount, eligibleSubtotal };
}
