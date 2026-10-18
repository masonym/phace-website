/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../discount/validate/route'
import { SimpleCouponService } from '@/lib/services/simpleCouponService'

jest.mock('square', () => {
  const client = { catalog: { batchGet: jest.fn() } }
  return {
    SquareClient: jest.fn(() => client),
    SquareEnvironment: { Production: 'production', Sandbox: 'sandbox' },
    __mockClient: client,
  }
})

jest.mock('@/lib/services/simpleCouponService', () => ({
  SimpleCouponService: {
    validateCoupon: jest.fn(),
    calculateDiscount: jest.fn((coupon: { type: string; value: number }, total: number) =>
      coupon.type === 'PERCENTAGE' ? total * (coupon.value / 100) : Math.min(coupon.value, total)
    ),
  },
}))

const mockClient = require('square').__mockClient

function makeRequest(code: string, variationIds: string[]) {
  return new NextRequest('http://localhost:3000/api/discount/validate', {
    method: 'POST',
    body: JSON.stringify({
      code,
      // A browser-sent subtotal must not matter
      orderAmount: 9999,
      cartItems: variationIds.map((id) => ({ selectedVariation: { id }, quantity: 1, price: 1 })),
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

const catalog = {
  objects: [
    { type: 'ITEM_VARIATION', id: 'A', itemVariationData: { itemId: 'IA', priceMoney: { amount: BigInt(5000) } } },
    { type: 'ITEM_VARIATION', id: 'B', itemVariationData: { itemId: 'IB', priceMoney: { amount: BigInt(3000) } } },
  ],
  relatedObjects: [
    { type: 'ITEM', id: 'IA', itemData: { categories: [{ id: 'PHAE' }] } },
    { type: 'ITEM', id: 'IB', itemData: { categories: [{ id: 'OTHER' }] } },
  ],
}

describe('/api/discount/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockClient.catalog.batchGet.mockResolvedValue(catalog)
  })

  it('discounts the whole cart at catalog prices when the code has no categories', async () => {
    ;(SimpleCouponService.validateCoupon as jest.Mock).mockResolvedValue({
      code: 'SAVE10', name: '10% off', type: 'PERCENTAGE', value: 10,
    })

    const result = await (await POST(makeRequest('SAVE10', ['A', 'B']))).json()

    expect(result.valid).toBe(true)
    expect(result.discount.discountAmount).toBe(8)
  })

  it('only discounts items in the code\'s categories', async () => {
    ;(SimpleCouponService.validateCoupon as jest.Mock).mockResolvedValue({
      code: 'PALM', name: 'Palm Springs', type: 'FIXED_AMOUNT', value: 60, categoryIds: ['PHAE'],
    })

    const result = await (await POST(makeRequest('PALM', ['A', 'B']))).json()

    // Capped at the $50 Phae item, not the $80 cart
    expect(result.valid).toBe(true)
    expect(result.discount.discountAmount).toBe(50)
  })

  it('rejects a category code when nothing in the cart qualifies', async () => {
    ;(SimpleCouponService.validateCoupon as jest.Mock).mockResolvedValue({
      code: 'PALM', name: 'Palm Springs', type: 'PERCENTAGE', value: 20, categoryIds: ['PHAE'],
    })

    const result = await (await POST(makeRequest('PALM', ['B']))).json()

    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/doesn't apply/)
  })

  it('rejects an unknown code', async () => {
    ;(SimpleCouponService.validateCoupon as jest.Mock).mockResolvedValue(null)

    const result = await (await POST(makeRequest('NOPE', ['A']))).json()

    expect(result.valid).toBe(false)
  })
})
