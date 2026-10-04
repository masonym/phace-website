/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../square-payment/route'
import { SimpleCouponService } from '@/lib/services/simpleCouponService'

// One shared client so the route and the tests see the same mocks
jest.mock('square', () => {
  const client = {
    orders: { create: jest.fn(), calculate: jest.fn() },
    payments: { create: jest.fn() },
    customers: { create: jest.fn() },
    catalog: { batchGet: jest.fn() },
  }
  return {
    SquareClient: jest.fn(() => client),
    SquareEnvironment: { Production: 'production', Sandbox: 'sandbox' },
    __mockClient: client,
  }
})

jest.mock('@/lib/services/emailService', () => ({
  EmailService: { sendOrderConfirmation: jest.fn().mockResolvedValue(undefined) },
}))

jest.mock('@/lib/services/simpleCouponService', () => ({
  SimpleCouponService: {
    validateCoupon: jest.fn(),
    calculateDiscount: jest.fn((coupon: { type: string; value: number }, total: number) =>
      coupon.type === 'PERCENTAGE' ? total * (coupon.value / 100) : Math.min(coupon.value, total)
    ),
    applyCoupon: jest.fn().mockResolvedValue(true),
  },
}))

const mockClient = require('square').__mockClient

const address = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '6045551234',
  street: '123 Test St',
  city: 'Test City',
  state: 'BC',
  zipCode: 'A1A 1A1',
  country: 'CA',
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/square-payment', {
    method: 'POST',
    body: JSON.stringify({
      sourceId: 'test-source-id',
      currency: 'CAD',
      items: [{ variationId: 'VAR1', quantity: 1, basePrice: 20, price: 20 }],
      shippingAddress: address,
      locationId: 'test-location-id',
      fulfillmentMethod: 'pickup',
      ...body,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

function catalogWith(variations: { id: string; cents: number; itemId: string; categories?: string[] }[]) {
  return {
    objects: variations.map((v) => ({
      type: 'ITEM_VARIATION',
      id: v.id,
      itemVariationData: { itemId: v.itemId, priceMoney: { amount: BigInt(v.cents), currency: 'CAD' } },
    })),
    relatedObjects: variations.map((v) => ({
      type: 'ITEM',
      id: v.itemId,
      itemData: { categories: (v.categories ?? []).map((id) => ({ id })) },
    })),
  }
}

describe('/api/square-payment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.B2G1_PROMO_CATEGORY_ID
    delete process.env.NEXT_PUBLIC_B2G1_PROMO_CATEGORY_ID
    mockClient.orders.create.mockResolvedValue({
      order: { id: 'test-order-id', totalMoney: { amount: BigInt(2000), currency: 'CAD' }, lineItems: [] },
    })
    mockClient.customers.create.mockResolvedValue({ customer: { id: 'cust-1' } })
    mockClient.payments.create.mockResolvedValue({ payment: { id: 'pay-1', status: 'COMPLETED' } })
    mockClient.catalog.batchGet.mockResolvedValue(catalogWith([{ id: 'VAR1', cents: 2000, itemId: 'ITEM1' }]))
  })

  it('creates a pickup fulfillment', async () => {
    const response = await POST(makeRequest({ fulfillmentMethod: 'pickup' }))
    expect(response.status).toBe(200)

    const { order } = mockClient.orders.create.mock.calls[0][0]
    expect(order.fulfillments[0]).toEqual(expect.objectContaining({
      type: 'PICKUP',
      pickupDetails: expect.objectContaining({ recipient: { displayName: 'John Doe' } }),
    }))
    expect(order.serviceCharges).toBeUndefined()
  })

  it('creates a shipping fulfillment with the flat shipping charge', async () => {
    const response = await POST(makeRequest({ fulfillmentMethod: 'shipping' }))
    expect(response.status).toBe(200)

    const { order } = mockClient.orders.create.mock.calls[0][0]
    expect(order.fulfillments[0].type).toBe('SHIPMENT')
    expect(order.fulfillments[0].shipmentDetails.recipient.address.addressLine1).toBe('123 Test St')
    expect(order.serviceCharges[0].amountMoney.amount).toBe(BigInt(2500))
  })

  it('charges the amount Square calculated, not one from the browser', async () => {
    await POST(makeRequest({ amount: 1 }))
    expect(mockClient.payments.create.mock.calls[0][0].amountMoney.amount).toBe(BigInt(2000))
  })

  it('ignores a discount amount sent by the browser', async () => {
    ;(SimpleCouponService.validateCoupon as jest.Mock).mockResolvedValue(null)

    await POST(makeRequest({
      discount: { code: 'FAKE', name: 'Fake', discountAmount: 19.99 },
    }))

    const { order } = mockClient.orders.create.mock.calls[0][0]
    expect(order.discounts).toBeUndefined()
    expect(SimpleCouponService.applyCoupon).not.toHaveBeenCalled()
  })

  it('applies a valid coupon using catalog prices and counts the use', async () => {
    ;(SimpleCouponService.validateCoupon as jest.Mock).mockResolvedValue({
      code: 'SAVE10', name: '10% off', type: 'PERCENTAGE', value: 10,
    })

    await POST(makeRequest({
      items: [{ variationId: 'VAR1', quantity: 2, basePrice: 1, price: 1 }],
      // A tampered amount must not matter; 10% of 2 x $20 is $4
      discount: { code: 'SAVE10', name: '10% off', discountAmount: 500 },
    }))

    const { order } = mockClient.orders.create.mock.calls[0][0]
    expect(order.discounts[0].amountMoney.amount).toBe(BigInt(400))
    expect(SimpleCouponService.applyCoupon).toHaveBeenCalledWith('SAVE10')
  })

  it('applies buy 2 get 1 free to qualifying items only', async () => {
    process.env.B2G1_PROMO_CATEGORY_ID = 'PROMO'
    mockClient.catalog.batchGet.mockResolvedValue(catalogWith([
      { id: 'A', cents: 3000, itemId: 'IA', categories: ['PROMO'] },
      { id: 'B', cents: 2000, itemId: 'IB', categories: ['PROMO'] },
      { id: 'C', cents: 1000, itemId: 'IC', categories: ['PROMO'] },
      { id: 'D', cents: 500, itemId: 'ID', categories: ['OTHER'] },
    ]))

    await POST(makeRequest({
      items: ['A', 'B', 'C', 'D'].map((id) => ({ variationId: id, quantity: 1, price: 1 })),
    }))

    const { order } = mockClient.orders.create.mock.calls[0][0]
    // Cheapest qualifying item (C, $10) is free; D isn't in the promo
    expect(order.discounts[0].amountMoney.amount).toBe(BigInt(1000))
    expect(order.discounts[0].name).toContain('Buy 2 Get 1 Free')
  })

  it('takes a pickup card payment without an address', async () => {
    const response = await POST(makeRequest({
      fulfillmentMethod: 'pickup',
      shippingAddress: { ...address, street: '', city: '', state: '', zipCode: '' },
    }))
    expect(response.status).toBe(200)
    expect(mockClient.customers.create.mock.calls[0][0].address).toBeUndefined()
    expect(mockClient.payments.create.mock.calls[0][0].shippingAddress).toBeUndefined()
  })
})
