import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';

// In-memory cache with TTL (per process)
// Key: variationId, Value: { priceCents: number, appliedDiscounts: string[], expiresAt: number }
const cache = new Map<string, { priceCents: number; appliedDiscounts: string[]; expiresAt: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variationIds, locationId: reqLocationId } = body || {};

    if (!Array.isArray(variationIds) || variationIds.length === 0) {
      return NextResponse.json({ error: 'variationIds is required and must be a non-empty array' }, { status: 400 });
    }

    const locationId = reqLocationId || process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    if (!locationId) {
      return NextResponse.json({ error: 'Square locationId is missing. Set NEXT_PUBLIC_SQUARE_LOCATION_ID.' }, { status: 500 });
    }

    // For preview, omit fulfillments entirely to avoid extra required fields

    // Resolve previews, using cache per-variation. We do per-variation calculate calls to avoid cross-item rule interactions.
    const results: Array<{ variationId: string; discountedUnitPriceCents: number; appliedDiscounts: string[] }> = [];
    const now = Date.now();

    // Separate cached and uncached variations
    const uncachedVariations: string[] = [];
    for (const vid of variationIds) {
      const cached = cache.get(vid);
      if (cached && cached.expiresAt > now) {
        results.push({ variationId: vid, discountedUnitPriceCents: cached.priceCents, appliedDiscounts: cached.appliedDiscounts });
      } else {
        uncachedVariations.push(vid);
      }
    }

    // Process uncached variations in parallel batches to avoid overwhelming Square API
    const BATCH_SIZE = 10; // Limit concurrent requests
    const timeoutMs = 8000; // 8 second timeout per request

    for (let i = 0; i < uncachedVariations.length; i += BATCH_SIZE) {
      const batch = uncachedVariations.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (vid) => {
        try {
          const order: any = {
            locationId,
            pricingOptions: { autoApplyDiscounts: true, autoApplyTaxes: true },
            lineItems: [
              {
                catalogObjectId: vid,
                quantity: '1',
              },
            ],
          };

          // Add timeout wrapper
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
          });

          const calculatePromise = client.orders.calculate({ order });
          const resp = await Promise.race([calculatePromise, timeoutPromise]) as any;
          
          const li = resp.order?.lineItems?.[0];
          const gross = Number(li?.grossSalesMoney?.amount ?? 0);
          const disc = Number(li?.totalDiscountMoney?.amount ?? 0);
          const discounted = Math.max(0, gross - disc);

          const appliedDiscountNames: string[] = [];
          const orderDiscounts = resp.order?.discounts as any[] | undefined;
          if (orderDiscounts && Array.isArray(orderDiscounts)) {
            for (const d of orderDiscounts) {
              if (d?.name) appliedDiscountNames.push(String(d.name));
            }
          }

          cache.set(vid, { priceCents: discounted, appliedDiscounts: appliedDiscountNames, expiresAt: now + TTL_MS });
          return { variationId: vid, discountedUnitPriceCents: discounted, appliedDiscounts: appliedDiscountNames };
        } catch (error) {
          console.error(`Failed to fetch preview for variation ${vid}:`, error);
          // Return original price as fallback
          return { variationId: vid, discountedUnitPriceCents: 0, appliedDiscounts: [] };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Also provide the minimum price across variations for convenience
    const minDiscountedUnitPriceCents = results.reduce((min, r) => (min === null || r.discountedUnitPriceCents < (min as number) ? r.discountedUnitPriceCents : (min as number)), null as number | null);

    return NextResponse.json({ results, minDiscountedUnitPriceCents });
  } catch (error: any) {
    const detail = error?.body?.errors?.[0]?.detail || error?.message || 'An unexpected error occurred';
    console.error('[Square Preview Variations Error]', { detail, raw: error?.body || error });
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
